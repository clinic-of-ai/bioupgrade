import { Link, useSearchParams } from "wouter";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CalEmbed from "@/components/CalEmbed";
import ConsultingFit, {
  ConsultingWorksheet,
  consultingSummary,
  resolveConsultingOffer,
} from "@/components/consulting/ConsultingFit";
import { ASSETS, CAL_LINK } from "@/lib/site";
import { getProduct, PRODUCTS } from "@shared/products";

export default function Book() {
  const [params] = useSearchParams();
  const requestedId = params.get("product");
  const selected = resolveConsultingOffer(requestedId);
  const isSession = selected.id === "research-strategy-session";
  const calendarConfigured = Boolean(
    CAL_LINK && CAL_LINK !== "CAL_LINK_PLACEHOLDER"
  );
  const unknownOffer = requestedId !== null && !getProduct(requestedId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav slim />
      <div className="relative isolate grain">
        <div className="pointer-events-none absolute -left-48 top-24 -z-10 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
        <main className="container pt-28 pb-24 md:pt-32">
          <Link
            href={`/products?product=${selected.id}`}
            className="mono mb-6 inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> REVIEW THE
            OFFER
          </Link>
          {unknownOffer && (
            <p
              role="status"
              className="mb-6 rounded-xl border border-border bg-white p-5 text-sm leading-relaxed text-muted-foreground"
            >
              This offer link is not recognised. Showing the Research Strategy
              Session; no project quote or booking has been created.
            </p>
          )}
          <Link
            href="/consultation/intake"
            className="mb-6 flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-white px-5 py-4 text-sm hover:border-accent"
          >
            <span>
              <span className="font-medium">
                Booking a Bio-Strategy, Growth, Performance or Elite session?
              </span>{" "}
              <span className="text-muted-foreground">
                Send your introduction and goal first, then pick a Read AI slot.
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-accent">
              Start the brief{" "}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
          <details className="mb-8 rounded-xl border border-border bg-white px-5">
            <summary className="min-h-12 cursor-pointer py-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              Change selected offer
            </summary>
            <nav
              aria-label="Consulting offers"
              className="grid gap-3 pb-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {PRODUCTS.map(product => (
                <Link
                  key={product.id}
                  href={`/book?product=${product.id}`}
                  aria-current={selected.id === product.id ? "page" : undefined}
                  className={`min-h-12 rounded-lg border p-4 text-sm leading-relaxed hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selected.id === product.id ? "border-accent bg-secondary/40" : "border-border"}`}
                >
                  <span className="block font-medium">{product.title}</span>
                  <span className="mono mt-2 block text-xs text-accent">
                    {product.priceLabel}
                  </span>
                  <span className="mono mt-2 block text-[10px] text-muted-foreground">
                    {product.eyebrow}
                  </span>
                  {!product.checkoutEnabled && (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Timing and final quote to agree
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </details>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="lg:pt-4">
              <p className="mono text-[12px] tracking-[0.22em] text-accent">
                <span className="text-foreground/35">§00 / </span>
                {isSession
                  ? "PREPARE YOUR PAPER QUESTION"
                  : "DISCUSS PROJECT SCOPE"}
              </p>
              <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] text-foreground">
                {selected.title}
              </h1>
              <p className="mt-7 max-w-lg text-[16px] leading-relaxed text-foreground/70">
                {consultingSummary(selected.id)}
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {isSession
                  ? "Bring the paper link, DOI or PMID, the passage you want to understand and your educational question. Examine what was measured, what the findings support and what remains uncertain—not what you personally should take or do."
                  : "A project begins with a fit and feasibility discussion, not a checkout. Prepare the question or team case, intended use and authorised sources. Written outputs, delivery capability, timing and final quote must be agreed before commitment."}
              </p>
              <div
                className="relative mt-8 overflow-hidden rounded-[16px] border border-accent/30"
                style={{ boxShadow: "0 16px 36px 0 rgba(63,153,95,0.12)" }}
              >
                <img
                  src={ASSETS.bookBg}
                  alt="Session-planning notebook, calendar and molecular model on a lab bench."
                  className="aspect-[16/7] w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="mono absolute bottom-3 left-4 text-[11px] tracking-[0.2em] text-white">
                  RESEARCH LITERACY · DEFINED SCOPE
                </span>
              </div>
              <div className="mt-8 rounded-[12px] border border-accent/20 bg-white px-5 py-4">
                <p className="mono text-sm text-accent">
                  {selected.priceLabel}
                </p>
                <p className="mono mt-2 text-xs leading-relaxed text-foreground/80">
                  {selected.eyebrow}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {isSession
                    ? "One question, one paper, 60 minutes. Confirm scope, written-output terms and availability separately; a payment does not reserve a slot."
                    : selected.kind === "workshop"
                      ? "Half-day team format; participants, timing and final quote must be agreed. The starting price is indicative, not a fixed-price order or charged estimate."
                      : "The starting price is indicative. Project timing is agreed in scope, not guaranteed by the catalogue. This is not a fixed-price order or charged estimate; agree the final quote and schedule first."}
                </p>
              </div>
              <ConsultingFit key={selected.id} productId={selected.id} />
            </div>
            <div>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="mono text-[12px] tracking-[0.18em] text-accent">
                  {isSession ? "SESSION CALENDAR" : "PROJECT SCOPE DISCUSSION"}
                </h2>
                <span className="mono text-[11px] tracking-[0.15em] text-foreground/50">
                  {isSession
                    ? calendarConfigured
                      ? "CAL.COM · SESSION ONLY"
                      : "NOT CONNECTED"
                    : "NO PROJECT BOOKING"}
                </span>
              </div>
              {isSession ? (
                <>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    Scheduling is separate from account-linked payment. Confirm
                    fit and terms before booking; availability is only confirmed
                    through an operational booking route.
                  </p>
                  <CalEmbed />
                  <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                    Any booking or payment handled by Cal.com is separate from
                    this site’s account-linked checkout and does not
                    automatically award Signal Points. A calendar interaction or
                    checkout return is not proof of a server-verified site
                    order.
                  </p>
                  <Link
                    href={`/products?product=${selected.id}`}
                    className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-accent underline underline-offset-4"
                  >
                    Review separate payment availability{" "}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <section
                  className="rounded-[16px] border border-accent/30 bg-white p-6 md:p-8"
                  aria-label="Project discussion conditions"
                >
                  <h3 className="text-2xl">Agree the work before the quote.</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    This page preserves your selected offer in the URL, but does
                    not send an enquiry, create a quote, reserve time or charge
                    for an estimate. There is no authorised email or project
                    intake service connected here.
                  </p>
                  <ul className="mt-6 space-y-4 text-sm leading-relaxed">
                    {[
                      "Confirm the educational question, intended audience and source or data permissions.",
                      "Agree written outputs, delivery capability, exclusions, acceptance criteria and revision limits.",
                      "Agree timing, review responsibilities, tool or external costs, final quote and separate payment terms.",
                    ].map(item => (
                      <li key={item} className="flex gap-3">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
                    {calendarConfigured
                      ? "The configured Cal.com calendar is for the individual Research Strategy Session only. It does not book this project, confirm its quote or establish project availability."
                      : "The calendar is not connected, and there is no project-specific booking route. No slot, quote, payment or reservation can be confirmed here."}
                  </p>
                  <Link
                    href={`/products?product=${selected.id}`}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-accent underline underline-offset-4"
                  >
                    Review this offer and quote controls{" "}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </section>
              )}
              <ConsultingWorksheet key={selected.id} productId={selected.id} />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
