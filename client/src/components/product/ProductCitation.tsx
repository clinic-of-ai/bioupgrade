import type { ResearchPaper } from "@shared/research";
import { PaperIdentifiers } from "@/components/research/ResearchReading";

const relationshipNotes: Record<ResearchPaper["relationship"], string> = {
  "named compound":
    "This paper concerns the named research entity, not this catalogue presentation or a supplied batch. It does not authenticate the labelled material or establish formulation equivalence.",
  "component only":
    "This paper concerns an individual component, not the complete listed combination. It does not establish blend identity, interactions, synergy or outcomes for the combination.",
  "related entity":
    "This paper concerns a related but distinct entity. Similar naming or biology does not establish sequence, formulation or clinical equivalence with the catalogue label.",
};

export default function ProductCitation({
  paper,
  index,
}: {
  paper: ResearchPaper;
  index: number;
}) {
  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-white">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Source {String(index + 1).padStart(2, "0")} · {paper.year}
          </p>
          <span className="mono rounded-full border border-border bg-background px-3 py-1.5 text-[10px]">
            {paper.relationship}
          </span>
        </div>
        <h3 className="mt-5 font-sans text-xl font-medium leading-snug tracking-[-0.02em] md:text-2xl">
          {paper.title}
        </h3>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {paper.authors}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {paper.journal} · {paper.year}
        </p>
        <div className="mt-5 rounded-[10px] border border-border bg-background/60 p-4">
          <p className="mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Study type
          </p>
          <p className="mt-2 text-sm leading-relaxed">{paper.studyType}</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-accent">
              Reported finding
            </p>
            <p className="mt-3 text-sm leading-relaxed">{paper.finding}</p>
          </div>
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Limitation
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {paper.limitation}
            </p>
          </div>
        </div>
        <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Paper-to-catalogue relationship:{" "}
          </span>
          {relationshipNotes[paper.relationship]}
        </p>
      </div>
      <div className="border-t border-border bg-background/50 px-6 py-2 md:px-8">
        <PaperIdentifiers paper={paper} />
      </div>
    </article>
  );
}
