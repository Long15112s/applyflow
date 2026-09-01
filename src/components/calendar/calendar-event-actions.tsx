"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelCalendarEvent, deleteCalendarEvent } from "@/app/calendar/actions";

export function CalendarEventActions({ eventId, cancelled }: { eventId: string; cancelled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function run(action: (id: string) => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action(eventId);
      if (result.error) { setError(result.error); return; }
      router.push("/calendar");
      router.refresh();
    });
  }
  return <section className="panel danger-panel">
    <h3>Event actions</h3><p>Cancel this appointment or permanently remove it.</p>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <div className="event-action-buttons">
      {!cancelled ? <button className="button button-secondary" disabled={pending} type="button" onClick={() => run(cancelCalendarEvent)}>{pending ? "Working…" : "Cancel event"}</button> : null}
      <button className="button button-danger" disabled={pending} type="button" onClick={() => { if (window.confirm("Permanently delete this event?")) run(deleteCalendarEvent); }}>Delete permanently</button>
    </div>
  </section>;
}
