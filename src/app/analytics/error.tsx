"use client";
export default function AnalyticsError({ reset }: { error: Error; reset: () => void }) { return <div className="panel error-state"><h1>Could not load analytics</h1><p>Please try again. Your application data has not been changed.</p><button className="button button-primary" type="button" onClick={reset}>Try again</button></div>; }
