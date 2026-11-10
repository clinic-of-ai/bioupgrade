import { Link } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  MARKETPLACE_PRODUCTS,
  OWNER_CATALOGUE_PRODUCTS,
} from "@shared/marketplace";
import {
  POINTS_PER_EURO,
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_HOLD_DAYS,
  REFERRAL_MAX_PER_MONTH,
  REFERRAL_REWARD_POINTS,
  REWARD_MISSIONS,
} from "@shared/rewards";

const sectionLabel =
  "mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground";
const firstPurchasePoints = REWARD_MISSIONS.find(
  mission => mission.id === "first-purchase"
)?.points;
const archiveCount = MARKETPLACE_PRODUCTS.filter(
  product => product.source === "supplier-image"
).length;
const conceptCount = MARKETPLACE_PRODUCTS.filter(
  product => product.source === "concept"
).length;

const sourceRecords = [
  {
    number: "01",
    title: "A source price",
    body: "An owner list or attachment records a name, nominal pack quantity and stated price. It is not a stock ledger, an authenticated manufacturer record or permission to buy.",
    boundary: "Catalogue wording ≠ material verification",
  },
  {
    number: "02",
    title: "A published paper",
    body: "A paper reports experiments on a defined study entity, model and formulation. Its findings stay with those methods and limitations; they do not certify a catalogue product or supplier.",
    boundary: "Literature linkage ≠ batch certification",
  },
  {
    number: "03",
    title: "A batch document",
    body: "A certificate of analysis should identify the tested lot, analytical methods, results, dates and responsible laboratory. The document itself still needs an authenticity and applicability check.",
    boundary: "A document ≠ automatic procurement approval",
  },
];

const coaChecklist = [
  [
    "Exact material identity",
    "Full chemical or peptide identity; sequence, relevant modifications, salt or complex, and composition for each blend component. A reseller name or abbreviated label alone is insufficient.",
  ],
  [
    "A traceable lot",
    "Batch or lot identifier tied to the labelled material, with sample identity, provenance and chain-of-custody information sufficient to understand what was actually tested.",
  ],
  [
    "Identity method & result",
    "The analytical identity method, result and supporting record. Techniques such as mass spectrometry are examples to assess for suitability—not claims that these catalogue materials have been tested.",
  ],
  [
    "Purity, content & uncertainty",
    "Method-specific purity and assay/content results, units, acceptance criteria and supporting chromatograms or other relevant data. Chromatographic purity alone does not establish total content, sterility or safety.",
  ],
  [
    "Dates & report provenance",
    "Sampling and testing dates, report issue date, laboratory identity, report number and a verifiable issuer record. Manufacture, retest or expiry dates should be recorded where supplied and justified.",
  ],
  [
    "Relevant additional tests",
    "A qualified assessment of which additional attributes matter for the specified research application, such as residual solvents, water, contaminants or microbiological attributes. Do not infer tests or results that are absent.",
  ],
  [
    "Scope & limitations",
    "Sample basis, test limitations and whether the report concerns this exact lot and presentation. A report for another lot, component or formulation does not resolve the current product's documentation gap.",
  ],
];

