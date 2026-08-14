import { ApplicationBoard } from "@/components/applications/application-board";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { BOARD_STATUSES } from "@/lib/application-status";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Board" };

export default async function ApplicationBoardPage() {
  const user = await requireUser();
  const applications = await prisma.application.findMany({
    where: { userId: user.id, status: { in: [...BOARD_STATUSES] } },
    select: { id: true, position: true, status: true, location: true, workMode: true, appliedAt: true, company: { select: { name: true } } },
    orderBy: { updatedAt: "desc" }
  });

  return <div className="board-page page-stack">
    <header className="page-header"><div><span className="eyebrow">Board</span><h1>Move opportunities forward.</h1><p>Drag applications between stages to keep your pipeline current.</p></div></header>
    <ApplicationBoard applications={applications.map(application => ({ ...application, company: application.company.name, appliedAt: application.appliedAt?.toISOString() ?? null }))} />
  </div>;
}
