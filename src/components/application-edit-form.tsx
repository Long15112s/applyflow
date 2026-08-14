"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateApplication, type ActionState } from "@/app/applications/actions";

type ApplicationFormValue = {
  id: string; company: string; position: string; location: string | null; workMode: string | null;
  salaryMin: number | null; salaryMax: number | null; currency: string; jobUrl: string | null;
  jobDescription: string | null; appliedAt: string;
};

export function ApplicationEditForm({ application }: { application: ApplicationFormValue }) {
  const [state, action, pending] = useActionState(updateApplication, { error: null });
  return (
    <form action={action} className="panel form-panel" aria-busy={pending}>
      <input name="applicationId" type="hidden" value={application.id} />
      <div className="form-grid two-columns">
        <label><span>Company *</span><input name="company" defaultValue={application.company} maxLength={120} required /></label>
        <label><span>Position *</span><input name="position" defaultValue={application.position} maxLength={160} required /></label>
        <label><span>Location</span><input name="location" defaultValue={application.location ?? ""} maxLength={120} /></label>
        <label><span>Work mode</span><select name="workMode" defaultValue={application.workMode ?? ""}><option value="">Not specified</option><option value="ONSITE">Onsite</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option></select></label>
        <label><span>Minimum salary</span><input name="salaryMin" type="number" min="0" step="1" defaultValue={application.salaryMin ?? ""} /></label>
        <label><span>Maximum salary</span><input name="salaryMax" type="number" min="0" step="1" defaultValue={application.salaryMax ?? ""} /></label>
        <label><span>Currency</span><input name="currency" maxLength={3} defaultValue={application.currency} required /></label>
        <label><span>Applied date</span><input name="appliedAt" type="date" defaultValue={application.appliedAt} /></label>
      </div>
      <label><span>Job URL</span><input name="jobUrl" type="url" inputMode="url" defaultValue={application.jobUrl ?? ""} /></label>
      <label><span>Job description</span><textarea name="jobDescription" rows={10} defaultValue={application.jobDescription ?? ""} /></label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <div className="form-actions"><Link className="button button-secondary" href={`/applications/${application.id}`}>Cancel</Link><button className="button button-primary" disabled={pending} type="submit">{pending ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}
