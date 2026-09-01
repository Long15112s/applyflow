import type { Metadata } from "next";
import Link from "next/link";
import { CalendarEventStatus } from "@/generated/prisma/enums";
import { CalendarMonth } from "@/components/calendar/calendar-month";
import { CALENDAR_EVENT_TYPE_LABELS, formatEventDate, meetingLabel } from "@/lib/calendar";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Calendar" };

function parsedMonth(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) { const now = new Date(); return { year: now.getUTCFullYear(), month: now.getUTCMonth() }; }
  const year = Number(match[1]); const month = Number(match[2]) - 1;
  if (year < 1970 || year > 2100 || month < 0 || month > 11) { const now = new Date(); return { year: now.getUTCFullYear(), month: now.getUTCMonth() }; }
  return { year, month };
}
function monthHref(year: number, month: number) { const date = new Date(Date.UTC(year, month, 1)); return `/calendar?month=${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const { month: requestedMonth } = await searchParams;
  const { year, month } = parsedMonth(requestedMonth);
  const rangeStart = new Date(Date.UTC(year, month, -1));
  const rangeEnd = new Date(Date.UTC(year, month + 1, 2));
  const [events, upcoming] = await Promise.all([
    prisma.calendarEvent.findMany({ where: { userId: user.id, startsAt: { gte: rangeStart, lt: rangeEnd } }, include: { application: { include: { company: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.calendarEvent.findMany({ where: { userId: user.id, status: CalendarEventStatus.SCHEDULED, startsAt: { gte: new Date() } }, include: { application: { include: { company: true } } }, orderBy: { startsAt: "asc" }, take: 8 })
  ]);
  const title = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));
  return <div className="page-stack calendar-page">
    <header className="page-header"><div><span className="eyebrow">Calendar</span><h1>Calendar</h1><p>Manage interviews, recruiter calls and application deadlines.</p></div><Link className="button button-primary" href="/calendar/events/new">+ Add event</Link></header>
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar"><div><Link className="calendar-nav-button" href={monthHref(year, month - 1)} aria-label="Previous month">←</Link><h2>{title}</h2><Link className="calendar-nav-button" href={monthHref(year, month + 1)} aria-label="Next month">→</Link></div><Link className="button button-secondary" href="/calendar">Today</Link></div>
        {events.length === 0 ? <p className="calendar-empty">No events this month. Use “Add event” to schedule one.</p> : null}
        <CalendarMonth year={year} month={month} events={events} />
      </section>
      <aside className="panel upcoming-panel"><div className="panel-heading"><div><h2>Upcoming</h2><p>Your next scheduled appointments.</p></div></div>{upcoming.length ? <div className="upcoming-list">{upcoming.map(event => <article className="upcoming-card" key={event.id}><div className="upcoming-card-heading"><span>{CALENDAR_EVENT_TYPE_LABELS[event.type]}</span><time dateTime={event.startsAt.toISOString()}>{formatEventDate(event.startsAt, event.timeZone, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></div><Link href={`/calendar/events/${event.id}/edit`}><strong>{event.title}</strong><span>{event.application.company.name} — {event.application.position}</span></Link>{event.meetingUrl ? <a className="button button-secondary meeting-button" href={event.meetingUrl} target="_blank" rel="noopener noreferrer">{meetingLabel(event.meetingUrl)}</a> : null}</article>)}</div> : <p className="empty-copy">No upcoming appointments.</p>}</aside>
    </div>
  </div>;
}
