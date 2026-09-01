"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCalendarEvent, updateCalendarEvent, type CalendarActionState } from "@/app/calendar/actions";
import type { CalendarEventStatus, CalendarEventType } from "@/generated/prisma/enums";
import { CALENDAR_EVENT_STATUS_LABELS, CALENDAR_EVENT_TYPES, CALENDAR_EVENT_TYPE_LABELS } from "@/lib/calendar";

type ApplicationOption = { id: string; label: string };
type EventValue = {
  id: string; applicationId: string; title: string; type: CalendarEventType; status: CalendarEventStatus;
  startsAt: string; endsAt: string | null; location: string | null; meetingUrl: string | null; notes: string | null;
};
type LocalParts = { date: string; hour: string; minute: string };

const HOURS = Array.from({ length: 24 }, (_, value) => String(value).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0"));

function localParts(iso: string | null): LocalParts | null {
  if (!iso) return null;
  const date = new Date(iso);
  const part = (value: number) => String(value).padStart(2, "0");
  return { date: `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`, hour: part(date.getHours()), minute: part(date.getMinutes()) };
}

function setIsoDate(formData: FormData, prefix: "start" | "end", isoName: "startsAt" | "endsAt", required: boolean) {
  const date = String(formData.get("eventDate") ?? "");
  const hour = String(formData.get(`${prefix}Hour`) ?? "");
  const minute = String(formData.get(`${prefix}Minute`) ?? "");
  if (!hour && !minute && !required) { formData.set(isoName, ""); return; }
  if (!date || !hour || !minute) throw new Error(`${required ? "Start" : "End"} time is incomplete.`);
  const localDate = new Date(`${date}T${hour}:${minute}:00`);
  if (Number.isNaN(localDate.getTime())) throw new Error(`${required ? "Start" : "End"} time is invalid.`);
  formData.set(isoName, localDate.toISOString());
}

function ClockSelect({ prefix, label, value, optional = false }: { prefix: "start" | "end"; label: string; value: LocalParts | null; optional?: boolean }) {
  return <fieldset className="clock-field"><legend>{label}</legend><div className="clock-selects"><select name={`${prefix}Hour`} defaultValue={value?.hour ?? (optional ? "" : "09")} aria-label={`${label} hour`} required={!optional}>{optional ? <option value="">--</option> : null}{HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}</select><span aria-hidden="true">:</span><select name={`${prefix}Minute`} defaultValue={value?.minute ?? (optional ? "" : "00")} aria-label={`${label} minute`} required={!optional}>{optional ? <option value="">--</option> : null}{MINUTES.map(minute => <option key={minute} value={minute}>{minute}</option>)}</select></div></fieldset>;
}

export function CalendarEventForm({ applications, event, selectedApplicationId }: { applications: ApplicationOption[]; event?: EventValue; selectedApplicationId?: string }) {
  const router = useRouter();
  const serverAction = event ? updateCalendarEvent : createCalendarEvent;
  const start = localParts(event?.startsAt ?? null);
  const end = localParts(event?.endsAt ?? null);
  const clientAction = async (state: CalendarActionState, formData: FormData) => {
    try {
      setIsoDate(formData, "start", "startsAt", true);
      setIsoDate(formData, "end", "endsAt", false);
      formData.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      return await serverAction(state, formData);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Date and time are invalid." };
    }
  };
  const [state, action, pending] = useActionState(clientAction, { error: null });

  useEffect(() => { if (state.success) router.push("/calendar"); }, [router, state.success]);

  return <form action={action} className="panel form-panel" aria-busy={pending}>
    {event ? <input name="eventId" type="hidden" value={event.id} /> : null}
    <div className="form-grid two-columns">
      <label><span>Application *</span><select name="applicationId" defaultValue={event?.applicationId ?? selectedApplicationId ?? ""} disabled={Boolean(event)} required><option value="" disabled>Select an application</option>{applications.map(application => <option key={application.id} value={application.id}>{application.label}</option>)}</select>{event ? <input name="applicationId" type="hidden" value={event.applicationId} /> : null}</label>
      <label><span>Title *</span><input name="title" defaultValue={event?.title ?? "Interview"} maxLength={160} required /></label>
      <label><span>Type *</span><select name="type" defaultValue={event?.type ?? "INTERVIEW"} required>{CALENDAR_EVENT_TYPES.map(type => <option key={type} value={type}>{CALENDAR_EVENT_TYPE_LABELS[type]}</option>)}</select></label>
      {event ? <label><span>Status *</span><select name="status" defaultValue={event.status} required>{Object.entries(CALENDAR_EVENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}
    </div>
    <div className="event-time-grid">
      <label><span>Date *</span><input name="eventDate" type="date" defaultValue={start?.date ?? ""} required /></label>
      <ClockSelect prefix="start" label="Start time *" value={start} />
      <ClockSelect prefix="end" label="End time (optional)" value={end} optional />
    </div>
    <div className="form-grid two-columns">
      <label><span>Location</span><input name="location" defaultValue={event?.location ?? ""} maxLength={200} placeholder="Remote or office address" /></label>
      <label><span>Meeting URL</span><input name="meetingUrl" type="url" inputMode="url" defaultValue={event?.meetingUrl ?? ""} maxLength={2048} placeholder="https://meet.google.com/…" /></label>
    </div>
    <label><span>Notes</span><textarea name="notes" rows={6} maxLength={5000} defaultValue={event?.notes ?? ""} /></label>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <div className="form-actions"><Link className="button button-secondary" href="/calendar">Cancel</Link><button className="button button-primary" disabled={pending || applications.length === 0} type="submit">{pending ? "Saving…" : event ? "Save changes" : "Add event"}</button></div>
  </form>;
}
