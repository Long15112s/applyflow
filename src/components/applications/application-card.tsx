import Link from "next/link";
import type { BoardApplication } from "./application-board";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";

const formatDate = (value: string) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export function ApplicationCard({ application, dragging, pending, onDragStart, onDragEnd, onStatusChange }: { application: BoardApplication; dragging: boolean; pending: boolean; onDragStart: () => void; onDragEnd: () => void; onStatusChange: (status: ApplicationStatus) => void }) {
  return <article className={`kanban-card${dragging ? " is-dragging" : ""}${pending ? " is-pending" : ""}`} draggable={!pending} onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", application.id); onDragStart(); }} onDragEnd={onDragEnd}>
    <Link className="kanban-card-link" href={`/applications/${application.id}`} aria-label={`${application.company}, ${application.position}`}><div className="kanban-card-heading"><span>{application.company}</span><span className="status-label">{APPLICATION_STATUS_LABELS[application.status]}</span></div><strong>{application.position}</strong><div className="kanban-card-meta">{application.location ? <span>{application.location}</span> : null}{application.workMode ? <span>{application.workMode}</span> : null}{application.appliedAt ? <span>Applied {formatDate(application.appliedAt)}</span> : null}</div></Link>
    <label className="card-status-control"><span>Move to</span><select aria-label={`Change status for ${application.position}`} value={application.status} disabled={pending} onChange={event => onStatusChange(event.target.value as ApplicationStatus)}>{APPLICATION_STATUSES.map(status => <option value={status} key={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}</select></label>
  </article>;
}
