"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeApplicationStatus } from "@/app/applications/actions";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/application-status";

export function StatusForm({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  function handleStatusChange(nextStatus: ApplicationStatus) {
    const previousStatus = selectedStatus;

    setSelectedStatus(nextStatus);
    setError(null);

    startTransition(async () => {
      const result = await changeApplicationStatus(applicationId, nextStatus);
      if (result.error) {
        setSelectedStatus(previousStatus);
        setError(result.error);
        return;
      }

      setSelectedStatus(nextStatus);
      router.refresh();
    });
  }

  return (
    <div className="status-form">
      <label>
        <span>Status</span>
        <select
          name="status"
          value={selectedStatus}
          disabled={pending}
          onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
        >
          {APPLICATION_STATUSES.map(item => <option key={item} value={item}>{APPLICATION_STATUS_LABELS[item]}</option>)}
        </select>
      </label>
      <span className="form-hint" aria-live="polite">{pending ? "Saving…" : error}</span>
    </div>
  );
}
