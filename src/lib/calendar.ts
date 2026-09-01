import type { CalendarEventType } from "@/generated/prisma/enums";

export const CALENDAR_EVENT_TYPES = [
  "PHONE_SCREEN", "HR_INTERVIEW", "TECHNICAL_INTERVIEW", "INTERVIEW",
  "FOLLOW_UP", "DEADLINE", "OTHER"
] as const satisfies readonly CalendarEventType[];

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  PHONE_SCREEN: "Phone screen",
  HR_INTERVIEW: "HR interview",
  TECHNICAL_INTERVIEW: "Technical interview",
  INTERVIEW: "Interview",
  FOLLOW_UP: "Follow-up",
  DEADLINE: "Deadline",
  OTHER: "Other"
};

export const CALENDAR_EVENT_STATUS_LABELS = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
} as const;

export function meetingLabel(meetingUrl: string) {
  const hostname = new URL(meetingUrl).hostname.toLowerCase();
  if (hostname === "zoom.us" || hostname.endsWith(".zoom.us")) return "Join Zoom";
  if (hostname === "meet.google.com") return "Join Google Meet";
  if (hostname === "teams.microsoft.com" || hostname === "teams.live.com") return "Join Teams";
  return "Join meeting";
}

export function formatEventDate(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).format(date);
}
