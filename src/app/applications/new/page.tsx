import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationCreateForm } from "@/components/application-create-form";

export const metadata: Metadata = { title: "New application" };

export default function NewApplicationPage() {
  return <div className="narrow-page page-stack"><header className="page-header compact"><div><Link className="back-link" href="/applications">← Applications</Link><h1>Add application</h1><p>Capture the core information first. You can update it at any time.</p></div></header><ApplicationCreateForm /></div>;
}
