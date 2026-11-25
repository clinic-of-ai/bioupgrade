import { Link } from "wouter";
import Reveal from "@/components/Reveal";

/*
 * Final CTA band — Isomorphic Labs-inspired mint field with signal-green action.
 * Centered, generous whitespace, subtle green glow behind.
 */
export default function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden border-t border-accent/20 bg-background">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]" />
      <div className="container py-32 text-center md:py-44">
        <Reveal>
          <p className="mono mb-8 text-[12px] tracking-[0.24em] text-accent">
            <span className="text-foreground/35">§10 / </span>JOIN THE CRUCIBLE
          </p>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5.5vw,3.75rem)] leading-[1.04] text-foreground">
            Stop reading about the next human.{" "}
            <span className="text-accent">Become it.</span>
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/consultation/intake"
              className="btn-primary inline-block px-8 py-4 text-[15px]"
            >
              Start your consultation brief
            </Link>
            <a
              href="#collective"
              className="btn-ghost inline-block px-8 py-4 text-[15px]"
            >
              Join the community
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
