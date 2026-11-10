import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CommunityBridge from "@/components/community/CommunityBridge";
import ShareReadingPrompt from "@/components/community/ShareReadingPrompt";
import {
  PaperIdentifiers,
  ResearchBoundary,
  SectionLabel,
  researchLabel,
} from "@/components/research/ResearchReading";
import {
  RESEARCH_BRIEFS,
  RESEARCH_UPDATED_AT,
  getFamilyName,
} from "@shared/research";
import {
  POINTS_PER_EURO,
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_HOLD_DAYS,
  REFERRAL_MAX_PER_MONTH,
  REFERRAL_REWARD_POINTS,
  REWARD_MISSIONS,
  REWARD_TIERS,
  getTierBenefits,
} from "@shared/rewards";

const firstPurchaseBonus =
  REWARD_MISSIONS.find(mission => mission.id === "first-purchase")?.points ?? 0;

function DiscussionPrompt() {
  const [briefId, setBriefId] = useState("");
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState<{
    briefId: string;
    question: string;
  } | null>(null);
  const draftBrief = RESEARCH_BRIEFS.find(brief => brief.id === draft?.briefId);
  const draftPaper = draftBrief?.papers[0];
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    setDraft({ briefId, question: question.trim() });
  };
  const clear = () => {
    setQuestion("");
    setBriefId("");
    setDraft(null);
  };
  return (
    <section
      id="question-builder"
      className="manus-no-record rounded-[16px] border border-border bg-white p-6 md:p-8"
      aria-labelledby="prompt-title"
    >
      <SectionLabel>Practice / A source-led question</SectionLabel>
      <h3 id="prompt-title" className="mt-4 text-[28px] leading-tight">
        Frame the discussion.
      </h3>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Choose a source context and write the uncertainty you want to explore.
        This tool creates a reading prompt on this page, not a post or a
        consultation request.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="discussion-brief" className={researchLabel}>
            Source context (optional)
          </label>
          <select
            id="discussion-brief"
            value={briefId}
            onChange={event => setBriefId(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-[10px] border border-border bg-background px-3 text-sm"
          >
            <option value="">Start with a general research question</option>
            {RESEARCH_BRIEFS.map(brief => (
              <option key={brief.id} value={brief.id}>
                {getFamilyName(brief.id)} · {brief.evidenceLevel}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="discussion-question" className={researchLabel}>
            What remains uncertain?
          </label>
          <textarea
            id="discussion-question"
            required
            maxLength={1200}
            rows={4}
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="For example: does the endpoint in this study answer the question being discussed?"
            className="mt-2 w-full resize-y rounded-[10px] border border-border bg-background p-4 text-sm leading-relaxed placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn-primary min-h-12 gap-2 px-5 text-xs"
          >
            <ClipboardList aria-hidden="true" className="h-4 w-4" />
            Frame my question
          </button>
          {(question || briefId || draft) && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Clear draft
            </button>
          )}
        </div>
      </form>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Local, temporary page state only. Nothing is automatically sent or
        saved. Copying or opening a device share sheet is your explicit action,
        not a verified post. No Signal Points are awarded. Do not include
        personal medical or sensitive information.
      </p>
      {draft && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-[12px] border border-border bg-secondary/35 p-5"
        >
          <p className={researchLabel}>Your reading prompt</p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed">
            {draft.question}
          </p>
          {draftBrief && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Source context: {draftBrief.name}. Keep this brief boundary in
              view: {draftBrief.limitation}
            </p>
          )}
          {draftPaper && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs leading-relaxed">
                Start with: {draftPaper.title}
              </p>
              <PaperIdentifiers paper={draftPaper} />
              <ShareReadingPrompt
                source={draftPaper}
                question={draft.question}
              />
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Before discussing: identify the exact entity and study model, name
            the measured endpoint, and distinguish the reported finding from
            what remains untested.
          </p>
        </div>
      )}
    </section>
  );
}

export default function Community() {
  const [tierId, setTierId] = useState(REWARD_TIERS[0].id);
  const tier = REWARD_TIERS.find(item => item.id === tierId) ?? REWARD_TIERS[0];
  const benefits = getTierBenefits(tier.id).filter(
    benefit => benefit.available
  );
  const starters = RESEARCH_BRIEFS.filter(
    brief => brief.papers.length > 0
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section
          className="container pb-16 pt-28 md:pb-20 md:pt-36"
          aria-labelledby="community-title"
        >
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div>
              <SectionLabel>
                <span className="text-accent">§03</span> / Community
              </SectionLabel>
              <h1
                id="community-title"
                className="mt-5 text-[clamp(2.7rem,6vw,5rem)] leading-[1.04]"
              >
                Better questions.
                <br />
                <span className="text-accent">Shared standards.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                Research literacy is a shared practice: cite the source,
                separate observation from interpretation, and leave room for an
                honest “not established.”
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/research"
                  className="btn-primary min-h-12 gap-2 px-6 text-sm"
                >
                  Start with the library{" "}
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <a
                  href="#standards"
                  className="btn-ghost inline-flex min-h-12 items-center justify-center px-6 text-xs"
                >
                  Our discussion standard
                </a>
              </div>
            </div>
            <aside className="self-end rounded-[18px] border border-border bg-white p-6 md:p-8">
              <SectionLabel>The scope today</SectionLabel>
              <p className="mt-5 text-2xl leading-snug tracking-[-0.02em]">
                One research community.
                <br />
                Connected across platforms.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Use Instagram for discovery, Bioscience Discord for the longer
                discussion, and Bioupgrade for source-linked papers and scoped
                educational work. Your account keeps purchases, points and
                referrals separate.
              </p>
              <div className="mt-6 border-t border-border pt-5">
                <p className="flex items-center gap-2 text-xs font-medium">
                  <ShieldCheck
                    aria-hidden="true"
                    className="h-4 w-4 text-accent"
                  />
                  Clear boundaries, no implied access
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Discussions remain on the external community platform, not a
                  mirrored private chat here. A points tier does not grant
                  Discord roles, paid community access or permission to use
                  research materials.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="container py-14 md:py-20">
          <CommunityBridge />
        </div>

        <section
          className="border-y border-border bg-white/40 py-14 md:py-16"
          aria-labelledby="routes-title"
        >
          <div className="container">
            <SectionLabel>Participate / Available routes</SectionLabel>
            <h2 id="routes-title" className="mt-4 text-[clamp(2rem,4vw,3rem)]">
              Find your starting point.
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  number: "01",
                  title: "Read a source",
                  body: "Explore linked papers and family briefs. Compare study context, reported findings and explicit limitations without needing an account.",
                  href: "/research",
                  cta: "Research library",
                  note: "Public reading · no reading awards",
                },
                {
                  icon: MessageSquare,
                  number: "02",
                  title: "Continue the discussion",
                  body: "Use a source-linked reading prompt to continue in Bioscience Discord. If one question needs deeper analysis, scope an educational consultation—not a treatment or compound-use protocol.",
                  href: "/community#community-network",
                  cta: "Find the community connection",
                  note: "External discussion · no automatic posting",
                },
                {
                  icon: ClipboardList,
                  number: "03",
                  title: "Keep your record",
                  body: "Use your protected account for verified purchase history, Signal Points, your referral code and its activity record. Account access requires sign-in.",
                  href: "/account",
                  cta: "Open your Signal account",
                  note: "Account record · not forum access",
                },
              ].map(item => (
                <article
                  key={item.number}
                  className="flex flex-col rounded-[16px] border border-border bg-white p-6 md:p-7"
                >
                  <div className="flex items-center justify-between">
                    <item.icon
                      aria-hidden="true"
                      className="h-5 w-5 text-accent"
                    />
                    <span className="mono text-[11px] text-muted-foreground">
                      {item.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl leading-tight">{item.title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mono mt-6 border-t border-border pt-5 text-[10px] text-muted-foreground">
                    {item.note}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline"
                  >
                    {item.cta}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="standards"
          className="container py-16 md:py-24"
          aria-labelledby="standards-title"
        >
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionLabel>Research culture / The standard</SectionLabel>
              <h2
                id="standards-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)]"
              >
                Bring the source.
                <br />
                Name the uncertainty.
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                A future-facing research culture does not need to outrun the
                evidence. It needs questions that another reader can inspect and
                challenge.
              </p>
              <ol className="mt-7 divide-y divide-border border-y border-border">
                {[
                  [
                    "Cite precisely",
                    "Link the original paper and its DOI or PMID where available. State which entity, population or model the source actually concerns.",
                  ],
                  [
                    "Separate levels of evidence",
                    "Do not turn a preclinical mechanism into a human outcome, a surrogate into a clinical endpoint, or a related entity into an equivalent compound.",
                  ],
                  [
                    "Welcome replication and disagreement",
                    "Ask what independent replication exists, distinguish exploratory from prespecified analysis and treat a correction as a useful part of the record.",
                  ],
                  [
                    "Keep boundaries visible",
                    "Discuss methods and published evidence, not personal treatment, administration, dosing or product efficacy claims. A referral or points balance is not a scientific credential.",
                  ],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-4 py-5">
                    <span className="mono pt-0.5 text-[11px] text-accent">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="font-sans text-sm font-medium leading-snug">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/meta#methods"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline"
              >
                Read the editorial method{" "}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <DiscussionPrompt />
          </div>

          {starters.length > 0 && (
            <div className="mt-16 border-t border-border pt-10">
              <SectionLabel>
                Reading starters / From the loaded source record
              </SectionLabel>
              <h3 className="mt-4 text-[28px]">
                Questions to bring to the source.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                These are entry points into published evidence, not active
                discussion threads or endorsements of catalogue materials.
              </p>
              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {starters.map(brief => (
                  <article
                    key={brief.id}
                    className="rounded-[14px] border border-border bg-white p-6"
                  >
                    <SectionLabel>{brief.topic}</SectionLabel>
                    <h4 className="mt-3 text-xl leading-tight">{brief.name}</h4>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      What does the source establish, and what remains outside
                      the conclusion?
                    </p>
                    <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Brief boundary:{" "}
                      </span>
                      {brief.limitation}
                    </p>
                    <div className="mt-4">
                      <p className="text-xs leading-relaxed">
                        {brief.papers[0].title}
                      </p>
                      <PaperIdentifiers paper={brief.papers[0]} />
                    </div>
                    <Link
                      href={`/research?family=${encodeURIComponent(brief.id)}#library`}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-accent hover:underline"
                    >
                      Read the full source record{" "}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    </Link>
                  </article>
                ))}
              </div>
              <p className="mono mt-5 text-[10px] text-muted-foreground">
                SOURCE EDITION · {RESEARCH_UPDATED_AT.toUpperCase()}
              </p>
            </div>
          )}
        </section>

        <section
          id="signal"
          className="border-y border-border bg-white/40 py-16 md:py-20"
          aria-labelledby="signal-title"
        >
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <SectionLabel>
                  Signal Points / A transparent record
                </SectionLabel>
                <h2
                  id="signal-title"
                  className="mt-4 text-[clamp(2rem,4vw,3rem)]"
                >
                  Recognition.
                  <br />
                  Not qualification.
                </h2>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  Signal Points are non-cash loyalty units for eligible,
                  server-verified site purchases and qualifying referrals. They
                  do not certify expertise, unlock a forum or change
                  research-material eligibility.
                </p>
                <Link
                  href="/account"
                  className="btn-primary mt-7 min-h-12 gap-2 px-6 text-xs"
                >
                  View your account record{" "}
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-[16px] border border-border bg-white p-6 md:p-8">
                <div className="grid gap-6 border-b border-border pb-6 sm:grid-cols-3">
                  {[
                    [String(POINTS_PER_EURO), "point per net eligible euro"],
                    [
                      String(firstPurchaseBonus),
                      "first eligible purchase bonus",
                    ],
                    [
                      String(REFERRAL_REWARD_POINTS),
                      "qualifying referral points",
                    ],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <p className="mono text-3xl text-accent">{value}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Purchase points are based on whole euros of retained eligible
                  product spend after discounts, excluding shipping and tax.
                  Research materials are excluded. The first-purchase bonus is
                  automatic after a qualifying verified payment, not a button to
                  claim.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Refunds and disputes reduce or reverse purchase points and
                  revoke first-purchase and referral qualification as
                  applicable. A checkout return URL is not proof of payment.
                  Separate Cal.com bookings do not automatically award site
                  Signal Points.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <section
                className="rounded-[16px] border border-border bg-white p-6 md:p-8"
                aria-labelledby="referral-title"
              >
                <SectionLabel>Referral rules / Before the reward</SectionLabel>
                <h3
                  id="referral-title"
                  className="mt-4 text-[28px] leading-tight"
                >
                  Attribution. Verification. Hold.
                </h3>
                <ol className="mt-6 space-y-5">
                  {[
                    [
                      "Record attribution before checkout",
                      `A referred account’s qualifying first eligible purchase must be verified within ${REFERRAL_ATTRIBUTION_DAYS} days of attribution. Research materials are excluded; sharing a code alone earns no points.`,
                    ],
                    [
                      "Allow the payment hold",
                      `A qualifying referral enters a ${REFERRAL_HOLD_DAYS}-day hold before ${REFERRAL_REWARD_POINTS} points can be released following payment verification. Pending points are not credited to the balance.`,
                    ],
                    [
                      "Respect the rolling cap",
                      `A maximum of ${REFERRAL_MAX_PER_MONTH} qualifying referral rewards applies per rolling 30-day window, not per calendar month.`,
                    ],
                    [
                      "Keep reversals in the record",
                      "Refunded or disputed qualifying orders revoke the referral. Released referral points are reversed; an incomplete hold does not become an earned reward.",
                    ],
                  ].map(([title, body], index) => (
                    <li key={title} className="flex gap-3">
                      <span className="mono mt-0.5 text-[11px] text-accent">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/account"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs text-accent hover:underline"
                >
                  See your code, hold and activity record{" "}
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </section>
              <section
                className="rounded-[16px] border border-border bg-white p-6 md:p-8"
                aria-labelledby="tier-title"
              >
                <SectionLabel>
                  Account tiers / Implemented benefits only
                </SectionLabel>
                <h3 id="tier-title" className="mt-4 text-[28px] leading-tight">
                  Your signal, with a record behind it.
                </h3>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Explore the recorded thresholds below. This is a public
                  preview, not your authenticated balance or a paid membership
                  entitlement.
                </p>
                <div
                  className="mt-5 grid grid-cols-2 gap-2"
                  aria-label="Preview account tier"
                >
                  {REWARD_TIERS.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTierId(item.id)}
                      aria-pressed={tier.id === item.id}
                      className={`min-h-16 rounded-[10px] border px-4 py-3 text-left transition-colors hover:border-accent ${tier.id === item.id ? "border-accent bg-secondary/60" : "border-border bg-background/50"}`}
                    >
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="mono mt-1 block text-[10px] text-muted-foreground">
                        {item.minPoints.toLocaleString("en-GB")}+ points
                      </span>
                    </button>
                  ))}
                </div>
                <div
                  className="mt-6 border-t border-border pt-5"
                  aria-live="polite"
                >
                  <p className={researchLabel}>
                    {tier.label} / Available account features
                  </p>
                  <ul className="mt-4 space-y-3">
                    {benefits.map(benefit => (
                      <li
                        key={benefit.label}
                        className="flex items-start gap-2 text-xs leading-relaxed"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                        />
                        {benefit.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                  Additional discounts, early access and member events are not
                  implemented benefits. Reading awards and gated community
                  access are not offered here. Points have no cash value.
                </p>
              </section>
            </div>
          </div>
        </section>

        <section
          className="container py-14 md:py-20"
          aria-label="Community research boundary"
        >
          <ResearchBoundary />
          <div className="mt-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <p className="max-w-xl text-[17px] leading-relaxed">
              The next step is not a stronger claim.
              <br />
              <span className="text-muted-foreground">
                It is a better-documented question.
              </span>
            </p>
            <Link
              href="/meta"
              className="btn-ghost inline-flex min-h-12 shrink-0 items-center justify-center gap-2 px-6 text-xs"
            >
              Read The Meta{" "}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
