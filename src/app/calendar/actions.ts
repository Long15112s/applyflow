"use server";

import { revalidatePath } from "next/cache";
import { CalendarEventStatus, CalendarEventType } from "@/generated/prisma/enums";
import { CALENDAR_EVENT_TYPE_LABELS } from "@/lib/calendar";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type CalendarActionState = { error: string | null; success?: boolean };

const eventTypes = new Set(Object.values(CalendarEventType));
const eventStatuses = new Set(Object.values(CalendarEventStatus));

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string, max: number, label: string) {
  const value = text(formData, name);
  if (!value) return null;
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value;
}

function requiredText(formData: FormData, name: string, max: number, label: string) {
  const value = text(formData, name);
  if (!value) throw new Error(`${label} is required.`);
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value;
}

function validateDateAndTimeParts(formData: FormData) {
  const dateValue = text(formData, "eventDate");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) throw new Error("Date is invalid.");
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("Date is invalid.");

  const validateClock = (prefix: "start" | "end", label: string, optional: boolean) => {
    const hour = text(formData, `${prefix}Hour`); const minute = text(formData, `${prefix}Minute`);
    if (optional && !hour && !minute) return;
    if (!/^(?:[01]\d|2[0-3])$/.test(hour)) throw new Error(`${label} hour must be between 00 and 23.`);
    if (!/^[0-5]\d$/.test(minute)) throw new Error(`${label} minute must be between 00 and 59.`);
  };
  validateClock("start", "Start time", false);
  validateClock("end", "End time", true);
}

function parseDate(formData: FormData, name: string, label: string, optional = false) {
  const value = text(formData, name);
  if (!value && optional) return null;
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  return date;
}

function parseTimeZone(formData: FormData) {
  const timeZone = requiredText(formData, "timeZone", 100, "Time zone");
  try { new Intl.DateTimeFormat("en", { timeZone }).format(); } catch { throw new Error("Time zone is invalid."); }
  return timeZone;
}

function parseMeetingUrl(formData: FormData) {
  const value = optionalText(formData, "meetingUrl", 2048, "Meeting URL");
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url.toString();
  } catch { throw new Error("Meeting URL must be a valid HTTP or HTTPS URL."); }
}

function parseType(formData: FormData) {
  const value = text(formData, "type");
  if (!eventTypes.has(value as CalendarEventType)) throw new Error("Event type is invalid.");
  return value as CalendarEventType;
}

function parseStatus(formData: FormData) {
  const value = text(formData, "status");
  if (!eventStatuses.has(value as CalendarEventStatus)) throw new Error("Event status is invalid.");
  return value as CalendarEventStatus;
}

function values(formData: FormData, includeStatus = false) {
  validateDateAndTimeParts(formData);
  const startsAt = parseDate(formData, "startsAt", "Start time")!;
  const endsAt = parseDate(formData, "endsAt", "End time", true);
  if (endsAt && endsAt <= startsAt) throw new Error("End time must be after the start time.");
  return {
    title: requiredText(formData, "title", 160, "Title"),
    type: parseType(formData),
    ...(includeStatus ? { status: parseStatus(formData) } : {}),
    startsAt,
    endsAt,
    timeZone: parseTimeZone(formData),
    location: optionalText(formData, "location", 200, "Location"),
    meetingUrl: parseMeetingUrl(formData),
    notes: optionalText(formData, "notes", 5000, "Notes")
  };
}

function errorState(error: unknown): CalendarActionState {
  return { error: error instanceof Error ? error.message : "Something went wrong." };
}

function revalidateCalendar(applicationId: string) {
  revalidatePath("/calendar");
  revalidatePath(`/applications/${applicationId}`);
}

export async function createCalendarEvent(_state: CalendarActionState, formData: FormData): Promise<CalendarActionState> {
  const user = await requireUser();
  try {
    const applicationId = requiredText(formData, "applicationId", 100, "Application");
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id }, select: { id: true }
    });
    if (!application) throw new Error("Application not found.");
    const data = values(formData);
    await prisma.$transaction(async tx => {
      await tx.calendarEvent.create({ data: { ...data, userId: user.id, applicationId: application.id } });
      await tx.applicationEvent.create({
        data: {
          applicationId: application.id,
          type: "CALENDAR_EVENT_CREATED",
          description: `${CALENDAR_EVENT_TYPE_LABELS[data.type]} scheduled for ${new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: data.timeZone }).format(data.startsAt)}`
        }
      });
    });
    revalidateCalendar(application.id);
    return { error: null, success: true };
  } catch (error) { return errorState(error); }
}

export async function updateCalendarEvent(_state: CalendarActionState, formData: FormData): Promise<CalendarActionState> {
  const user = await requireUser();
  try {
    const eventId = requiredText(formData, "eventId", 100, "Event");
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId: user.id }, select: { id: true, applicationId: true, status: true }
    });
    if (!existing) throw new Error("Calendar event not found.");
    const data = values(formData, true);
    await prisma.$transaction(async tx => {
      await tx.calendarEvent.update({ where: { id: existing.id }, data });
      await tx.applicationEvent.create({
        data: {
          applicationId: existing.applicationId,
          type: data.status === CalendarEventStatus.CANCELLED && existing.status !== CalendarEventStatus.CANCELLED ? "CALENDAR_EVENT_CANCELLED" : "CALENDAR_EVENT_UPDATED",
          description: data.status === CalendarEventStatus.CANCELLED && existing.status !== CalendarEventStatus.CANCELLED ? "Interview appointment cancelled" : "Interview appointment updated"
        }
      });
    });
    revalidateCalendar(existing.applicationId);
    return { error: null, success: true };
  } catch (error) { return errorState(error); }
}

export async function cancelCalendarEvent(eventId: string): Promise<CalendarActionState> {
  const user = await requireUser();
  try {
    const event = await prisma.calendarEvent.findFirst({ where: { id: eventId, userId: user.id }, select: { id: true, applicationId: true, status: true } });
    if (!event) throw new Error("Calendar event not found.");
    if (event.status !== CalendarEventStatus.CANCELLED) {
      await prisma.$transaction([
        prisma.calendarEvent.update({ where: { id: event.id }, data: { status: CalendarEventStatus.CANCELLED } }),
        prisma.applicationEvent.create({ data: { applicationId: event.applicationId, type: "CALENDAR_EVENT_CANCELLED", description: "Interview appointment cancelled" } })
      ]);
    }
    revalidateCalendar(event.applicationId);
    return { error: null, success: true };
  } catch (error) { return errorState(error); }
}

export async function deleteCalendarEvent(eventId: string): Promise<CalendarActionState> {
  const user = await requireUser();
  try {
    const event = await prisma.calendarEvent.findFirst({ where: { id: eventId, userId: user.id }, select: { id: true, applicationId: true } });
    if (!event) throw new Error("Calendar event not found.");
    await prisma.calendarEvent.delete({ where: { id: event.id } });
    revalidateCalendar(event.applicationId);
    return { error: null, success: true };
  } catch (error) { return errorState(error); }
}
