"use client";
import Link from "next/link";
export default function ApplicationsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="state-page"><section className="panel state-card"><h1>Something went wrong.</h1><p>Try again or return later. Your application data has not been changed.</p><div className="state-actions"><button className="button button-primary" type="button" onClick={reset}>Try again</button><Link className="button button-secondary" href="/">Home</Link></div></section></div>; }
