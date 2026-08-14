import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/applications");
  return <div className="landing-page"><header className="landing-nav"><Link className="brand" href="/"><span className="brand-mark">A</span><span>ApplyFlow</span></Link><Link className="button button-secondary" href="/login">Sign in</Link></header><main>
    <section className="landing-hero"><span className="eyebrow">Job application tracker</span><h1>Your job search,<br />under control.</h1><p>Track applications, manage your pipeline and understand your progress.</p><div className="landing-actions"><Link className="button button-primary" href="/login">Get started with GitHub</Link><a className="button button-secondary" href="#features">View features</a></div></section>
    <section className="landing-preview" aria-label="ApplyFlow product preview"><div className="preview-column"><span>Applied</span><article><small>Stripe</small><strong>Frontend Engineer</strong></article></div><div className="preview-column"><span>Interview</span><article><small>Siemens</small><strong>Software Engineer</strong></article></div><div className="preview-column"><span>Offer</span><article><small>SAP</small><strong>Backend Developer</strong></article></div></section>
    <section className="landing-features" id="features"><article><span>01</span><h2>Application tracking</h2><p>Keep every opportunity and its activity history in one place.</p></article><article><span>02</span><h2>Kanban pipeline</h2><p>Move applications through every stage of the hiring process.</p></article><article><span>03</span><h2>Analytics</h2><p>Understand how your job search is progressing with reliable data.</p></article></section>
  </main></div>;
}
