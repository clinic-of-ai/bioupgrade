import type { ReactNode } from "react";
import ShareReadingPrompt from "@/components/community/ShareReadingPrompt";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";
import {
  RESEARCH_BRIEFS,
  getFamilyName,
  getResearchPapers,
  type ResearchBrief,
  type ResearchPaper,
} from "@shared/research";

export const researchLabel =
  "mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className={researchLabel}>{children}</p>;
}

/** External references never inherit the opener and never use executable URLs. */
export function SourceLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  let safe = false;
  try {
    const url = new URL(href);
    safe = url.protocol === "https:" || url.protocol === "http:";
  } catch {
    // A missing or malformed identifier is not presented as a working reference.
  }
  if (!safe) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center gap-1.5 text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground ${className}`}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function paperIdentity(paper: ResearchPaper) {
  return paper.doi || paper.pmid || paper.url;
}

export type LibraryPaper = ReturnType<typeof getResearchPapers>[number] & {
  contexts: { brief: ResearchBrief; paper: ResearchPaper }[];
};

/** Keep every family relationship when the shared helper deduplicates a paper. */
export function getLibraryPapers(): LibraryPaper[] {
  return getResearchPapers().map(paper => ({
    ...paper,
    contexts: RESEARCH_BRIEFS.flatMap(brief =>
      brief.papers
        .filter(reference => paperIdentity(reference) === paperIdentity(paper))
        .map(reference => ({ brief, paper: reference }))
    ),
  }));
}

export function PaperIdentifiers({ paper }: { paper: ResearchPaper }) {
  const doi = paper.doi
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
  const pmid = paper.pmid.replace(/^PMID:\s*/i, "");
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      {paper.url && <SourceLink href={paper.url}>Primary source</SourceLink>}
      {doi && (
        <SourceLink href={`https://doi.org/${doi}`} className="mono break-all">
          DOI: {doi}
        </SourceLink>
      )}
      {pmid && /^\d+$/.test(pmid) && (
        <SourceLink
          href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
          className="mono"
        >
          PMID: {pmid}
        </SourceLink>
      )}
    </div>
  );
}

export function PaperCard({
  entry,
  familyId,
}: {
  entry: LibraryPaper;
  familyId?: string;
}) {
  const context =
    entry.contexts.find(item => item.brief.id === familyId) ??
    entry.contexts[0];
  const paper = context?.paper ?? entry;
  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-white">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="mono rounded-full border border-border bg-background px-3 py-1 text-[10px] uppercase tracking-[0.1em]">
            {paper.studyType}
          </span>
          <span className="mono text-[11px] text-muted-foreground">
            {paper.year} · {paper.journal}
          </span>
        </div>
        <h3 className="mt-5 font-sans text-xl font-medium leading-snug tracking-[-0.02em] md:text-[23px]">
          {paper.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {paper.authors}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {entry.contexts.map(({ brief, paper: reference }) => (
            <Link
              key={brief.id}
              href={`/research?family=${encodeURIComponent(brief.id)}#library`}
              className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs transition-colors hover:bg-secondary"
            >
              <BookOpen
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 text-accent"
              />
              {getFamilyName(brief.id)}
              <span className="text-muted-foreground">
                · {reference.relationship}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-6 grid gap-6 border-t border-border pt-6 md:grid-cols-2 md:gap-8">
          <div>
            <p className={`${researchLabel} text-accent`}>
              What the paper reports
            </p>
            <p className="mt-3 text-sm leading-relaxed">{paper.finding}</p>
          </div>
          <div>
            <p className={researchLabel}>Where the inference stops</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {paper.limitation}
            </p>
          </div>
        </div>
        {context && (
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Summary context: {getFamilyName(context.brief.id)} ·{" "}
            {paper.relationship}. A study of an entity is not evidence that a
            supplied product is equivalent.
          </p>
        )}
      </div>
      <div className="border-t border-border bg-background/50 px-6 py-2 md:px-8">
        <PaperIdentifiers paper={paper} />
        <ShareReadingPrompt source={paper} />
      </div>
    </article>
  );
}

export function BriefCard({ brief }: { brief: ResearchBrief }) {
  return (
    <article className="rounded-[16px] border border-border bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={researchLabel}>{brief.topic}</p>
          <h3 className="mt-3 text-[28px] leading-tight">{brief.name}</h3>
        </div>
        <span className="mono rounded-full border border-border bg-background px-3 py-1.5 text-[10px]">
          {brief.evidenceLevel}
        </span>
      </div>
      <p className="mt-5 text-sm leading-relaxed">{brief.evidenceSummary}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Key limitation: </span>
        {brief.limitation}
      </p>
      <details className="group mt-6 border-t border-border pt-2">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Mechanism & source record
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="pb-4 pt-3">
          <p className={researchLabel}>Mechanistic context</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {brief.mechanisticSummary}
          </p>
          <p className={`${researchLabel} mt-6`}>
            Linked papers · {brief.papers.length}
          </p>
          {brief.papers.length > 0 ? (
            <ol className="mt-3 divide-y divide-border">
              {brief.papers.map((paper, index) => (
                <li key={`${paperIdentity(paper)}-${index}`} className="py-3">
                  <p className="text-sm leading-relaxed">{paper.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paper.year} · {paper.studyType} · {paper.relationship}
                  </p>
                  <PaperIdentifiers paper={paper} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No primary papers are attached to this brief in the current source
              record.
            </p>
          )}
          {brief.sourceUrls.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className={researchLabel}>Additional source record</p>
              <div className="mt-2 flex flex-wrap gap-x-5">
                {brief.sourceUrls.map((url, index) => (
                  <SourceLink
                    key={`${url}-${index}`}
                    href={url}
                    className="text-xs"
                  >
                    Source {index + 1}
                  </SourceLink>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Study context, not a product rating.
        </p>
        <Link
          href={`/shop?family=${encodeURIComponent(brief.id)}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline"
        >
          View catalogue family{" "}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function ResearchBoundary({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`rounded-[14px] border border-border bg-secondary/40 ${compact ? "p-5" : "p-6 md:p-8"}`}
      aria-label="Research interpretation boundary"
    >
      <div className="flex items-start gap-3">
        <ExternalLink
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
        />
        <div>
          <p className="text-sm font-medium">
            A reference is not an approved product.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Publication, clinical study participation and regulatory approval
            are different things. These summaries concern the named study
            entities and their reported endpoints—not the identity, quality,
            safety or efficacy of supplied materials. Educational reading only;
            no medical advice or instructions for use.
          </p>
        </div>
      </div>
    </aside>
  );
}
