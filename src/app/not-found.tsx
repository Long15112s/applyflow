import Link from "next/link";
export default function NotFound() { return <div className="state-page"><section className="panel state-card"><span className="eyebrow">ApplyFlow</span><h1>Application not found.</h1><p>The application may not exist or you may not have access to it.</p><Link className="button button-primary" href="/applications">Back to applications</Link></section></div>; }
