"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeApplicationStatus } from "@/app/applications/actions";
import type { ApplicationStatus as ApplicationStatusValue, WorkMode } from "@/generated/prisma/enums";
import { APPLICATION_STATUS_LABELS, BOARD_STATUSES, type BoardStatus } from "@/lib/application-status";
import { ApplicationCard } from "./application-card";

export type BoardApplication = { id: string; company: string; position: string; status: ApplicationStatusValue; location: string | null; workMode: WorkMode | null; appliedAt: string | null };

export function ApplicationBoard({ applications: initialApplications }: { applications: BoardApplication[] }) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<BoardStatus | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const normalizedLocation = location.trim().toLocaleLowerCase();
  const filtered = applications.filter(application => (!normalizedQuery || application.company.toLocaleLowerCase().includes(normalizedQuery) || application.position.toLocaleLowerCase().includes(normalizedQuery)) && (!normalizedLocation || application.location?.toLocaleLowerCase().includes(normalizedLocation)));

  async function moveApplication(applicationId: string, status: ApplicationStatusValue) {
    const application = applications.find(item => item.id === applicationId);
    setDropTarget(null); setDraggedId(null);
    if (!application || application.status === status || pendingId) return;
    const previousApplications = applications;
    setError(null); setPendingId(applicationId);
    setApplications(current => current.map(item => item.id === applicationId ? { ...item, status } : item));
    const result = await changeApplicationStatus(applicationId, status);
    setPendingId(null);
    if (result.error) { setApplications(previousApplications); setError(result.error); router.refresh(); }
  }

  return <section className="board-shell">
    <div className="board-filters panel"><label><span>Search company or position</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search…" /></label><label><span>Location</span><input value={location} onChange={event => setLocation(event.target.value)} placeholder="e.g. Berlin" /></label></div>
    {error ? <div className="form-error" role="alert">Status could not be updated: {error}</div> : null}
    <div className="kanban-board">{BOARD_STATUSES.map(status => {
      const columnApplications = filtered.filter(application => application.status === status);
      return <section className={`kanban-column${dropTarget === status ? " is-drop-target" : ""}`} key={status} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(status); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null); }} onDrop={event => { event.preventDefault(); void moveApplication(event.dataTransfer.getData("text/plain"), status); }}>
        <header><div><span className={`column-dot status-${status.toLowerCase()}`} /><strong>{APPLICATION_STATUS_LABELS[status]}</strong></div><span>{columnApplications.length}</span></header>
        <div className="kanban-cards">{columnApplications.map(application => <ApplicationCard key={application.id} application={application} dragging={draggedId === application.id} pending={pendingId === application.id} onDragStart={() => setDraggedId(application.id)} onDragEnd={() => { setDraggedId(null); setDropTarget(null); }} onStatusChange={nextStatus => { void moveApplication(application.id, nextStatus); }} />)}{columnApplications.length === 0 ? <div className="column-empty">No applications in this stage</div> : null}</div>
      </section>;
    })}</div>
  </section>;
}
