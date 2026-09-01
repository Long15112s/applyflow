"use client";
export default function CalendarError({ reset }: { error: Error; reset: () => void }) { return <section className="panel error-state"><h1>Calendar unavailable</h1><p>We could not load your calendar. Please try again.</p><button className="button button-primary" type="button" onClick={reset}>Try again</button></section>; }
