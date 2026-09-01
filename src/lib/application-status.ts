import { ApplicationStatus, type ApplicationStatus as ApplicationStatusValue } from "@/generated/prisma/enums";

export const APPLICATION_STATUSES = Object.values(ApplicationStatus);

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatusValue, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn"
};

export const APPLICATION_STATUS_LABELS_DE: Record<ApplicationStatusValue, string> = {
  SAVED: "Gespeichert",
  APPLIED: "Beworben",
  SCREENING: "Vorauswahl",
  INTERVIEW: "Vorstellungsgespräch",
  OFFER: "Angebot",
  REJECTED: "Absage",
  WITHDRAWN: "Zurückgezogen"
};

export const BOARD_STATUSES = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.SCREENING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER
] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];
