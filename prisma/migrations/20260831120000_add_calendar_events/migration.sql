ALTER TYPE "ApplicationEventType" ADD VALUE 'CALENDAR_EVENT_CREATED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'CALENDAR_EVENT_UPDATED';
ALTER TYPE "ApplicationEventType" ADD VALUE 'CALENDAR_EVENT_CANCELLED';

CREATE TYPE "CalendarEventType" AS ENUM ('PHONE_SCREEN', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'INTERVIEW', 'FOLLOW_UP', 'DEADLINE', 'OTHER');
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "CalendarEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "CalendarEventType" NOT NULL,
  "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "timeZone" TEXT NOT NULL,
  "location" TEXT,
  "meetingUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEvent_userId_startsAt_idx" ON "CalendarEvent"("userId", "startsAt");
CREATE INDEX "CalendarEvent_applicationId_idx" ON "CalendarEvent"("applicationId");
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
