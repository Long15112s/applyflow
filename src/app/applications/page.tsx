import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Applications" };

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export default async function ApplicationsPage() {
  const user = await requireUser();
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { updatedAt: "desc" }
  });

  const interviews = applications.filter((item) => item.status === "INTERVIEW").length;
  const offers = applications.filter((item) => item.status === "OFFER").length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Applications</span>
          <h1>Your job search, under control.</h1>
          <p>Track every opportunity from the first save to the final decision.</p>
        </div>
        <Link className="button button-primary" href="/applications/new">
          + New application
        </Link>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total applications</span>
          <strong>{applications.length}</strong>
        </article>
        <article className="stat-card">
          <span>Interviews</span>
          <strong>{interviews}</strong>
        </article>
        <article className="stat-card">
          <span>Offers</span>
          <strong>{offers}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Pipeline</h2>
            <p>Most recently updated applications first.</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <h3>No applications yet</h3>
            <p>Add your first role and start building your pipeline.</p>
            <Link className="button button-primary" href="/applications/new">
              Add application
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <Link className="table-link" href={`/applications/${application.id}`}>
                        {application.company.name}
                      </Link>
                    </td>
                    <td>{application.position}</td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    <td>{application.location ?? "—"}</td>
                    <td>{formatDate(application.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
