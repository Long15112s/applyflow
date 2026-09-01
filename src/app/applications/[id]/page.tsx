import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarEventStatus } from "@/generated/prisma/enums";
import { StatusForm } from "@/components/status-form";
import { CALENDAR_EVENT_TYPE_LABELS, formatEventDate, meetingLabel } from "@/lib/calendar";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { deleteApplication } from "../actions";

const formatDate = (date: Date) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(date);
function formatSalary(min: number | null, max: number | null, currency: string) {
  const money = (value: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  if (min !== null && max !== null) return `${money(min)} – ${money(max)}`;
  if (min !== null) return `From ${money(min)}`;
  if (max !== null) return `Up to ${money(max)}`;
  return "Not specified";
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await requireUser(); const now = new Date();
  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: { company: true, events: { orderBy: { createdAt: "desc" } }, calendarEvents: { where: { status: CalendarEventStatus.SCHEDULED, startsAt: { gte: now } }, orderBy: { startsAt: "asc" } } }
  });
  if (!application) notFound();
  return <div className="page-stack">
    <header className="detail-header"><div><Link className="back-link" href="/applications">← Applications</Link><div className="detail-title-row"><div className="company-avatar">{application.company.name.slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">{application.company.name}</span><h1>{application.position}</h1><p>{application.location ?? "Location not specified"}</p></div></div></div><div className="header-actions"><Link className="button button-secondary" href={`/applications/${application.id}/edit`}>Edit</Link><StatusForm applicationId={application.id} status={application.status} /></div></header>
    <div className="detail-grid"><div className="page-stack"><section className="panel"><div className="panel-heading"><div><h2>Overview</h2><p>Core information about this opportunity.</p></div></div><dl className="definition-grid">
      <div><dt>Company</dt><dd>{application.company.name}</dd></div><div><dt>Position</dt><dd>{application.position}</dd></div><div><dt>Status</dt><dd>{application.status}</dd></div><div><dt>Location</dt><dd>{application.location ?? "Not specified"}</dd></div><div><dt>Work mode</dt><dd>{application.workMode ?? "Not specified"}</dd></div><div><dt>Salary range</dt><dd>{formatSalary(application.salaryMin, application.salaryMax, application.currency)}</dd></div><div><dt>Applied date</dt><dd>{application.appliedAt ? formatDate(application.appliedAt) : "Not yet"}</dd></div><div><dt>Job URL</dt><dd>{application.jobUrl ? <a className="text-link break-link" href={application.jobUrl} target="_blank" rel="noreferrer">Open job posting ↗</a> : "Not provided"}</dd></div>
    </dl><div className="content-block"><h3>Job description</h3><p className="pre-line">{application.jobDescription ?? "No job description has been added yet."}</p></div></section>
    <section className="panel"><div className="panel-heading"><div><h2>Upcoming interviews &amp; events</h2><p>Scheduled appointments for this application.</p></div><Link className="button button-secondary" href={`/calendar/events/new?applicationId=${application.id}`}>Schedule event</Link></div>{application.calendarEvents.length ? <div className="application-events">{application.calendarEvents.map(event => <article key={event.id}><div><span>{CALENDAR_EVENT_TYPE_LABELS[event.type]}</span><strong>{event.title}</strong><time dateTime={event.startsAt.toISOString()}>{formatEventDate(event.startsAt, event.timeZone, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}{event.endsAt ? `–${formatEventDate(event.endsAt, event.timeZone, { hour: "2-digit", minute: "2-digit" })}` : ""}</time><small>{event.location ?? "Location not specified"}</small></div><div className="application-event-actions">{event.meetingUrl ? <a className="button button-primary" href={event.meetingUrl} target="_blank" rel="noopener noreferrer">{meetingLabel(event.meetingUrl)}</a> : null}<Link className="button button-secondary" href={`/calendar/events/${event.id}/edit`}>Edit</Link></div></article>)}</div> : <p className="empty-copy">No upcoming interviews or events.</p>}</section></div>
    <aside className="page-stack"><section className="panel"><div className="panel-heading"><div><h2>Activity</h2><p>{application.events.length} {application.events.length === 1 ? "event" : "events"}</p></div></div>{application.events.length ? <div className="timeline">{application.events.map(event => <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><strong>{event.description}</strong><span>{formatDate(event.createdAt)}</span></div></div>)}</div> : <p className="empty-copy">No activity yet.</p>}</section><section className="panel danger-panel"><h3>Danger zone</h3><p>Remove this application and its activity history.</p><form action={deleteApplication}><input name="applicationId" type="hidden" value={application.id} /><button className="button button-danger" type="submit">Delete application</button></form></section></aside></div>
  </div>;
}
