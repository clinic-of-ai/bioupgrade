import { ArrowDown, ArrowUpRight, Check, FileText } from "lucide-react";
import { Link } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  PaperIdentifiers,
  ResearchBoundary,
  SectionLabel,
  SourceLink,
  researchLabel,
} from "@/components/research/ResearchReading";
import {
  RESEARCH_BRIEFS,
  RESEARCH_UPDATED_AT,
  getFamilyName,
  type ResearchBrief,
} from "@shared/research";

function SourcePerspective({ brief }: { brief?: ResearchBrief }) {
  if (!brief) {
    return (
      <aside className="rounded-[14px] border border-dashed border-border bg-white/50 p-6">
        <SectionLabel>Source-record note</SectionLabel>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No matching verified brief is included in the currently loaded record.
          This perspective is a reading method, not a substitute for an absent
          citation.
        </p>
        <Link
          href="/research"
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-accent hover:underline"
        >
          Open the source index{" "}
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </aside>
    );
  }
  const paper =
    brief.papers.find(item => item.relationship !== "named compound") ??
    brief.papers[0];
  return (
    <aside className="rounded-[16px] border border-border bg-white p-6 md:p-7">
      <SectionLabel>From the loaded source record</SectionLabel>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h3 className="text-2xl leading-tight">{brief.name}</h3>
        <span className="mono rounded-full bg-secondary/60 px-3 py-1.5 text-[10px]">
          {brief.evidenceLevel}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed">{brief.evidenceSummary}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Brief boundary: </span>
        {brief.limitation}
      </p>
      {paper ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className={researchLabel}>
            {paper.year} · {paper.studyType} · {paper.relationship}
          </p>
          <p className="mt-3 text-sm font-medium leading-relaxed">
            {paper.title}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {paper.authors} · {paper.journal}
          </p>
          <p className="mt-4 text-sm leading-relaxed">
            <span className="font-medium">Reported: </span>
            {paper.finding}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              Not established:{" "}
            </span>
            {paper.limitation}
          </p>
          <div className="mt-3">
            <PaperIdentifiers paper={paper} />
          </div>
        </div>
      ) : (
        <p className="mt-5 text-xs text-muted-foreground">
          No primary paper is attached to this brief in the current record.
        </p>
      )}
      {!paper && brief.sourceUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5">
          {brief.sourceUrls.map((url, index) => (
            <SourceLink key={`${url}-${index}`} href={url} className="text-xs">
              Source record {index + 1}
            </SourceLink>
          ))}
        </div>
      )}
      <Link
        href={`/research?family=${encodeURIComponent(brief.id)}&view=briefs#library`}
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline"
      >
        Read the {getFamilyName(brief.id)} source record{" "}
        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </aside>
  );
}

