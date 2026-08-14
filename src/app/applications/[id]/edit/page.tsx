import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationEditForm } from "@/components/application-edit-form";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const application = await prisma.application.findFirst({ where: { id, userId: user.id }, include: { company: true } });
  if (!application) notFound();
  return <div className="narrow-page page-stack"><header className="page-header compact"><div><Link className="back-link" href={`/applications/${id}`}>← Application</Link><h1>Edit application</h1><p>Update the details for this opportunity.</p></div></header><ApplicationEditForm application={{ id: application.id, company: application.company.name, position: application.position, location: application.location, workMode: application.workMode, salaryMin: application.salaryMin, salaryMax: application.salaryMax, currency: application.currency, jobUrl: application.jobUrl, jobDescription: application.jobDescription, appliedAt: application.appliedAt ? application.appliedAt.toISOString().slice(0, 10) : "" }} /></div>;
}
