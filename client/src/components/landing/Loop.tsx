import { Bot, Atom, Users, Repeat } from "lucide-react";
import { Link } from "wouter";
import Reveal from "@/components/Reveal";

/*
 * §08 The Loop: how technology and the community compound each other.
 * Animated: the connector line fills and each node lights in sequence on reveal.
 * Wording keeps experimentation in silico / in the lab / in open discussion.
 */
const STEPS = [
  {
    icon: Users,
    label: "Signal",
    body: "Thousands of members surface the questions, papers and field notes that matter, often before they reach the mainstream.",
  },
  {
    icon: Bot,
    label: "Synthesis",
    body: "AI pipelines read, rank and cross-check the new literature every day, so the team starts from the whole evidence base rather than a headline.",
  },
  {
    icon: Atom,
    label: "Build",
    body: "Molecular modelling, protocol design and lab work turn the strongest signals into programmes and products you can actually use in research.",
  },
  {
    icon: Repeat,
    label: "Feedback",
    body: "Results, documentation and critique go straight back to the community, which sharpens the next question. Then the loop runs again.",
  },
] as const;

export default function Loop() {
  return (
    <section id="loop" className="relative overflow-hidden border-t border-accent/20 bg-foreground text-white">
      <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-accent/25 blur-[140px]" />
      <div className="container relative py-24 md:py-32">
        <Reveal>
          <p className="mono text-[12px] tracking-[0.24em] text-[#9ee8ad]">
            <span className="text-white/40">§08 / </span>THE LOOP
          </p>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
            <h2 className="text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] text-white">
              Technology times community.
              <br />
              <span className="text-[#9ee8ad]">A faster loop.</span>
            </h2>
            <p className="max-w-xl text-[16px] leading-relaxed text-white/70">
              Traditional research moves in grant cycles. We run a tighter loop.
              AI and molecular design give a small team the reach of a large
              lab, and a community of thousands of sharp, sceptical minds tells
              us quickly which ideas hold up. Every turn of the loop makes
              the next consultation, the next protocol and the next product
              better.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <ol className="loop-track relative mt-16 grid gap-6 md:grid-cols-4 md:gap-5">
            <span aria-hidden="true" className="loop-line pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-white/15 md:block">
              <span className="loop-line-fill block h-full bg-[#9ee8ad]" />
            </span>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.label} className="relative" style={{ ["--i" as string]: i }}>
                  <span className="loop-node relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-foreground">
                    <Icon className="h-5 w-5 text-[#9ee8ad]" />
                  </span>
                  <p className="mono mt-5 text-[11px] tracking-[0.22em] text-white/45">
                    0{i + 1}
                  </p>
                  <h3 className="mt-1 text-[22px] text-white">{s.label}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/65">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-14 flex flex-wrap gap-3">
            <Link href="/community" className="inline-flex items-center rounded-full bg-[#9ee8ad] px-6 py-3 font-mono text-[13px] font-semibold text-foreground transition hover:bg-white">
              Join the loop
            </Link>
            <Link href="/book" className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 font-mono text-[13px] text-white transition hover:bg-white/10">
              Bring your question to a consultation
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
