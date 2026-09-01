import Link from "next/link";
import type { CalendarEventStatus, CalendarEventType } from "@/generated/prisma/enums";
import { CALENDAR_EVENT_TYPE_LABELS, formatEventDate } from "@/lib/calendar";

type CalendarItem = { id: string; title: string; type: CalendarEventType; status: CalendarEventStatus; startsAt: Date; timeZone: string; application: { company: { name: string } } };
function dateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function CalendarMonth({ year, month, events }: { year: number; month: number; events: CalendarItem[] }) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, month, 1 - offset));
  const grouped = new Map<string, CalendarItem[]>();
  for (const event of events) { const key = dateKey(event.startsAt, event.timeZone); grouped.set(key, [...(grouped.get(key) ?? []), event]); }
  return <div className="calendar-grid" role="grid" aria-label={`${first.toLocaleString("en", { month: "long", timeZone: "UTC" })} ${year}`}>
    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <div className="calendar-weekday" role="columnheader" key={day}>{day}</div>)}
    {Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start); date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10); const dayEvents = grouped.get(key) ?? []; const outside = date.getUTCMonth() !== month;
      return <div className={`calendar-day${outside ? " calendar-day-outside" : ""}`} role="gridcell" key={key}><time dateTime={key}>{date.getUTCDate()}</time><div className="calendar-day-events">{dayEvents.map(event => <Link className={`calendar-chip${event.status === "CANCELLED" ? " calendar-chip-cancelled" : ""}`} href={`/calendar/events/${event.id}/edit`} key={event.id}><span>{formatEventDate(event.startsAt, event.timeZone, { hour: "2-digit", minute: "2-digit" })}</span><strong>{event.application.company.name}</strong><small>{CALENDAR_EVENT_TYPE_LABELS[event.type]}</small></Link>)}</div></div>;
    })}
  </div>;
}
