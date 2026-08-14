"use client";
export default function ApplicationError({ reset }: { error: Error; reset: () => void }) { return <div className="panel error-state"><h1>Could not load application</h1><p>Please try again. Your data has not been changed.</p><button className="button button-primary" onClick={reset}>Try again</button></div>; }
