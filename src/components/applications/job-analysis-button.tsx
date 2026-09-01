"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analyzeApplicationJobDescription } from "@/app/applications/job-analysis-actions";

export function JobAnalysisButton({ applicationId, reanalyze = false }: { applicationId: string; reanalyze?: boolean }) {
  const router = useRouter(); const [error, setError] = useState<string | null>(null); const [pending, startTransition] = useTransition();
  function analyze() {
    setError(null);
    startTransition(async () => {
      const result = await analyzeApplicationJobDescription(applicationId);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }
  return <div className="analysis-action"><button className={reanalyze ? "button button-secondary" : "button button-primary"} disabled={pending} type="button" onClick={analyze}>{pending ? "Analyzing…" : reanalyze ? "Analyze again" : "Analyze job description"}</button><span className="form-hint" aria-live="polite">{error}</span></div>;
}
