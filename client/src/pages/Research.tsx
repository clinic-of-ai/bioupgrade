import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  BriefCard,
  PaperCard,
  ResearchBoundary,
  SectionLabel,
  getLibraryPapers,
  researchLabel,
} from "@/components/research/ResearchReading";
import {
  RESEARCH_BRIEFS,
  RESEARCH_UPDATED_AT,
  getFamilyName,
  type ResearchBrief,
  type ResearchPaper,
} from "@shared/research";

const selectClass =
  "mt-2 min-h-12 w-full rounded-[10px] border border-border bg-white px-3 font-sans text-sm normal-case tracking-normal text-foreground transition-colors hover:border-accent";
const normalize = (value: string) => value.toLocaleLowerCase().trim();
const searchText = (brief: ResearchBrief, paper?: ResearchPaper) =>
  normalize(
    [
      brief.name,
      getFamilyName(brief.id),
      brief.topic,
      brief.evidenceLevel,
      brief.mechanisticSummary,
      brief.evidenceSummary,
      brief.limitation,
      paper?.title,
      paper?.authors,
      paper?.journal,
      paper?.year,
      paper?.doi,
      paper?.pmid,
      paper?.finding,
      paper?.limitation,
      paper?.relationship,
    ]
      .filter(Boolean)
      .join(" ")
  );

export function researchLocationState(search: string) {
  const params = new URLSearchParams(search);
  return {
    family: params.get("family") ?? "",
    view:
      params.get("view") === "briefs"
        ? ("briefs" as const)
        : ("papers" as const),
  };
}

