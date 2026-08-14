"use client";
import Link from "next/link";
import { useActionState } from "react";
import { createApplication } from "@/app/applications/actions";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";

export function ApplicationCreateForm() {
  const [state, action, pending] = useActionState(createApplication, { error: null });
  return <form action={action} className="panel form-panel" aria-busy={pending}>
    <div className="form-grid two-columns"><label><span>Company *</span><input name="company" placeholder="e.g. SAP" maxLength={120} required /></label><label><span>Position *</span><input name="position" placeholder="e.g. Backend Developer" maxLength={160} required /></label></div>
    <div className="form-grid two-columns"><label><span>Location</span><input name="location" placeholder="e.g. Berlin" maxLength={120} /></label><label><span>Status *</span><select name="status" defaultValue={ApplicationStatus.APPLIED} required>{APPLICATION_STATUSES.map(status => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}</select></label></div>
    <label><span>Job URL</span><input name="jobUrl" type="url" inputMode="url" placeholder="https://…" /></label>
    <label><span>Job description</span><textarea name="jobDescription" rows={8} placeholder="Paste the job description here…" /></label>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <div className="form-actions"><Link className="button button-secondary" href="/applications">Cancel</Link><button className="button button-primary" disabled={pending} type="submit">{pending ? "Saving…" : "Save application"}</button></div>
  </form>;
}
