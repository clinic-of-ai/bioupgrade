import { Link } from "wouter";
import { ASSETS } from "@/lib/site";

/*
 * Hero — underground biopunk lab photograph (patched lab coat, glowing vial).
 * Isomorphic Labs-inspired mint overlay, forest typography, green CTA, and editorial spacing.
 */
export default function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-hidden grain">
      {/* Background image */}
      <img
        src={ASSETS.hero}
        alt="Researcher in a patched lab coat examining a glowing vial in an underground lab."
        className="hero-drift absolute inset-0 -z-20 h-full w-full object-cover object-[58%_center] md:object-[62%_center]"
        fetchPriority="high"
      />
      {/* Light mint wash keeps the supplied image visible while guaranteeing text contrast. */}
      <div
        className="absolute inset-0 -z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(239,248,240,1) 0%, rgba(239,248,240,0.97) 38%, rgba(239,248,240,0.7) 52%, rgba(239,248,240,0) 70%, rgba(239,248,240,0) 100%)",
        }}
      />
      {/* Mobile: the darker biopunk photo sits behind the copy, so the wash stays near-opaque. */}
      <div
        className="absolute inset-0 -z-10 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(239,248,240,0.55) 0%, rgba(239,248,240,0.9) 22%, rgba(239,248,240,0.92) 78%, rgba(239,248,240,0.7) 100%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(0deg, rgba(239,248,240,0.3) 0%, rgba(239,248,240,0) 45%, rgba(239,248,240,0) 100%)",
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px]" />

      <div className="container flex min-h-[100svh] flex-col justify-center pt-24 pb-20">
        <div className="hero-rise max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent/70" />
            <p className="mono text-[12px] tracking-[0.26em] text-accent">
              H+ · THE META, DECODED
            </p>
          </div>

          <h1 className="mt-6 text-[clamp(2.75rem,9vw,6rem)] leading-[0.98] text-foreground">
            Beyond baseline.
            <br />
            By design.
          </h1>

          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-foreground/70 md:text-[17px]">
            The crucible for chemonauts, bio-engineers and relentlessly academic
            minds who refuse to settle. We develop our own molecules and
            protocols with AI and every emerging technology, aimed at the
            evolution of the human mind and body: cognition, physique,
            aesthetics, vitality and longevity. One question drives us: how far
            can a human go?
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/book"
              className="btn-primary px-6 py-3.5 text-center text-[14px]"
            >
              Book a video consultation
            </Link>
            <Link
              href="/shop"
              className="btn-ghost px-6 py-3.5 text-center text-[14px]"
            >
              Shop the lab →
            </Link>
            <Link
              href="/research"
              className="mono px-2 py-3 text-center text-[13px] text-foreground/65 underline-offset-4 hover:text-foreground hover:underline"
            >
              Read the research
            </Link>
          </div>
          <p className="mono mt-6 text-[11px] tracking-[0.2em] text-foreground/45">
            CONSULTATIONS · RESEARCH · LAB
          </p>
        </div>
      </div>

      {/* scroll hint */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <span className="mono text-[11px] tracking-[0.24em] text-foreground/35">
          SCROLL
        </span>
      </div>
    </section>
  );
}
