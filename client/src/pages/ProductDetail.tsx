import { Link, useParams } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductCitation from "@/components/product/ProductCitation";
import { SourceLink } from "@/components/research/ResearchReading";
import {
  getMarketplaceProduct,
  OWNER_CATALOGUE_PRODUCTS,
  type MarketplaceProduct,
} from "@shared/marketplace";
import { getProductImage, type ProductImage } from "@shared/product-images";
import {
  getFamilyName,
  getResearchBrief,
  RESEARCH_UPDATED_AT,
} from "@shared/research";

const sectionLabel =
  "mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground";
const interestHref = (id: string) =>
  `/shop?product=${encodeURIComponent(id)}#product-interest`;

function ImageCaption({ image }: { image: ProductImage }) {
  const context =
    image.type === "reference packaging"
      ? "Reference packaging—not supplied batch."
      : image.type === "molecular structure"
        ? "Molecular structure—not photograph. This reference does not identify a supplied batch."
        : "Illustrative laboratory image—not a photograph of the supplied product.";
  return (
    <figcaption className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">{context}</p>
      <p className="mt-1">{image.caption}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>{image.credit}</span>
        <SourceLink href={image.sourceUrl} className="text-[11px]">
          Image source
        </SourceLink>
      </div>
    </figcaption>
  );
}

