"use client";

import { useActionState } from "react";
import { updateApplicationStatus, type ActionState } from "@/app/applications/actions";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";

const initialState: ActionState = { error: null };

export function StatusForm({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const [state, action, pending] = useActionState(updateApplicationStatus, initialState);
  return (
    <form action={action} className="status-form">
      <input name="applicationId" type="hidden" value={applicationId} />
      <label>
        <span>Status</span>
        <select name="status" defaultValue={status} disabled={pending} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
          {APPLICATION_STATUSES.map(item => <option key={item} value={item}>{APPLICATION_STATUS_LABELS[item]}</option>)}
        </select>
      </label>
      <span className="form-hint" aria-live="polite">{pending ? "Saving…" : state.error}</span>
    </form>
  );
}
