CREATE TYPE "JobSeniority" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'UNKNOWN');

CREATE TABLE "JobAnalysis" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "seniority" "JobSeniority" NOT NULL,
  "requiredSkills" JSONB NOT NULL,
  "preferredSkills" JSONB NOT NULL,
  "responsibilities" JSONB NOT NULL,
  "requirements" JSONB NOT NULL,
  "niceToHaves" JSONB NOT NULL,
  "keywords" JSONB NOT NULL,
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobAnalysis_applicationId_key" ON "JobAnalysis"("applicationId");
ALTER TABLE "JobAnalysis" ADD CONSTRAINT "JobAnalysis_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
