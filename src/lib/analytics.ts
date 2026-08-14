import { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";
import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcMonth(date: Date, offset = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

export async function getAnalyticsOverview(userId: string, now = new Date()) {
  const currentMonth = startOfUtcMonth(now);
  const sixMonthsAgo = startOfUtcMonth(now, -5);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);

  const [total, submitted, active, offers, thisMonth, activityLast30Days, groupedStatuses, applicationDates, recentEvents, staleApplied, staleSaved] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.application.count({ where: { userId, status: { not: ApplicationStatus.SAVED } } }),
    prisma.application.count({ where: { userId, status: { in: [ApplicationStatus.APPLIED, ApplicationStatus.SCREENING, ApplicationStatus.INTERVIEW] } } }),
    prisma.application.count({ where: { userId, status: ApplicationStatus.OFFER } }),
    prisma.application.count({ where: { userId, createdAt: { gte: currentMonth } } }),
    prisma.applicationEvent.count({ where: { application: { userId }, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.application.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
    prisma.application.findMany({ where: { userId, createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true } }),
    prisma.applicationEvent.findMany({
      where: { application: { userId } },
      select: { id: true, description: true, createdAt: true, application: { select: { id: true, position: true, company: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.application.findMany({
      where: { userId, status: ApplicationStatus.APPLIED, updatedAt: { lt: fourteenDaysAgo } },
      select: { id: true, position: true, updatedAt: true, company: { select: { name: true } } },
      orderBy: { updatedAt: "asc" }, take: 5
    }),
    prisma.application.findMany({
      where: { userId, status: ApplicationStatus.SAVED, createdAt: { lt: sevenDaysAgo } },
      select: { id: true, position: true, createdAt: true, company: { select: { name: true } } },
      orderBy: { createdAt: "asc" }, take: 5
    })
  ]);

  const counts = new Map(groupedStatuses.map(item => [item.status, item._count._all]));
  const statusDistribution = APPLICATION_STATUSES.map(status => ({ status, label: APPLICATION_STATUS_LABELS[status], count: counts.get(status) ?? 0 }));
  const monthCounts = new Map<string, number>();
  for (const item of applicationDates) {
    const key = `${item.createdAt.getUTCFullYear()}-${String(item.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const applicationsOverTime = Array.from({ length: 6 }, (_, index) => {
    const month = startOfUtcMonth(now, index - 5);
    const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(month), count: monthCounts.get(key) ?? 0 };
  });

  const attention = [
    ...staleApplied.map(item => ({ id: item.id, company: item.company.name, position: item.position, reason: "No update for 14+ days", date: item.updatedAt })),
    ...staleSaved.map(item => ({ id: item.id, company: item.company.name, position: item.position, reason: "Saved for 7+ days", date: item.createdAt }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5).map(({ date: _date, ...item }) => item);

  return {
    kpis: { total, submitted, active, offers, thisMonth, activityLast30Days },
    statusDistribution,
    applicationsOverTime,
    outcomes: { offers: counts.get(ApplicationStatus.OFFER) ?? 0, rejected: counts.get(ApplicationStatus.REJECTED) ?? 0, withdrawn: counts.get(ApplicationStatus.WITHDRAWN) ?? 0, active },
    recentActivity: recentEvents
      .filter((event, index, events) => index === 0 || event.application.id !== events[index - 1].application.id || event.description !== events[index - 1].description)
      .slice(0, 5)
      .map(event => ({ id: event.id, applicationId: event.application.id, company: event.application.company.name, position: event.application.position, description: event.description, createdAt: event.createdAt.toISOString() })),
    attention
  };
}
