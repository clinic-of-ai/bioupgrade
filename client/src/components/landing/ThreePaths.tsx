import { ArrowUpRight, BookOpenText, FlaskConical, Video } from "lucide-react";
import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { INTAKE_SERVICES } from "@shared/consultation-intake";

/*
 * Three ways in, directly under the hero: CONSULTATIONS (sell video-call
 * programmes), RESEARCH (the academic layer) and LAB (sell physical products).
 * Each card has one unmistakable verb CTA. Prices come from the data layer.
 */
const fromPrice = INTAKE_SERVICES[0]?.priceLabel ?? "";
const minutes = Array.from(new Set(INTAKE_SERVICES.map(s => s.minutes))).join("–");

const PATHS = [
  {
    key: "CONSULTATIONS",
    index: "01",
    icon: Video,
    title: "1:1 video consultations",
    body: `Private ${minutes}-minute video calls, from a focused strategy session to a full concierge programme. You bring the goal; we build the plan around the latest evidence.`,
    meta: `${INTAKE_SERVICES.length} PROGRAMMES · FROM ${fromPrice}`,
    cta: "Book a video call",
    href: "/book",
    secondary: { label: "Compare programmes", href: "/products" },
    dark: false,
  },
  {
    key: "RESEARCH",
    index: "02",
    icon: BookOpenText,
    title: "Academic rigor, open to all",
    body: "Primary papers, study design and limitations, decoded. The evidence layer behind every consultation and every product we list.",
    meta: "FREE · UPDATED CONTINUOUSLY",
    cta: "Read the research",
    href: "/research",
    secondary: { label: "Decode the meta", href: "/meta" },
    dark: false,
  },
  {
    key: "LAB",
    index: "03",
    icon: FlaskConical,
    title: "Products from the lab",
    body: "Physical research compounds developed and selected by the team, with documentation on each listing. Sold strictly for laboratory research.",
    meta: "RESEARCH USE ONLY",
    cta: "Shop the lab",
    href: "/shop",
    secondary: { label: "How we document", href: "/documentation" },
    dark: true,
  },
] as const;

export default function ThreePaths() {
  return (
    <section id="start" className="relative bg-background">
      <div className="container py-14 md:py-20">
        <Reveal>
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <p className="mono text-[12px] tracking-[0.24em] text-accent">
              <span className="text-foreground/35">START HERE / </span>THREE WAYS IN
            </p>
            <p className="mono text-[11px] tracking-[0.12em] text-foreground/45">
              CONSULT · LEARN · BUILD
            </p>
          </div>
        </Reveal>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PATHS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.key} delay={i * 110} className="h-full">
                <article
                  className={`path-card group relative flex h-full flex-col overflow-hidden rounded-[22px] border p-7 md:p-8 ${
                    p.dark
                      ? "border-foreground bg-foreground text-white"
                      : "border-accent/25 bg-white/75 text-foreground shadow-[var(--shadow-soft)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`mono text-[13px] font-semibold tracking-[0.28em] ${p.dark ? "text-[#9ee8ad]" : "text-accent"}`}
                    >
                      {p.index} / {p.key}
                    </span>
                    <Icon
                      className={`path-icon h-6 w-6 ${p.dark ? "text-[#9ee8ad]" : "text-accent"}`}
                    />
                  </div>
                  <h3 className={`mt-6 text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.05] ${p.dark ? "text-white" : ""}`}>
                    {p.title}
                  </h3>
                  <p className={`mt-3 text-[15px] leading-relaxed ${p.dark ? "text-white/70" : "text-foreground/65"}`}>
                    {p.body}
                  </p>
                  <p className={`mono mt-5 text-[11px] tracking-[0.18em] ${p.dark ? "text-white/50" : "text-foreground/45"}`}>
                    {p.meta}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-7">
                    <Link
                      href={p.href}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-mono text-[13px] font-semibold transition ${
                        p.dark
                          ? "bg-[#9ee8ad] text-foreground hover:bg-white"
                          : "btn-primary"
                      }`}
                    >
                      {p.cta}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                    <Link
                      href={p.secondary.href}
                      className={`text-[13px] underline-offset-4 hover:underline ${p.dark ? "text-white/70" : "text-foreground/60"}`}
                    >
                      {p.secondary.label}
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