function ProductRecord({
  product,
  isCurrent,
}: {
  product: MarketplaceProduct;
  isCurrent: boolean;
}) {
  const entries = [
    ["Listed quantity", product.quantityLabel ?? "Not provided"],
    ["Manufacturer label", product.manufacturerLabel ?? "Not provided"],
    ["Listed form", product.formLabel ?? "Not provided"],
    [
      "Research family",
      product.familyId
        ? getFamilyName(product.familyId)
        : "Not mapped in the shared catalogue",
    ],
    ["Research topic", product.topic ?? "Not provided"],
    ["Batch documentation", product.documentationStatus ?? "Not provided"],
  ];
  return (
    <div className="mt-8 overflow-hidden rounded-[16px] border border-border bg-white">
      <div className="border-b border-border px-5 py-4">
        <p className={sectionLabel}>
          {isCurrent ? "Owner-list record" : "Preserved catalogue record"}
        </p>
      </div>
      <dl className="divide-y divide-border px-5">
        {entries.map(([label, value]) => (
          <div
            key={label}
            className="grid gap-1.5 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4"
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words text-sm leading-relaxed">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-border bg-background/50 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        A manufacturer label records the supplied wording; it is not
        manufacturer verification. “Not provided” means the record has no
        manufacturer information. A catalogue quantity is not an administration
        instruction.
      </p>
    </div>
  );
}

export default function ProductDetail({
  productId,
}: { productId?: string; params?: { productId: string } } = {}) {
  const params = useParams<{ productId: string }>();
  const resolvedId = productId ?? params.productId;
  const product = resolvedId ? getMarketplaceProduct(resolvedId) : undefined;

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="container flex min-h-[75vh] flex-col justify-center pb-20 pt-32">
          <p className={sectionLabel}>Catalogue / Not found</p>
          <h1 className="mt-5 max-w-3xl text-[clamp(2.75rem,6vw,4.75rem)]">
            This product is not in the record.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            We cannot match this link to a known catalogue entry. No identity,
            price or availability has been inferred from the address.
          </p>
          <div className="mt-8">
            <Link href="/shop" className="btn-primary min-h-12 px-6 text-sm">
              Back to the catalogue →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCurrent = OWNER_CATALOGUE_PRODUCTS.some(
    item => item.id === product.id
  );
  const isArchive = product.source === "supplier-image";
  const brief = getResearchBrief(product.familyId);
  const image = product.image ?? getProductImage(product.id, product.familyId);
  const related = product.familyId
    ? OWNER_CATALOGUE_PRODUCTS.filter(
        item => item.familyId === product.familyId && item.id !== product.id
      )
    : [];
  const recordLabel = isCurrent
    ? "Current owner list"
    : isArchive
      ? "Attachment archive"
      : "Legacy concept";
  const priceContext = isCurrent
    ? "Owner-listed price · not a confirmed order offer"
    : isArchive
      ? "Archived attachment price · separate from the current owner list"
      : "Preserved concept record · not available to order";
  const researchHref = product.familyId
    ? `/research?family=${encodeURIComponent(product.familyId)}`
    : "/research";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section
          className="container pb-14 pt-28 md:pb-20 md:pt-32"
          aria-labelledby="product-title"
        >
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center hover:text-accent"
            >
              Catalogue
            </Link>
            <span aria-hidden="true">/</span>
            <span>{recordLabel}</span>
          </nav>
          <div className="grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            <div className="order-2 lg:order-1">
              <figure className="overflow-hidden rounded-[18px] border border-border bg-white">
                <div
                  className={
                    image.type === "illustrative laboratory"
                      ? "bg-secondary/30"
                      : "bg-white p-6 md:p-10"
                  }
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={`aspect-square w-full ${image.type === "illustrative laboratory" ? "object-cover" : "object-contain"}`}
                    width={720}
                    height={720}
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <ImageCaption image={image} />
              </figure>
              <aside
                className="mt-5 rounded-[14px] border border-border bg-secondary/40 p-5"
                aria-label="Public documentation status"
              >
                <p className="text-sm font-medium">
                  No supplied batch is authenticated here.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Batch COA and SDS: not provided. Actual stock counts, current
                  batch photographs and fulfilment records require owner
                  documentation. An image or listed price does not confirm
                  availability.
                </p>
                <Link
                  href="/documentation#public-status"
                  className="mt-2 inline-flex min-h-11 items-center text-xs text-accent hover:underline"
                >
                  See the documentation standard →
                </Link>
              </aside>
            </div>
            <div className="order-1 min-w-0 lg:order-2">
              <p className={sectionLabel}>
                {recordLabel} / Research & source record
              </p>
              <h1
                id="product-title"
                className="mt-5 break-words text-[clamp(2.4rem,4.5vw,4rem)] leading-[1.06]"
              >
                {product.title}
              </h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              {!isCurrent && (
                <p className="mt-5 rounded-[10px] border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
                  {isArchive
                    ? "This older attachment entry is retained for source history and saved interests. It does not replace a price or specification on the current owner list."
                    : "This legacy concept is retained for saved interests and history. Production, delivery or launch approval must not be inferred from this record."}
                </p>
              )}
              <div className="mt-7 border-y border-border py-5">
                <p className="mono break-words text-[clamp(1.65rem,3vw,2.25rem)] leading-tight">
                  {product.priceLabel}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {priceContext}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={interestHref(product.id)}
                  className="btn-primary min-h-12 px-6 text-sm"
                >
                  Record interest →
                </Link>
                <Link
                  href={researchHref}
                  className="btn-ghost min-h-12 px-5 text-xs"
                >
                  Read the papers
                </Link>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Continue to the catalogue’s consent-based interest form. This is
                not checkout, a stock reservation or procurement approval.
              </p>
              <ProductRecord product={product} isCurrent={isCurrent} />
            </div>
          </div>
          <div className="mt-10 grid gap-5 border-t border-border pt-7 md:grid-cols-[0.7fr_1.3fr]">
            <p className={sectionLabel}>Reading, not a use protocol</p>
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.complianceNote}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                No self-use, dosing, reconstitution or cycle instructions are
                provided. Publications do not establish the identity, purity,
                safety or suitability of this catalogue material. No
                research-material purchase or referral rewards apply.
              </p>
            </div>
          </div>
        </section>

        <section
          id="evidence"
          className="border-y border-border bg-white/40 py-14 md:py-20"
          aria-labelledby="evidence-title"
        >
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
              <div>
                <p className={sectionLabel}>
                  Academic reading / Entity before inference
                </p>
                <h2
                  id="evidence-title"
                  className="mt-4 text-[clamp(2rem,4vw,3.15rem)]"
                >
                  The mechanism.
                  <br />
                  <span className="text-accent">And its limits.</span>
                </h2>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                  A research family is a reading pathway, not a product ranking.
                  Named-compound, component-only and related-entity papers must
                  not be treated as interchangeable.
                </p>
                <p className="mono mt-6 text-[10px] tracking-[0.1em] text-muted-foreground">
                  SOURCE EDITION · {RESEARCH_UPDATED_AT.toUpperCase()}
                </p>
                <Link
                  href={researchHref}
                  className="mt-4 inline-flex min-h-11 items-center text-sm text-accent hover:underline"
                >
                  Open the research library →
                </Link>
              </div>
              {brief ? (
                <div className="rounded-[16px] border border-border bg-white p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="mono rounded-full border border-border bg-background px-3 py-1.5 text-[11px]">
                      {brief.evidenceLevel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Evidence context · not a quality or approval badge
                    </span>
                  </div>
                  <p className={`${sectionLabel} mt-6`}>{brief.topic}</p>
                  <h3 className="mt-3 font-sans text-xl font-medium leading-snug">
                    {brief.name}
                  </h3>
                  <div className="mt-6 space-y-6">
                    <div>
                      <p className="mono text-[11px] uppercase tracking-[0.12em] text-accent">
                        Mechanistic context
                      </p>
                      <p className="mt-3 text-sm leading-relaxed">
                        {brief.mechanisticSummary}
                      </p>
                    </div>
                    <div className="border-t border-border pt-5">
                      <p className={sectionLabel}>Evidence summary</p>
                      <p className="mt-3 text-sm leading-relaxed">
                        {brief.evidenceSummary}
                      </p>
                    </div>
                    <div className="border-t border-border pt-5">
                      <p className={sectionLabel}>Interpretation boundary</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {brief.limitation}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-border bg-white p-6 md:p-8">
                  <p className={sectionLabel}>
                    No mapped brief in the loaded record
                  </p>
                  <h3 className="mt-4 text-2xl">
                    No mechanism has been assigned here.
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {product.familyId
                      ? "A family identifier exists, but its verified research brief is not loaded in this build. We do not replace missing sources with invented papers or findings."
                      : "This archived or legacy entry has no research-family mapping in the shared catalogue. A name, quantity or image alone is not enough to establish an exact scientific identity."}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <h3 className="text-2xl md:text-3xl">
                  The linked primary papers.
                </h3>
                <p className="mono text-[11px] text-muted-foreground">
                  {brief?.papers.length ?? 0} attached source
                  {brief?.papers.length === 1 ? "" : "s"}
                </p>
              </div>
              {brief && brief.papers.length > 0 ? (
                <div className="space-y-5">
                  {brief.papers.map((paper, index) => (
                    <ProductCitation
                      key={`${paper.doi || paper.pmid || paper.url}-${index}`}
                      paper={paper}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[14px] border border-dashed border-border bg-white p-6 md:p-8">
                  <p className="text-sm font-medium">
                    No primary papers are attributed to this entry in the loaded
                    record.
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {brief?.evidenceLevel === "Identity unresolved"
                      ? "Unresolved composition or sequence prevents an exact literature match. Papers about presumed ingredients or different fragments are not supplied as evidence for this label. This does not prove that no relevant research exists."
                      : "The absence of an attached reference is a documentation gap, not a scientific conclusion. Browse the library for source-led reading without inferring product equivalence."}
                  </p>
                </div>
              )}
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Short editorial summaries and citations point to the original
                sources; complete papers are not reproduced here. Human research
                describes the study population, formulation and endpoints—not an
                expected outcome for a buyer.
              </p>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section
            className="container py-14 md:py-20"
            aria-labelledby="variants-title"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={sectionLabel}>
                  Current owner list / Same reading family
                </p>
                <h2
                  id="variants-title"
                  className="mt-4 text-[clamp(2rem,4vw,3rem)]"
                >
                  Related listed variants.
                </h2>
              </div>
              <Link
                href={`/shop?family=${encodeURIComponent(product.familyId!)}`}
                className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
              >
                View family in the catalogue →
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              Shared family does not mean verified formulation equivalence.
              These are the exact titles and prices on the current owner list,
              not alternative doses or recommendations.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(variant => (
                <Link
                  key={variant.id}
                  href={`/shop/${encodeURIComponent(variant.id)}`}
                  className="group flex min-h-44 flex-col justify-between rounded-[14px] border border-border bg-white p-5 transition-colors hover:border-accent hover:bg-secondary/30"
                >
                  <div>
                    <p className="mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      Owner-list variant
                    </p>
                    <h3 className="mt-3 font-sans text-base font-medium leading-snug group-hover:text-accent">
                      {variant.title}
                    </h3>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <span className="mono text-lg">{variant.priceLabel}</span>
                    <span className="text-xs text-accent">
                      View the source record →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section
          className="container pb-16 pt-12 md:pb-24"
          aria-labelledby="discussion-title"
        >
          <div className="grid gap-6 rounded-[16px] border border-border bg-secondary/40 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-9">
            <div>
              <p className={sectionLabel}>
                Bring a question, not an expectation
              </p>
              <h2 id="discussion-title" className="mt-4 text-3xl">
                Discuss the educational evidence.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                An educational consultation can help you read a study, compare
                models and understand uncertainty. It does not provide
                diagnosis, medical prescribing, product-use instructions or
                research procurement approval.
              </p>
            </div>
            <div className="flex flex-col items-start justify-center gap-3 md:items-end">
              <Link href="/book" className="btn-primary min-h-12 px-6 text-sm">
                Book an educational discussion →
              </Link>
              <Link
                href="/documentation"
                className="inline-flex min-h-11 items-center text-xs text-accent hover:underline"
              >
                Read the catalogue standards
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
