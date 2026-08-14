import type { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUS_LABELS } from "@/lib/application-status";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{APPLICATION_STATUS_LABELS[status]}</span>;
}
