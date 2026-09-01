import Link from "next/link";
import type { Metadata } from "next";
import { ApplicationExportControls } from "@/components/applications/application-export-controls";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Applications" };

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; exportError?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = String(params.q ?? "").trim().slice(0, 160);
  const status = APPLICATION_STATUSES.includes(params.status as ApplicationStatus) ? params.status as ApplicationStatus : undefined;
  const where = {
    userId: user.id,
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { company: { name: { contains: q, mode: "insensitive" as const } } },
      { position: { contains: q, mode: "insensitive" as const } },
      { location: { contains: q, mode: "insensitive" as const } }
    ] } : {})
  };
  const [applications, total, interviews, offers, submitted] = await Promise.all([
    prisma.application.findMany({ where, include: { company: true }, orderBy: { updatedAt: "desc" } }),
    prisma.application.count({ where: { userId: user.id } }),
    prisma.application.count({ where: { userId: user.id, status: ApplicationStatus.INTERVIEW } }),
    prisma.application.count({ where: { userId: user.id, status: ApplicationStatus.OFFER } }),
    prisma.application.count({ where: { userId: user.id, status: { not: ApplicationStatus.SAVED }, appliedAt: { not: null } } })
  ]);
  const filtering = Boolean(q || status);
  return <div className="page-stack">
    <header className="page-header"><div><span className="eyebrow">Applications</span><h1>Your job search, under control.</h1><p>Track every opportunity from the first save to the final decision.</p></div><div className="header-actions"><ApplicationExportControls disabled={submitted === 0} /><Link className="button button-primary" href="/applications/new">+ New application</Link></div></header>
    {params.exportError ? <p className="form-error" role="alert">{params.exportError === "empty" ? "No submitted applications were found in that date range." : "The export date range is invalid."}</p> : null}
    <section className="stats-grid"><article className="stat-card"><span>Total applications</span><strong>{total}</strong></article><article className="stat-card"><span>Interviews</span><strong>{interviews}</strong></article><article className="stat-card"><span>Offers</span><strong>{offers}</strong></article></section>
    <form className="panel application-filters" method="get"><label><span>Search applications</span><input name="q" defaultValue={q} placeholder="Search by company, position or location…" /></label><label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{APPLICATION_STATUSES.map(value => <option key={value} value={value}>{APPLICATION_STATUS_LABELS[value]}</option>)}</select></label><div className="filter-actions"><button className="button button-primary" type="submit">Search</button>{filtering ? <Link className="button button-secondary" href="/applications">Clear</Link> : null}</div></form>
    <section className="panel"><div className="panel-heading"><div><h2>Pipeline</h2><p>{filtering ? `${applications.length} matching ${applications.length === 1 ? "application" : "applications"}.` : "Most recently updated applications first."}</p></div></div>
      {applications.length === 0 ? <div className="empty-state"><h3>{filtering ? "No matching applications" : "No applications yet"}</h3><p>{filtering ? "Try another company, role, location or status." : "Add your first role and start building your pipeline."}</p>{filtering ? <Link className="button button-secondary" href="/applications">Clear filters</Link> : <Link className="button button-primary" href="/applications/new">Add application</Link>}</div> : <div className="table-wrap"><table><thead><tr><th>Company</th><th>Position</th><th>Status</th><th>Location</th><th>Applied</th></tr></thead><tbody>{applications.map(application => <tr key={application.id}><td><Link className="table-link" href={`/applications/${application.id}`}>{application.company.name}</Link></td><td>{application.position}</td><td><StatusBadge status={application.status} /></td><td>{application.location ?? "—"}</td><td>{formatDate(application.appliedAt)}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
