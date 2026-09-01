"use server";

import { revalidatePath } from "next/cache";
import { analyzeJobDescription, JobAnalysisError } from "@/lib/ai/job-analysis";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type JobAnalysisActionState = { error: string | null };
export async function analyzeApplicationJobDescription(applicationId: string): Promise<JobAnalysisActionState> {
  const user = await requireUser();
  try {
    if (!applicationId.trim()) return { error: "Application is required." };
    const application = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id }, select: { id: true, jobDescription: true } });
    if (!application) return { error: "Application not found." };
    if (!application.jobDescription) return { error: "Add a job description before running an analysis." };

    const { result, model } = await analyzeJobDescription(application.jobDescription);
    await prisma.jobAnalysis.upsert({
      where: { applicationId: application.id },
      create: { applicationId: application.id, ...result, model },
      update: { ...result, model }
    });
    revalidatePath(`/applications/${application.id}`);
    return { error: null };
  } catch (error) {
    if (error instanceof JobAnalysisError) return { error: error.userMessage };
    return { error: "AI analysis failed. Please try again." };
  }
}
