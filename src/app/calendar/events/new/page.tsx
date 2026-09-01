import type { Metadata } from "next";
import Link from "next/link";
import { CalendarEventForm } from "@/components/calendar/calendar-event-form";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Add calendar event" };
export default async function NewCalendarEventPage({ searchParams }: { searchParams: Promise<{ applicationId?: string }> }) {
  const user = await requireUser(); const { applicationId } = await searchParams;
  const applications = await prisma.application.findMany({ where: { userId: user.id }, include: { company: true }, orderBy: { updatedAt: "desc" } });
  return <div className="narrow-page page-stack"><header className="page-header compact"><div><Link className="back-link" href="/calendar">← Calendar</Link><h1>Add event</h1><p>Schedule an interview, recruiter call or application deadline.</p></div></header>{applications.length ? <CalendarEventForm applications={applications.map(item => ({ id: item.id, label: `${item.company.name} — ${item.position}` }))} selectedApplicationId={applications.some(item => item.id === applicationId) ? applicationId : undefined} /> : <section className="panel empty-state"><h3>Add an application first</h3><p>Every calendar event must belong to one of your applications.</p><Link className="button button-primary" href="/applications/new">Add application</Link></section>}</div>;
}
