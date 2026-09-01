"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { ApplicationStatus, WorkMode } from "@/generated/prisma/enums";

export type DuplicateWarning = {
  level: "COMPANY" | "ROLE" | "JOB_URL";
  message: string;
  applications: Array<{ id: string; company: string; position: string; status: ApplicationStatus; appliedAt: string | null }>;
};

export type ActionState = {
  error: string | null;
  duplicateWarning?: DuplicateWarning;
};

const applicationStatuses = new Set(Object.values(ApplicationStatus));
const workModes = new Set(Object.values(WorkMode));

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function requiredText(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function optionalInteger(formData: FormData, name: string, label: string) {
  const value = optionalText(formData.get(name));
  if (value === null) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return number;
}

function optionalDate(formData: FormData, name: string) {
  const value = optionalText(formData.get(name));
  if (value === null) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Applied date is invalid.");
  return date;
}

function optionalUrl(formData: FormData, name: string) {
  const value = optionalText(formData.get(name));
  if (value === null) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error("Job URL must be a valid HTTP or HTTPS URL.");
  }
}

function errorState(error: unknown): ActionState {
  return { error: error instanceof Error ? error.message : "Something went wrong." };
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

async function findDuplicateWarning(userId: string, companyName: string, position: string, jobUrl: string | null): Promise<DuplicateWarning | null> {
  const candidates = await prisma.application.findMany({
    where: {
      userId,
      OR: [
        { company: { name: { equals: companyName, mode: "insensitive" } } },
        ...(jobUrl ? [{ jobUrl }] : [])
      ]
    },
    include: { company: true },
    orderBy: { appliedAt: "desc" }
  });
  const normalizedCompany = normalizeText(companyName);
  const normalizedPosition = normalizeText(position);
  const companyMatches = candidates.filter(item => normalizeText(item.company.name) === normalizedCompany);
  const roleMatches = companyMatches.filter(item => normalizeText(item.position) === normalizedPosition);
  const urlMatches = jobUrl ? candidates.filter(item => item.jobUrl === jobUrl) : [];
  const serialize = (items: typeof candidates) => items.map(item => ({ id: item.id, company: item.company.name, position: item.position, status: item.status, appliedAt: item.appliedAt?.toISOString() ?? null }));
  if (urlMatches.length) return { level: "JOB_URL", message: "This job posting already exists in ApplyFlow.", applications: serialize(urlMatches) };
  if (roleMatches.length) return { level: "ROLE", message: "You already have an application for this position at this company.", applications: serialize(roleMatches) };
  if (companyMatches.length) return { level: "COMPANY", message: `You already have ${companyMatches.length} ${companyMatches.length === 1 ? "application" : "applications"} at ${companyMatches[0].company.name}.`, applications: serialize(companyMatches) };
  return null;
}

export async function createApplication(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  let applicationId: string;
  try {
    const position = requiredText(formData, "position", "Position");
    const companyName = requiredText(formData, "company", "Company");
    const jobUrl = optionalUrl(formData, "jobUrl");
    const statusValue = optionalText(formData.get("status")) ?? ApplicationStatus.APPLIED;
    if (!applicationStatuses.has(statusValue as ApplicationStatus)) throw new Error("Status is invalid.");

    if (String(formData.get("confirmDuplicates") ?? "") !== "true") {
      const duplicateWarning = await findDuplicateWarning(user.id, companyName, position, jobUrl);
      if (duplicateWarning) return { error: null, duplicateWarning };
    }

    const existingCompany = await prisma.company.findFirst({ where: { userId: user.id, name: { equals: companyName, mode: "insensitive" } } });
    const company = existingCompany ?? await prisma.company.create({ data: { userId: user.id, name: companyName, location: optionalText(formData.get("location")) } });
    const application = await prisma.application.create({
      data: {
        userId: user.id, companyId: company.id, position, status: statusValue as ApplicationStatus,
        location: optionalText(formData.get("location")), jobUrl,
        jobDescription: optionalText(formData.get("jobDescription")), appliedAt: new Date(),
        events: { create: { type: "APPLICATION_CREATED", description: "Application added to ApplyFlow" } }
      }
    });
    applicationId = application.id;
    revalidatePath("/applications");
    revalidatePath("/applications/board");
  } catch (error) {
    return errorState(error);
  }
  redirect(`/applications/${applicationId}`);
}
export async function deleteApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const user = await requireUser();

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId: user.id
    },
    select: { id: true }
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  await prisma.application.delete({
    where: { id: application.id }
  });

  revalidatePath("/applications");
  redirect("/applications");
}

export async function updateApplication(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const user = await requireUser();

  try {
    if (!applicationId) throw new Error("Application is required.");
    const position = requiredText(formData, "position", "Position");
    const companyName = requiredText(formData, "company", "Company");
    const currency = requiredText(formData, "currency", "Currency").toUpperCase();
    const workModeValue = optionalText(formData.get("workMode"));
    if (workModeValue && !workModes.has(workModeValue as WorkMode)) {
      throw new Error("Work mode is invalid.");
    }
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must use a 3-letter code.");

    const salaryMin = optionalInteger(formData, "salaryMin", "Minimum salary");
    const salaryMax = optionalInteger(formData, "salaryMax", "Maximum salary");
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      throw new Error("Minimum salary cannot exceed maximum salary.");
    }

    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id },
      select: { id: true }
    });
    if (!existing) throw new Error("Application not found.");

    await prisma.application.update({
      where: { id: existing.id },
      data: {
        company: {
          connectOrCreate: {
            where: { userId_name: { userId: user.id, name: companyName } },
            create: { userId: user.id, name: companyName }
          }
        },
        position,
        location: optionalText(formData.get("location")),
        workMode: workModeValue as WorkMode | null,
        salaryMin,
        salaryMax,
        currency,
        jobUrl: optionalUrl(formData, "jobUrl"),
        jobDescription: optionalText(formData.get("jobDescription")),
        appliedAt: optionalDate(formData, "appliedAt"),
        events: {
          create: { type: "APPLICATION_UPDATED", description: "Application details updated" }
        }
      }
    });

    revalidatePath("/applications");
    revalidatePath(`/applications/${applicationId}`);
  } catch (error) {
    return errorState(error);
  }

  redirect(`/applications/${applicationId}`);
}

export async function updateApplicationStatus(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  return changeApplicationStatus(applicationId, status);
}

export async function changeApplicationStatus(
  applicationId: string,
  statusValue: string
): Promise<ActionState> {
  const user = await requireUser();
  try {
    if (!applicationId) throw new Error("Application is required.");
    if (!applicationStatuses.has(statusValue as ApplicationStatus)) {
      throw new Error("Status is invalid.");
    }
    const status = statusValue as ApplicationStatus;
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id },
      select: { id: true, status: true }
    });
    if (!application) throw new Error("Application not found.");
    if (application.status === status) return { error: null };

    await prisma.application.update({
      where: { id: application.id },
      data: {
        status,
        events: {
          create: {
            type: "STATUS_CHANGED",
            description: `Status changed from ${application.status} to ${status}`
          }
        }
      }
    });
    revalidatePath("/applications");
    revalidatePath("/applications/board");
    revalidatePath(`/applications/${applicationId}`);
    return { error: null };
  } catch (error) {
    return errorState(error);
  }
}
