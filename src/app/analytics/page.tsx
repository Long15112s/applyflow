import Link from "next/link";
import { ApplicationsOverTimeChart } from "@/components/analytics/applications-over-time-chart";
import { getAnalyticsOverview } from "@/lib/analytics";
import { requireUser } from "@/lib/current-user";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges = [{ unit: "day" as const, seconds: 86400 }, { unit: "hour" as const, seconds: 3600 }, { unit: "minute" as const, seconds: 60 }];
  for (const range of ranges) if (Math.abs(seconds) >= range.seconds) return formatter.format(Math.round(seconds / range.seconds), range.unit);
  return "just now";
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = await getAnalyticsOverview(user.id);

  if (analytics.kpis.total === 0) return <div className="page-stack">
    <header className="page-header"><div><span className="eyebrow">Analytics</span><h1>Understand your job search.</h1></div></header>
    <section className="panel empty-state analytics-empty"><h2>Your analytics will appear here.</h2><p>Track applications to see how your job search develops over time.</p><Link className="button button-primary" href="/applications/new">Add your first application</Link></section>
  </div>;

  const kpis = [
    ["Total applications", analytics.kpis.total], ["Submitted", analytics.kpis.submitted], ["Active pipeline", analytics.kpis.active],
    ["Offers", analytics.kpis.offers], ["Applications this month", analytics.kpis.thisMonth], ["Activity events · 30 days", analytics.kpis.activityLast30Days]
  ] as const;
  const maximumStatusCount = Math.max(...analytics.statusDistribution.map(item => item.count), 1);

  return <div className="analytics-page page-stack">
    <header className="page-header"><div><span className="eyebrow">Analytics</span><h1>Understand your job search.</h1><p>Reliable insights from your current pipeline and activity.</p></div></header>
    <section className="analytics-kpis">{kpis.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="panel"><div className="panel-heading"><div><h2>Applications over time</h2><p>Applications created during the last six calendar months.</p></div></div><div className="analytics-panel-body"><ApplicationsOverTimeChart data={analytics.applicationsOverTime} /></div></section>
    <div className="analytics-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Pipeline distribution</h2><p>Current applications by status.</p></div></div><div className="distribution-list">{analytics.statusDistribution.map(item => <div className="distribution-row" key={item.status}><div><span>{item.label}</span><strong>{item.count}</strong></div><div className="distribution-track"><span className={`distribution-fill status-fill-${item.status.toLowerCase()}`} style={{ width: `${item.count === 0 ? 0 : Math.max((item.count / maximumStatusCount) * 100, 5)}%` }} /></div></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes across your applications.</p></div></div><div className="activity-list">{analytics.recentActivity.length ? analytics.recentActivity.map(event => <Link className="activity-row" href={`/applications/${event.applicationId}`} key={event.id}><div><strong>{event.company}</strong><span>{event.position}</span></div><p>{event.description}</p><time>{relativeTime(event.createdAt)}</time></Link>) : <p className="empty-copy">No activity yet.</p>}</div></section>
    </div>
    <div className="analytics-grid outcomes-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Outcomes</h2><p>Current outcome statuses, without inferred conversion rates.</p></div></div><dl className="outcome-list"><div><dt>Offers</dt><dd>{analytics.outcomes.offers}</dd></div><div><dt>Rejected</dt><dd>{analytics.outcomes.rejected}</dd></div><div><dt>Withdrawn</dt><dd>{analytics.outcomes.withdrawn}</dd></div><div><dt>Active</dt><dd>{analytics.outcomes.active}</dd></div></dl></section>
      {analytics.attention.length ? <section className="panel"><div className="panel-heading"><div><h2>Needs attention</h2><p>Applications that may benefit from a follow-up.</p></div></div><div className="attention-list">{analytics.attention.map(item => <Link href={`/applications/${item.id}`} key={item.id}><div><strong>{item.company}</strong><span>{item.position}</span></div><small>{item.reason}</small></Link>)}</div></section> : null}
    </div>
  </div>;
}