export default function Research() {
  const search = useSearch();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState(
    () => new URLSearchParams(search).get("family") ?? ""
  );
  const [topic, setTopic] = useState("");
  const [studyType, setStudyType] = useState("");
  const [view, setView] = useState<"papers" | "briefs">(() =>
    new URLSearchParams(search).get("view") === "briefs" ? "briefs" : "papers"
  );

  useEffect(() => {
    const state = researchLocationState(search);
    setFamily(state.family);
    setView(state.view);
  }, [search]);

  const papers = useMemo(() => getLibraryPapers(), [RESEARCH_BRIEFS]);
  const topics = [...new Set(RESEARCH_BRIEFS.map(brief => brief.topic))].sort();
  const studyTypes = [
    ...new Set(
      papers.flatMap(entry =>
        entry.contexts.map(context => context.paper.studyType)
      )
    ),
  ].sort();
  const families = [...RESEARCH_BRIEFS].sort((a, b) =>
    getFamilyName(a.id).localeCompare(getFamilyName(b.id))
  );
  const needle = normalize(query);
  const matchingContext = (brief: ResearchBrief, paper?: ResearchPaper) =>
    (!family || brief.id === family) &&
    (!topic || brief.topic === topic) &&
    (!studyType || paper?.studyType === studyType) &&
    (!needle || searchText(brief, paper).includes(needle));
  const filteredPapers = papers.filter(entry =>
    entry.contexts.some(({ brief, paper }) => matchingContext(brief, paper))
  );
  const filteredBriefs = RESEARCH_BRIEFS.filter(brief =>
    brief.papers.length > 0
      ? brief.papers.some(paper => matchingContext(brief, paper))
      : matchingContext(brief)
  );
  const hasFilters = Boolean(query || family || topic || studyType);
  const resetFilters = () => {
    setQuery("");
    setFamily("");
    setTopic("");
    setStudyType("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section
          className="container pb-14 pt-28 md:pb-20 md:pt-36"
          aria-labelledby="research-title"
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
            <div>
              <SectionLabel>
                <span className="text-accent">§01</span> / Research library
              </SectionLabel>
              <h1
                id="research-title"
                className="mt-5 max-w-3xl text-[clamp(2.65rem,6vw,5rem)] leading-[1.04]"
              >
                Read the papers.
                <br />
                <span className="text-accent">Keep the context.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                A curated source record for molecular research. Follow each
                paper from the entity studied to the finding reported—and the
                limits that belong beside it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#library"
                  className="btn-primary min-h-12 gap-2 px-6 text-sm"
                >
                  Explore the library{" "}
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </a>
                <Link
                  href="/meta"
                  className="inline-flex min-h-12 items-center gap-2 text-sm hover:text-accent"
                >
                  How to read the evidence{" "}
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              <p className="mono mt-7 text-[10px] tracking-[0.1em] text-muted-foreground">
                SOURCE EDITION · {RESEARCH_UPDATED_AT.toUpperCase()}
              </p>
            </div>
            <figure className="overflow-hidden rounded-[18px] border border-border bg-white">
              <img
                src="/images/research/lab-glassware.webp"
                alt="Laboratory glassware beside a clipped stack of highlighted research papers."
                className="aspect-[4/3] w-full object-cover"
                width={1600}
                height={1200}
                loading="lazy"
              />
              <figcaption className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
                Illustrative laboratory glassware. Not a Bioupgrade facility,
                supplier audit or product test.
              </figcaption>
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border px-2 py-5">
                {[
                  { value: papers.length, label: "Linked papers" },
                  { value: RESEARCH_BRIEFS.length, label: "Family briefs" },
                  { value: topics.length, label: "Topics" },
                ].map(item => (
                  <div key={item.label} className="px-3 text-center">
                    <p className="mono text-2xl text-foreground">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </figure>
          </div>
          <div className="mt-10">
            <ResearchBoundary compact />
          </div>
        </section>

        <section
          id="library"
          className="border-y border-border bg-white/40 py-14 md:py-20"
          aria-labelledby="library-title"
        >
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionLabel>Source index / Find a question</SectionLabel>
                <h2
                  id="library-title"
                  className="mt-4 text-[clamp(2rem,4vw,3rem)]"
                >
                  The reading library.
                </h2>
              </div>
              <div
                className="inline-flex gap-1 rounded-full border border-border bg-background p-1"
                aria-label="Library view"
              >
                {(["papers", "briefs"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={view === mode}
                    onClick={() => setView(mode)}
                    className={`mono min-h-11 rounded-full px-5 text-[11px] transition-colors ${view === mode ? "bg-foreground text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >
                    {mode === "papers" ? "Papers" : "Family briefs"}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={event => event.preventDefault()}
              role="search"
              aria-label="Filter research library"
              className="mt-8 rounded-[16px] border border-border bg-background p-5 md:p-6"
            >
              <label
                htmlFor="research-query"
                className={`${researchLabel} flex items-center gap-2`}
              >
                <Search aria-hidden="true" className="h-3.5 w-3.5" />
                Search the source record
              </label>
              <div className="relative mt-2">
                <input
                  id="research-query"
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search a molecule, title, author, DOI or finding…"
                  maxLength={300}
                  className="min-h-12 w-full rounded-[10px] border border-border bg-white px-4 pr-12 text-sm placeholder:text-muted-foreground"
                />
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-muted-foreground"
                />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label htmlFor="research-topic" className={researchLabel}>
                  Topic
                  <select
                    id="research-topic"
                    value={topic}
                    onChange={event => setTopic(event.target.value)}
                    className={selectClass}
                  >
                    <option value="">All topics</option>
                    {topics.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="research-family" className={researchLabel}>
                  Catalogue family
                  <select
                    id="research-family"
                    value={family}
                    onChange={event => setFamily(event.target.value)}
                    className={selectClass}
                  >
                    <option value="">All families</option>
                    {families.map(item => (
                      <option key={item.id} value={item.id}>
                        {getFamilyName(item.id)}
                      </option>
                    ))}
                    {family && !families.some(item => item.id === family) && (
                      <option value={family}>
                        {getFamilyName(family)} · no loaded brief
                      </option>
                    )}
                  </select>
                </label>
                <label htmlFor="research-study" className={researchLabel}>
                  Study type
                  <select
                    id="research-study"
                    value={studyType}
                    onChange={event => setStudyType(event.target.value)}
                    className={selectClass}
                  >
                    <option value="">All study types</option>
                    {studyTypes.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SlidersHorizontal
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                  Filters combine. Search includes brief context and paper
                  summaries.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex min-h-11 items-center gap-2 text-xs text-accent hover:underline"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p
                role="status"
                aria-live="polite"
                className="mono text-[11px] text-muted-foreground"
              >
                {view === "papers"
                  ? `${filteredPapers.length} of ${papers.length} unique linked papers`
                  : `${filteredBriefs.length} of ${RESEARCH_BRIEFS.length} family briefs`}
              </p>
              <p className="text-xs text-muted-foreground">
                {view === "papers"
                  ? "Newest publication first · sources open in new tabs"
                  : "Briefs containing matches · full attached source records"}
              </p>
            </div>

            {(view === "papers"
              ? filteredPapers.length
              : filteredBriefs.length) > 0 ? (
              <div
                className={`mt-5 grid gap-5 ${view === "briefs" ? "lg:grid-cols-2" : ""}`}
              >
                {view === "papers"
                  ? filteredPapers.map(entry => (
                      <PaperCard
                        key={entry.doi || entry.pmid || entry.url}
                        entry={entry}
                        familyId={
                          family ||
                          entry.contexts.find(context =>
                            matchingContext(context.brief, context.paper)
                          )?.brief.id
                        }
                      />
                    ))
                  : filteredBriefs.map(brief => (
                      <BriefCard key={brief.id} brief={brief} />
                    ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[16px] border border-dashed border-border bg-white px-6 py-12 text-center md:px-12">
                <BookOpen
                  aria-hidden="true"
                  className="mx-auto h-7 w-7 text-accent"
                />
                <h3 className="mt-5 text-2xl">
                  {papers.length || RESEARCH_BRIEFS.length
                    ? "No sources match these filters."
                    : "The source record is not loaded in this build."}
                </h3>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {papers.length || RESEARCH_BRIEFS.length
                    ? "Try a broader term or clear the filters. A missing match is not a scientific conclusion about the molecule."
                    : "Verified briefs and papers appear here when included in the shared research record. We do not fill missing references with invented titles or unsupported findings. The reading framework below remains available."}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn-ghost mt-6 min-h-11 px-5 text-xs"
                  >
                    Reset the library
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <section
          id="reading-framework"
          className="container py-16 md:py-24"
          aria-labelledby="framework-title"
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <SectionLabel>
                Reading framework / Before the conclusion
              </SectionLabel>
              <h2
                id="framework-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)]"
              >
                Four questions.
                <br />
                No shortcuts.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                This is a curated library, not an exhaustive systematic review
                or a formal meta-analysis. Short original summaries point to the
                source; they do not reproduce complete copyrighted papers.
              </p>
              <Link
                href="/meta#methods"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline"
              >
                Read the editorial method{" "}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <ol className="divide-y divide-border border-y border-border">
              {[
                [
                  "Entity",
                  "What, exactly, was studied?",
                  "Read the chemical identity, formulation and relationship label. A related peptide or a single component does not establish equivalence to a different entity or combination.",
                ],
                [
                  "Model",
                  "In whom—or in what model?",
                  "Cell, animal and human studies answer different questions. Human research is still specific to its population, comparator and setting; it is not a blanket endorsement.",
                ],
                [
                  "Endpoint",
                  "What was actually measured?",
                  "A mechanistic marker or surrogate endpoint is not automatically a clinical outcome. Read the effect estimate, uncertainty, follow-up and limitations before the headline.",
                ],
                [
                  "Replication",
                  "Does the finding travel?",
                  "Look for independent replication and comparable methods. One positive result does not establish generalizability, and a publication is not a supplier or batch verification.",
                ],
              ].map(([label, title, body], index) => (
                <li
                  key={label}
                  className="grid grid-cols-[2rem_1fr] gap-4 py-6"
                >
                  <span className="mono pt-1 text-[11px] text-accent">
                    0{index + 1}
                  </span>
                  <div>
                    <p className={researchLabel}>{label}</p>
                    <h3 className="mt-2 font-sans text-lg font-medium leading-snug">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-14 rounded-[16px] border border-border bg-white p-6 md:p-8">
            <SectionLabel>
              Relationship labels / Not an equivalence claim
            </SectionLabel>
            <div className="mt-5 grid gap-6 md:grid-cols-3">
              {[
                [
                  "Named compound",
                  "The source studies the named entity. This does not authenticate a supplied material or transfer the source's formulation and approval status.",
                ],
                [
                  "Component only",
                  "The source concerns one component, not the complete combination. Effects, interactions and identity of the whole cannot be inferred from it.",
                ],
                [
                  "Related entity",
                  "The source concerns a related but distinct entity. Similar naming or biology is not proof of chemical, formulation or clinical equivalence.",
                ],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-sans text-sm font-medium leading-snug">
                    {title}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:items-center">
            <p className="max-w-lg text-sm text-muted-foreground">
              Better questions are worth sharing. Bring a source, an uncertainty
              and a clear distinction between the two.
            </p>
            <Link
              href="/community"
              className="btn-ghost inline-flex min-h-12 shrink-0 items-center justify-center gap-2 px-6 text-xs"
            >
              Explore the community approach{" "}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
