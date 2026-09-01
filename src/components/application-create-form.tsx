"use client";
import Link from "next/link";
import { useActionState } from "react";
import { createApplication } from "@/app/applications/actions";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "No applied date";
}

export function ApplicationCreateForm() {
  const [state, action, pending] = useActionState(createApplication, { error: null });
  const warning = state.duplicateWarning;
  return <form action={action} className="panel form-panel" aria-busy={pending}>
    <div className="form-grid two-columns"><label><span>Company *</span><input name="company" placeholder="e.g. SAP" maxLength={120} required /></label><label><span>Position *</span><input name="position" placeholder="e.g. Backend Developer" maxLength={160} required /></label></div>
    <div className="form-grid two-columns"><label><span>Location</span><input name="location" placeholder="e.g. Berlin" maxLength={120} /></label><label><span>Status *</span><select name="status" defaultValue={ApplicationStatus.APPLIED} required>{APPLICATION_STATUSES.map(status => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}</select></label></div>
    <label><span>Job URL</span><input name="jobUrl" type="url" inputMode="url" placeholder="https://…" /></label>
    <label><span>Job description</span><textarea name="jobDescription" rows={8} placeholder="Paste the job description here…" /></label>
    {warning ? <section className={`duplicate-notice duplicate-${warning.level.toLowerCase()}`} role={warning.level === "COMPANY" ? "status" : "alert"}><span className="eyebrow">{warning.level === "COMPANY" ? "Company already tracked" : "Possible duplicate application"}</span><h3>{warning.message}</h3><div className="duplicate-list">{warning.applications.map(application => <Link href={`/applications/${application.id}`} target="_blank" rel="noopener noreferrer" key={application.id}><strong>{application.company} — {application.position}</strong><span>{APPLICATION_STATUS_LABELS[application.status]} · {formatDate(application.appliedAt)}</span></Link>)}</div><p>You can review the existing application or continue intentionally.</p></section> : null}
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <div className="form-actions"><Link className="button button-secondary" href="/applications">Cancel</Link><button className="button button-primary" disabled={pending} type="submit" {...(warning ? { name: "confirmDuplicates", value: "true" } : {})}>{pending ? "Saving…" : warning ? "Create anyway" : "Save application"}</button></div>
  </form>;
}
