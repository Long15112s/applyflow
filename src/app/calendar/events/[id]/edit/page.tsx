import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarEventActions } from "@/components/calendar/calendar-event-actions";
import { CalendarEventForm } from "@/components/calendar/calendar-event-form";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Edit calendar event" };
export default async function EditCalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await requireUser();
  const [event, applications] = await Promise.all([
    prisma.calendarEvent.findFirst({ where: { id, userId: user.id } }),
    prisma.application.findMany({ where: { userId: user.id }, include: { company: true }, orderBy: { updatedAt: "desc" } })
  ]);
  if (!event) notFound();
  return <div className="narrow-page page-stack"><header className="page-header compact"><div><Link className="back-link" href="/calendar">← Calendar</Link><h1>Edit event</h1><p>Update appointment details, meeting information or status.</p></div></header><CalendarEventForm applications={applications.map(item => ({ id: item.id, label: `${item.company.name} — ${item.position}` }))} event={{ id: event.id, applicationId: event.applicationId, title: event.title, type: event.type, status: event.status, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt?.toISOString() ?? null, location: event.location, meetingUrl: event.meetingUrl, notes: event.notes }} /><CalendarEventActions eventId={event.id} cancelled={event.status === "CANCELLED"} /></div>;
}
