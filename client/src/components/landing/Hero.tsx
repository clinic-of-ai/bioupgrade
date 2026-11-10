import { Link } from "wouter";
import { ASSETS } from "@/lib/site";

/*
 * Hero — exact user-provided Planhat-style portrait with warm golden visor light.
 * Isomorphic Labs-inspired mint overlay, forest typography, green CTA, and editorial spacing.
 */
export default function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-hidden grain">
      {/* Background image */}
      <img
        src={ASSETS.hero}
        alt="Person wearing a futuristic golden visor in a warm, sunlit natural setting."
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[58%_center] md:object-[62%_center]"
        fetchPriority="high"
      />
      {/* Light mint wash keeps the supplied image visible while guaranteeing text contrast. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(239,248,240,1) 0%, rgba(239,248,240,0.99) 42%, rgba(239,248,240,0.86) 58%, rgba(239,248,240,0.12) 100%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(0deg, rgba(239,248,240,0.44) 0%, rgba(239,248,240,0) 55%, rgba(239,248,240,0.14) 100%)",
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px]" />

      <div className="container flex min-h-[100svh] flex-col justify-center pt-24 pb-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent/70" />
            <p className="mono text-[12px] tracking-[0.26em] text-accent">
              MOLECULAR SCIENCE · THE META, DECODED
            </p>
          </div>

          <h1 className="mt-6 text-[clamp(2.75rem,9vw,6rem)] leading-[0.98] text-foreground">
            Read the papers.
            <br />
            Run the meta.
          </h1>

          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-foreground/70 md:text-[17px]">
            A source-led community for people who want to understand the
            frontier of bioscience. Read the methods, keep the uncertainty
            visible, and turn research into better questions—not unsupported
            health promises.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/book"
              className="btn-primary px-6 py-3.5 text-center text-[14px]"
            >
              Book a consultation
            </Link>
            <a
              href="/research"
              className="btn-ghost px-6 py-3.5 text-center text-[14px]"
            >
              Explore the paper library →
            </a>
          </div>
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