export default function Meta() {
  const humanBrief =
    RESEARCH_BRIEFS.find(
      brief =>
        brief.evidenceLevel === "Human research" && brief.papers.length > 0
    ) ??
    RESEARCH_BRIEFS.find(
      brief =>
        brief.evidenceLevel === "Mixed evidence" && brief.papers.length > 0
    );
  const preclinicalBrief =
    RESEARCH_BRIEFS.find(
      brief =>
        brief.evidenceLevel === "Preclinical research" &&
        brief.papers.length > 0
    ) ??
    RESEARCH_BRIEFS.find(
      brief =>
        brief.evidenceLevel === "Mixed evidence" &&
        brief.id !== humanBrief?.id &&
        brief.papers.length > 0
    );
  const identityBrief =
    RESEARCH_BRIEFS.find(
      brief => brief.evidenceLevel === "Identity unresolved"
    ) ??
    RESEARCH_BRIEFS.find(
      brief =>
        brief.id !== humanBrief?.id &&
        brief.id !== preclinicalBrief?.id &&
        brief.papers.some(paper => paper.relationship !== "named compound")
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section
          className="container pb-16 pt-28 md:pb-20 md:pt-36"
          aria-labelledby="meta-title"
        >
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
            <div>
              <SectionLabel>
                <span className="text-accent">§02</span> / The Meta
              </SectionLabel>
              <h1
                id="meta-title"
                className="mt-5 text-[clamp(2.8rem,6.4vw,5.25rem)] leading-[1.04]"
              >
                Precision is
                <br />a <span className="text-accent">method.</span>
                <br />
                Not a promise.
              </h1>
              <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                The interesting part of molecular research is not the most
                confident headline. It is the chain of evidence between a
                precise entity, an experiment and a conclusion that can survive
                scrutiny.
              </p>
              <a
                href="#perspectives"
                className="btn-primary mt-8 min-h-12 gap-2 px-6 text-sm"
              >
                Read this edition{" "}
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
            <aside className="self-end rounded-[18px] border border-border bg-white p-6 md:p-8">
              <SectionLabel>Editorial edition</SectionLabel>
              <p className="mono mt-4 text-lg">{RESEARCH_UPDATED_AT}</p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Three perspectives on evidence, precision molecular development
                and the information around a paper.
              </p>
              <ol className="mt-6 divide-y divide-border border-y border-border">
                {[
                  ["01", "#precision", "Precision begins with the entity"],
                  ["02", "#endpoints", "Endpoints before adjectives"],
                  ["03", "#identity", "The entity is not the supplier"],
                ].map(([number, href, title]) => (
                  <li key={number}>
                    <a
                      href={href}
                      className="flex min-h-16 items-center gap-4 py-3 text-sm hover:text-accent"
                    >
                      <span className="mono text-[11px] text-accent">
                        {number}
                      </span>
                      {title}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="ml-auto h-4 w-4 shrink-0"
                      />
                    </a>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                A dated, curated edition—not a scheduled weekly feed, automated
                monitoring service or formal meta-analysis.
              </p>
            </aside>
          </div>
        </section>

        <section
          className="bg-foreground py-12 text-white md:py-16"
          aria-label="Editorial principle"
        >
          <div className="container grid gap-7 md:grid-cols-[0.3fr_0.7fr] md:gap-12">
            <p className="mono text-[11px] uppercase tracking-[0.16em] text-white/70">
              Read the papers.
              <br />
              Run the meta.
            </p>
            <div>
              <p className="max-w-3xl text-[clamp(1.6rem,3.2vw,2.55rem)] leading-snug tracking-[-0.03em]">
                An observed effect belongs to its entity, model and endpoint.
                Keep all three in the sentence.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/70">
                Here, “the meta” means examining the information around a
                result: study design, population, comparators, uncertainty,
                replication and provenance. It does not mean pooling
                incomparable studies into a single score.
              </p>
            </div>
          </div>
        </section>

        <div id="perspectives" className="container py-16 md:py-24">
          <article
            id="precision"
            className="grid gap-8 lg:grid-cols-2 lg:gap-16"
            aria-labelledby="precision-title"
          >
            <div>
              <SectionLabel>
                Perspective 01 / Precision molecular development
              </SectionLabel>
              <h2
                id="precision-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-tight"
              >
                Start with the entity.
                <br />
                Then the experiment.
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  Precision should describe the question, not decorate the
                  claim. A target hypothesis, a defined molecular entity and a
                  study endpoint are separate parts of a development story.
                  Evidence at one step does not complete the others.
                </p>
                <p>
                  Before interpreting a result, record what the paper actually
                  studied: the identity, formulation, comparator, model and
                  population. Read the authors’ measured outcome rather than
                  replacing it with a broad promise. Human research remains
                  bounded by its specific design and setting.
                </p>
                <p>
                  The next useful question is whether an independent group can
                  reproduce the finding under comparable conditions. Mechanistic
                  plausibility helps frame an experiment; replication and
                  appropriate endpoints determine how much weight its result
                  deserves.
                </p>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-medium">A useful reading question</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Which exact step of the development chain does this source
                  support—and which step is still an assumption?
                </p>
              </div>
            </div>
            <SourcePerspective brief={humanBrief} />
          </article>

          <article
            id="endpoints"
            className="mt-16 grid gap-8 border-t border-border pt-16 lg:grid-cols-2 lg:gap-16 md:mt-20 md:pt-20"
            aria-labelledby="endpoints-title"
          >
            <div>
              <SectionLabel>Perspective 02 / Interpretation</SectionLabel>
              <h2
                id="endpoints-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-tight"
              >
                Endpoints before
                <br />
                <span className="text-accent">adjectives.</span>
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  A paper’s title is an invitation to read, not a complete
                  account of what happened. Look for the actual measurement: a
                  laboratory signal, a surrogate endpoint, a functional measure
                  or a clinical outcome. Preserve the distinction when you
                  discuss it.
                </p>
                <p>
                  A cell or animal finding belongs in its preclinical context.
                  It can inform a research question without establishing an
                  outcome in humans. Equally, a human study should not be
                  extended beyond the participants, conditions and observation
                  period it reports.
                </p>
                <p>
                  Read the comparator, effect estimate, uncertainty and
                  follow-up together. Ask whether the endpoint was prespecified,
                  whether analyses were exploratory and whether relevant
                  negative results are visible. Independent replication matters
                  more than repeating the same source in several summaries.
                </p>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-medium">A useful reading question</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Am I describing a measured result, or translating it into an
                  outcome the study never tested?
                </p>
              </div>
            </div>
            <SourcePerspective brief={preclinicalBrief} />
          </article>

          <article
            id="identity"
            className="mt-16 grid gap-8 border-t border-border pt-16 lg:grid-cols-2 lg:gap-16 md:mt-20 md:pt-20"
            aria-labelledby="identity-title"
          >
            <div>
              <SectionLabel>Perspective 03 / Provenance</SectionLabel>
              <h2
                id="identity-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-tight"
              >
                The entity is
                <br />
                not the supplier.
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  A literature citation identifies a source. It does not
                  authenticate a vendor, verify a batch or establish that a
                  supplied product has the same identity and formulation as the
                  study material. A bibliography and a product-quality record
                  answer different questions.
                </p>
                <p>
                  Our library therefore distinguishes a named compound from a
                  component-only source and a related entity. Those labels
                  prevent a paper about one molecule from quietly becoming
                  evidence for a blend or a differently specified material.
                </p>
                <p>
                  We do not infer Klow or Glow composition from their names. We
                  do not treat a thymosin β4 paper as proof of TB500
                  equivalence, or collapse distinct CJC formulations into one
                  entity. If identity is unresolved, the honest conclusion is to
                  keep it unresolved.
                </p>
                <p>
                  Publication is not approval. Regulatory status belongs to a
                  particular entity, formulation, indication and jurisdiction;
                  it is not a league table for research materials. No evidence
                  label here establishes a supplied product’s safety or
                  efficacy.
                </p>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-medium">A useful reading question</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  What connects this exact source to this exact entity—and is
                  that connection documented or merely implied?
                </p>
              </div>
            </div>
            <SourcePerspective brief={identityBrief} />
          </article>
        </div>

        <section
          id="methods"
          className="border-y border-border bg-white/40 py-16 md:py-20"
          aria-labelledby="methods-title"
        >
          <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <SectionLabel>Meta-information / Editorial method</SectionLabel>
              <h2
                id="methods-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)]"
              >
                A conclusion
                <br />
                with a record.
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                This edition draws its source examples only from the shared
                verified briefs loaded into the site. It is a curated reading
                guide, not a claim of complete coverage or a systematic search
                of the literature.
              </p>
              <p className="mono mt-5 text-[11px] text-muted-foreground">
                SOURCE EDITION · {RESEARCH_UPDATED_AT.toUpperCase()}
              </p>
            </div>
            <div className="rounded-[16px] border border-border bg-white p-6 md:p-8">
              <ul className="space-y-5">
                {[
                  [
                    "Identify the source",
                    "Retain the title, authors, year, journal and available DOI or PMID. Follow the original reference rather than relying on a summary alone.",
                  ],
                  [
                    "Preserve the study context",
                    "Keep the study type, entity relationship and measured result visible. Do not combine clinical and preclinical contexts into an efficacy score.",
                  ],
                  [
                    "Pair findings with limits",
                    "Each paper summary has an adjacent limitation. Family-level synthesis does not erase paper-level uncertainty.",
                  ],
                  [
                    "Make missing evidence visible",
                    "No fabricated citations, inferred compositions or substituted entities. A missing source or unresolved identity stays explicit.",
                  ],
                  [
                    "Keep commercial boundaries intact",
                    "A linked catalogue family is navigation, not a scientific endorsement. Points, tier status and consultation do not change product eligibility.",
                  ],
                ].map(([title, body]) => (
                  <li key={title} className="flex gap-3">
                    <Check
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-accent"
                    />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex items-start gap-3 border-t border-border pt-5">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Original short summaries and linked references only. Full
                  publisher texts remain at their sources; access may depend on
                  publisher availability.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="container py-14 md:py-20"
          aria-label="Continue reading"
        >
          <ResearchBoundary />
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/research"
              className="btn-primary min-h-12 gap-2 px-6 text-sm"
            >
              Open the research library{" "}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/book"
              className="btn-ghost inline-flex min-h-12 items-center justify-center gap-2 px-6 text-xs"
            >
              Discuss a research question{" "}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
