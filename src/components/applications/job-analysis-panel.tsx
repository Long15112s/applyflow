import Link from "next/link";
import type { JobSeniority } from "@/generated/prisma/enums";
import { JobAnalysisButton } from "@/components/applications/job-analysis-button";

type AnalysisValue = {
  summary: string; seniority: JobSeniority; requiredSkills: unknown; preferredSkills: unknown; responsibilities: unknown;
  requirements: unknown; niceToHaves: unknown; keywords: unknown; updatedAt: Date; model: string | null;
};
type Skill = { name: string; category: string };
function skills(value: unknown): Skill[] { return Array.isArray(value) ? value.filter((item): item is Skill => typeof item === "object" && item !== null && typeof (item as Skill).name === "string" && typeof (item as Skill).category === "string") : []; }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function List({ values }: { values: string[] }) { return values.length ? <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul> : <p className="analysis-empty-copy">None explicitly identified.</p>; }
function SkillList({ values }: { values: Skill[] }) { return values.length ? <div className="skill-list">{values.map((skill, index) => <span title={skill.category.replaceAll("_", " ")} key={`${skill.name}-${index}`}>{skill.name}</span>)}</div> : <p className="analysis-empty-copy">None explicitly identified.</p>; }

export function JobAnalysisPanel({ applicationId, hasDescription, analysis }: { applicationId: string; hasDescription: boolean; analysis: AnalysisValue | null }) {
  return <section className="panel job-analysis-panel"><div className="panel-heading"><div><span className="eyebrow">AI-assisted extraction</span><h2>AI Job Analysis</h2><p>Structured facts extracted only from the stored job description.</p></div>{analysis && hasDescription ? <JobAnalysisButton applicationId={applicationId} reanalyze /> : null}</div>
    {!hasDescription ? <div className="analysis-empty-state"><p>Add a job description before running an analysis.</p><Link className="button button-secondary" href={`/applications/${applicationId}/edit`}>Edit application</Link></div> : !analysis ? <div className="analysis-empty-state"><p>Turn the job description into structured requirements and skills.</p><JobAnalysisButton applicationId={applicationId} /></div> : <div className="analysis-content">
      <section className="analysis-summary"><span>Summary</span><p>{analysis.summary}</p></section>
      <section><span>Seniority</span><strong className="seniority-badge">{analysis.seniority === "UNKNOWN" ? "Not specified" : analysis.seniority.charAt(0) + analysis.seniority.slice(1).toLowerCase()}</strong></section>
      <section><span>Required skills</span><SkillList values={skills(analysis.requiredSkills)} /></section>
      <section><span>Preferred skills</span><SkillList values={skills(analysis.preferredSkills)} /></section>
      <section><span>Responsibilities</span><List values={strings(analysis.responsibilities)} /></section>
      <section><span>Requirements</span><List values={strings(analysis.requirements)} /></section>
      <section><span>Nice to have</span><List values={strings(analysis.niceToHaves)} /></section>
      <section><span>Keywords</span><div className="keyword-list">{strings(analysis.keywords).map((keyword, index) => <span key={`${keyword}-${index}`}>{keyword}</span>)}</div></section>
      <footer>Last analyzed {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(analysis.updatedAt)}{analysis.model ? ` · ${analysis.model}` : ""}</footer>
    </div>}
  </section>;
}
