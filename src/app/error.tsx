"use client";
import Link from "next/link";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="state-page"><section className="panel state-card"><span className="eyebrow">ApplyFlow</span><h1>Something went wrong.</h1><p>Try again or return to your applications.</p><div className="state-actions"><button className="button button-primary" type="button" onClick={reset}>Try again</button><Link className="button button-secondary" href="/applications">Back to applications</Link></div></section></div>; }
