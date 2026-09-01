import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { APPLICATION_STATUS_LABELS_DE } from "@/lib/application-status";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const WORK_MODE_LABELS = { ONSITE: "Vor Ort", HYBRID: "Hybrid", REMOTE: "Remote" } as const;
function parseDate(value: string | null, endExclusive = false) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("invalid");
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("invalid");
  if (endExclusive) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}
function errorRedirect(request: Request, error: "invalid-range" | "empty") {
  const url = new URL("/applications", request.url); url.searchParams.set("exportError", error); return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  let from: Date | null; let toExclusive: Date | null;
  try {
    from = parseDate(url.searchParams.get("from"));
    toExclusive = parseDate(url.searchParams.get("to"), true);
    if (from && toExclusive && from >= toExclusive) return errorRedirect(request, "invalid-range");
  } catch { return errorRedirect(request, "invalid-range"); }

  const applications = await prisma.application.findMany({
    where: {
      userId: user.id,
      status: { not: ApplicationStatus.SAVED },
      appliedAt: { not: null, ...(from ? { gte: from } : {}), ...(toExclusive ? { lt: toExclusive } : {}) }
    },
    include: { company: true },
    orderBy: { appliedAt: "asc" }
  });
  if (!applications.length) return errorRedirect(request, "empty");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ApplyFlow"; workbook.created = new Date();
  const sheet = workbook.addWorksheet("Bewerbungsnachweis", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Bewerbungsdatum", key: "appliedAt", width: 20 },
    { header: "Unternehmen", key: "company", width: 28 },
    { header: "Position", key: "position", width: 34 },
    { header: "Status", key: "status", width: 24 },
    { header: "Ort", key: "location", width: 24 },
    { header: "Arbeitsmodell", key: "workMode", width: 18 },
    { header: "Stellenanzeige", key: "jobUrl", width: 34 },
    { header: "Zuletzt aktualisiert", key: "updatedAt", width: 22 }
  ];
  for (const application of applications) {
    const row = sheet.addRow({
      appliedAt: application.appliedAt,
      company: application.company.name,
      position: application.position,
      status: APPLICATION_STATUS_LABELS_DE[application.status],
      location: application.location ?? "",
      workMode: application.workMode ? WORK_MODE_LABELS[application.workMode] : "",
      jobUrl: application.jobUrl ? { text: "Stellenanzeige öffnen", hyperlink: application.jobUrl } : "",
      updatedAt: application.updatedAt
    });
    row.getCell("appliedAt").numFmt = "dd.mm.yyyy";
    row.getCell("updatedAt").numFmt = "dd.mm.yyyy";
    if (application.jobUrl) row.getCell("jobUrl").font = { color: { argb: "FF1F5EFF" }, underline: true };
  }
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF171717" } };
  header.alignment = { vertical: "middle" }; header.height = 24;
  sheet.autoFilter = { from: "A1", to: "H1" };
  sheet.eachRow(row => { row.alignment = { ...row.alignment, vertical: "middle" }; });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `ApplyFlow_Bewerbungsnachweis_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store"
  } });
}