const publicStatuses = [
  [
    "Batch COAs & underlying analytical records",
    "Not provided",
    "No lot-specific identity or purity certification is published for the research catalogue.",
  ],
  [
    "Safety data sheets (SDS)",
    "Not provided",
    "Product-specific handling, storage and transport documentation must come from the responsible provider.",
  ],
  [
    "Current batch photographs & stock counts",
    "Not provided",
    "Reference packaging, molecular structures and laboratory illustrations are not proof of supplied inventory.",
  ],
  [
    "Manufacturer / supplier authentication",
    "Not verified here",
    "A stated brand is a catalogue label, not confirmation of manufacturer authorization or an audited supply chain.",
  ],
  [
    "Merchant & research-organisation verification",
    "Not implemented",
    "A public, documented qualification review is not yet implemented. An account or interest submission is not a verified-buyer credential.",
  ],
  [
    "Seller & destination requirements",
    "Qualified review required",
    "Requirements depend on the actual material, seller, destination and intended research activity; no blanket legal determination is made.",
  ],
  [
    "Live payment configuration",
    "Not established by this page",
    "The presence of commerce code or Stripe references does not show that live payment acceptance, fulfilment or launch approvals are configured.",
  ],
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section
          className="container pb-14 pt-28 md:pb-20 md:pt-36"
          aria-labelledby="documentation-title"
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div>
              <p className={sectionLabel}>
                Documentation / Research catalogue standards
              </p>
              <h1
                id="documentation-title"
                className="mt-5 max-w-3xl text-[clamp(2.65rem,5.7vw,4.8rem)] leading-[1.05]"
              >
                A reference is not
                <br />
                <span className="text-accent">an approved product.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                Keep the price record, the scientific source and the supplied
                batch separate. This page explains what the catalogue
                documents—and what it does not.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#public-status"
                  className="btn-primary min-h-12 px-6 text-sm"
                >
                  Read the public status ↓
                </a>
                <Link
                  href="/research"
                  className="btn-ghost min-h-12 px-5 text-xs"
                >
                  Explore the papers
                </Link>
              </div>
              <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground">
                An editorial standard and disclosure record, not a legal policy,
                certification service or procurement approval.
              </p>
            </div>
            <aside
              className="overflow-hidden rounded-[18px] border border-border bg-white"
              aria-label="Documentation reading key"
            >
              <div className="border-b border-border bg-secondary/40 p-6">
                <p className={sectionLabel}>
                  Three records / Three different questions
                </p>
                <h2 className="mt-4 text-3xl">Follow the record.</h2>
              </div>
              <ol className="divide-y divide-border px-6">
                {[
                  ["Source", "What wording and price were supplied?"],
                  ["Evidence", "What entity and endpoint were studied?"],
                  ["Batch", "What material was actually tested?"],
                ].map(([label, question], index) => (
                  <li
                    key={label}
                    className="grid grid-cols-[2rem_1fr] gap-3 py-6"
                  >
                    <span className="mono text-xs text-accent">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {question}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="border-t border-border px-6 py-4 text-xs leading-relaxed text-muted-foreground">
                Research batch documents are not provided. The checklist below
                describes evidence to request, not certificates we hold.
              </p>
            </aside>
          </div>
        </section>

        <section
          id="source-standards"
          className="border-y border-border bg-white/40 py-14 md:py-20"
          aria-labelledby="source-title"
        >
          <div className="container">
            <div className="grid gap-5 md:grid-cols-[0.7fr_1.3fr] md:gap-12">
              <div>
                <p className={sectionLabel}>01 / Source distinctions</p>
                <h2
                  id="source-title"
                  className="mt-4 text-[clamp(2rem,4vw,3rem)]"
                >
                  Do not collapse
                  <br />
                  the evidence.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:pt-8">
                A stated price, a scientific publication and a certificate of
                analysis answer different questions. None substitutes for the
                others, and none by itself establishes eligibility, safety or
                lawful procurement.
              </p>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {sourceRecords.map(record => (
                <article
                  key={record.number}
                  className="flex flex-col rounded-[16px] border border-border bg-white p-6"
                >
                  <p className="mono text-[11px] text-accent">
                    {record.number} / RECORD TYPE
                  </p>
                  <h3 className="mt-5 text-2xl">{record.title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {record.body}
                  </p>
                  <p className="mono mt-6 border-t border-border pt-4 text-[10px] leading-relaxed">
                    {record.boundary}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-8 rounded-[14px] border border-border bg-background p-6 md:p-8">
              <h3 className="font-sans text-lg font-medium leading-snug">
                Current list first. Archive kept separate.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The shared catalogue contains {OWNER_CATALOGUE_PRODUCTS.length}{" "}
                current owner-list price rows. The {archiveCount} older
                attachment-source entries and {conceptCount} legacy concepts
                remain for source history and saved interests; they do not
                replace the current list or imply an active offer. Titles,
                quantities and price labels are preserved as supplied.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Listed quantities describe nominal catalogue packs, not
                administration instructions. “Not provided” is an information
                gap—not a manufacturer name or verification outcome.
              </p>
              <Link
                href="/shop"
                className="mt-3 inline-flex min-h-11 items-center text-sm text-accent hover:underline"
              >
                View the current catalogue →
              </Link>
            </div>
          </div>
        </section>

        <section
          id="public-status"
          className="container py-14 md:py-20"
          aria-labelledby="status-title"
        >
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className={sectionLabel}>02 / Public status</p>
              <h2
                id="status-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)]"
              >
                The gaps are
                <br />
                <span className="text-accent">part of the record.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                All research-catalogue batch documents are currently not
                provided. Neither a literature link nor a reference image closes
                that gap.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex min-h-11 items-center text-sm text-accent hover:underline"
              >
                Review catalogue entries →
              </Link>
            </div>
            <dl className="overflow-hidden rounded-[16px] border border-border bg-white">
              {publicStatuses.map(([title, status, explanation], index) => (
                <div
                  key={title}
                  className={`p-5 md:p-6 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <dt className="max-w-sm text-sm font-medium">{title}</dt>
                    <dd className="mono rounded-full border border-border bg-background px-3 py-1.5 text-[10px]">
                      {status}
                    </dd>
                  </div>
                  <dd className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {explanation}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section
          id="coa"
          className="border-y border-border bg-white/40 py-14 md:py-20"
          aria-labelledby="coa-title"
        >
          <div className="container grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className={sectionLabel}>03 / Batch COA review checklist</p>
              <h2 id="coa-title" className="mt-4 text-[clamp(2rem,4vw,3rem)]">
                Ask what
                <br />
                was tested.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                These are review questions, not test results. No fabricated
                certificates, purity percentages, lot numbers or downloadable
                COAs are supplied.
              </p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
                The appropriate analytical scope depends on the actual material
                and research application. A qualified reviewer must assess
                method suitability and document authenticity.
              </p>
            </div>
            <ol className="divide-y divide-border border-y border-border">
              {coaChecklist.map(([title, body], index) => (
                <li
                  key={title}
                  className="grid grid-cols-[2rem_1fr] gap-4 py-6"
                >
                  <span className="mono pt-1 text-[11px] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-medium leading-snug">
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
        </section>

        <section
          id="identity"
          className="container py-14 md:py-20"
          aria-labelledby="identity-title"
        >
          <p className={sectionLabel}>04 / Identity & interpretation</p>
          <h2
            id="identity-title"
            className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3rem)]"
          >
            Names are not specifications.
          </h2>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            An exact entity must be identified before its literature can be
            mapped. The catalogue deliberately preserves unresolved names and
            component relationships rather than filling the gaps with reseller
            descriptions.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              [
                "Undefined blends & fragments",
                "Klow and Glow have no supplied composition. The HGH Frag label has no exact sequence and is not equated with AOD9604 or another residue-defined fragment.",
              ],
              [
                "Abbreviations & distinct entities",
                "An abbreviated BPC label does not establish BPC-157 identity. A CJC no-DAC label is not automatically the long-acting DAC-containing CJC-1295 studied in human research. TB-500 naming does not settle fragment versus full-length thymosin-beta-4 identity.",
              ],
              [
                "Component papers ≠ combination evidence",
                "A paper about one component does not establish a blend's identity, interactions or synergy. Each paper retains its named-compound, component-only or related-entity relationship and its own limitations.",
              ],
              [
                "A model ≠ a buyer outcome",
                "Cell, animal and human studies answer different questions. A human study remains bounded by its population, formulation, comparator, duration and endpoints. No supplied-product or individual outcome is inferred.",
              ],
            ].map(([title, body]) => (
              <article
                key={title}
                className="rounded-[14px] border border-border bg-white p-6"
              >
                <h3 className="font-sans text-lg font-medium leading-snug">
                  {title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2">
            <Link
              href="/research"
              className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
            >
              Read the paper relationships →
            </Link>
            <Link
              href="/community"
              className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
            >
              Explore source-led community discussion →
            </Link>
          </div>
        </section>

        <section
          id="review"
          className="border-y border-border bg-secondary/30 py-14 md:py-20"
          aria-labelledby="review-title"
        >
          <div className="container grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className={sectionLabel}>05 / Before any procurement</p>
              <h2
                id="review-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)]"
              >
                Review is not
                <br />a green badge.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                Research materials are not offered for human or animal use. A
                “research use” label does not by itself determine legality,
                seller permissions or buyer eligibility.
              </p>
            </div>
            <div className="space-y-5">
              <article className="rounded-[14px] border border-border bg-white p-6">
                <h3 className="font-sans text-lg font-medium leading-snug">
                  Merchant and research-organisation qualification
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Public merchant and research-organisation verification is not
                  yet implemented. Intended research activity, exact identity,
                  relevant institutional information and applicable
                  seller/destination requirements need qualified review before
                  any procurement decision. No licence, credential or approval
                  is claimed here.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Creating an account, recording interest, booking a call or
                  reaching a points tier does not automatically approve a buyer.
                  No blanket legality or FDA-approval criterion is used as a
                  substitute for the required assessment.
                </p>
              </article>
              <article
                id="handling"
                className="rounded-[14px] border border-border bg-white p-6"
              >
                <h3 className="font-sans text-lg font-medium leading-snug">
                  SDS, shipping, storage and handling
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Use only applicable, product-specific documentation from the
                  responsible provider for qualified review of these matters. No
                  provider SDS, transport classification, verified shipping
                  conditions or storage specification has been supplied to this
                  public catalogue.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  This site does not invent temperature requirements, shelf
                  life, transport routes, handling protocols, reconstitution,
                  dosing or cycle instructions. Reference packaging and
                  molecular images are not provider documentation.
                </p>
              </article>
              <article className="rounded-[14px] border border-border bg-white p-6">
                <h3 className="font-sans text-lg font-medium leading-snug">
                  What an interest record means
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The catalogue interest flow asks for consent before recording
                  interest. It is not an order, a reservation, an eligibility
                  application or a promise of future supply. This standards page
                  has no document-upload form or connected email channel.
                </p>
                <Link
                  href="/shop"
                  className="mt-3 inline-flex min-h-11 items-center text-sm text-accent hover:underline"
                >
                  Return to the catalogue →
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section
          id="commerce"
          className="container py-14 md:py-20"
          aria-labelledby="commerce-title"
        >
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className={sectionLabel}>
                06 / Ordinary commerce & Signal Points
              </p>
              <h2
                id="commerce-title"
                className="mt-4 text-[clamp(2rem,4vw,3rem)]"
              >
                A commerce record.
                <br />
                Not a credential.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                Signal Points belong to eligible ordinary educational commerce,
                not research-material procurement. They have no cash value and
                do not change eligibility or document status.
              </p>
              <Link
                href="/account"
                className="mt-4 inline-flex min-h-11 items-center text-sm text-accent hover:underline"
              >
                View your protected account record →
              </Link>
            </div>
            <div>
              <div className="rounded-[16px] border border-border bg-white p-6 md:p-8">
                <h3 className="font-sans text-lg font-medium leading-snug">
                  Implemented rules, not a live-launch claim
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  The ordinary-commerce flow uses verified Stripe payment events
                  to maintain order and reward records in the protected account.
                  A checkout return URL alone is not proof of payment. This
                  describes the implementation; it does not imply that live
                  payments, product approvals or fulfilment are currently
                  configured.
                </p>
                <dl className="mt-6 divide-y divide-border border-y border-border">
                  <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-5">
                    <dt className="mono text-xs text-accent">Base points</dt>
                    <dd className="text-sm leading-relaxed">
                      {POINTS_PER_EURO} base point per whole net eligible EUR of
                      retained product spend after discounts. Shipping and tax
                      are excluded. Research materials earn no purchase points.
                    </dd>
                  </div>
                  {firstPurchasePoints !== undefined && (
                    <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-5">
                      <dt className="mono text-xs text-accent">
                        First purchase
                      </dt>
                      <dd className="text-sm leading-relaxed">
                        {firstPurchasePoints} mission points after the first
                        verified eligible purchase. This is automatic
                        qualification, not a self-claim button; refunds or
                        disputes can reverse it.
                      </dd>
                    </div>
                  )}
                  <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-5">
                    <dt className="mono text-xs text-accent">Referrals</dt>
                    <dd className="text-sm leading-relaxed">
                      {REFERRAL_REWARD_POINTS} points for a qualifying first
                      ordinary purchase attributed before the first checkout and
                      paid within {REFERRAL_ATTRIBUTION_DAYS} days of
                      attribution. A {REFERRAL_HOLD_DAYS}-day payment hold
                      applies, with a maximum of {REFERRAL_MAX_PER_MONTH}{" "}
                      qualifying rewards per rolling 30 days. Research materials
                      are excluded.
                    </dd>
                  </div>
                  <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-5">
                    <dt className="mono text-xs text-accent">Refund-aware</dt>
                    <dd className="text-sm leading-relaxed">
                      Refunds and disputes reduce or reverse retained-spend
                      points and revoke first-purchase and referral
                      qualification where applicable. A held referral is not a
                      credited balance.
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                  Points, membership and tier recognition do not certify
                  scientific training, unlock research materials or substitute
                  for a qualified review. Planned reading missions do not award
                  points until verification exists.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
                >
                  Educational services →
                </Link>
                <Link
                  href="/community"
                  className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
                >
                  Community & points context →
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
                >
                  Catalogue →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="education"
          className="container pb-16 md:pb-24"
          aria-labelledby="education-title"
        >
          <div className="grid gap-8 rounded-[16px] border border-border bg-white p-6 md:grid-cols-[1.2fr_0.8fr] md:p-9">
            <div>
              <p className={sectionLabel}>07 / Educational scope</p>
              <h2 id="education-title" className="mt-4 text-3xl md:text-4xl">
                Better questions.
                <br />
                <span className="text-accent">Clearer boundaries.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Educational consultations focus on research literacy: reading
                papers, understanding models and endpoints, comparing evidence
                and identifying uncertainty. They are not diagnosis, treatment,
                medical prescribing or product-use guidance, and they do not
                approve research procurement.
              </p>
            </div>
            <div className="flex flex-col items-start justify-center gap-3 md:items-end">
              <Link href="/book" className="btn-primary min-h-12 px-6 text-sm">
                Discuss the educational evidence →
              </Link>
              <Link
                href="/research"
                className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
              >
                Start with the source library
              </Link>
            </div>
          </div>
          <p className="mt-6 max-w-4xl text-xs leading-relaxed text-muted-foreground">
            This page is not Terms of Service, a Privacy Policy, a refund
            entitlement statement or legal advice. Merchant identity, contact
            details, contractual terms and applicable seller/destination
            obligations require owner confirmation and qualified review; no
            missing legal policy is fabricated here.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
