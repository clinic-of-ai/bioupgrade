import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { ASSETS } from "@/lib/site";

const PILLARS = [
  {
    index: "01",
    title: "The Meta",
    img: ASSETS.pillarTexture,
    href: "/meta",
    body: "A source-linked editorial on precision molecular development: what a mechanism explains, what a study measured and what remains uncertain. This edition—not a promise of automated weekly drops.",
  },
  {
    index: "02",
    title: "The Paper Library",
    img: ASSETS.pillarLab2,
    href: "/research",
    body: "Primary papers, study types, findings and limits. Follow a molecular question into its methods, distinguish component evidence from blend claims and keep negative results in the picture.",
  },
  {
    index: "03",
    title: "The Community",
    img: ASSETS.pillarCircle,
    href: "/community",
    body: "A research-literacy concept for curious readers and rigorous builders. Explore the standards, educational consultations and your Signal account; no invented live forum or member numbers.",
  },
] as const;
export default function Pillars() {
  return (
    <section id="pillars" className="bg-background">
      <div className="container pb-28 md:pb-36">
        <Reveal>
          <div className="flex items-baseline justify-between gap-4">
            <p className="mono text-xs tracking-[0.22em] text-accent">
              <span className="text-foreground/35">§02 / </span>THE ACADEMIC
              LAYER
            </p>
            <span className="mono text-[11px] tracking-[0.2em] text-foreground/35">
              READ / QUESTION / CONNECT
            </span>
          </div>
          <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.02]">
            Ahead of the paradigm.
            <br />
            Grounded in the methods.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 70}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-accent/30 bg-white transition-colors hover:border-accent/60">
                <Link
                  href={p.href}
                  className="relative block aspect-[4/3] overflow-hidden"
                >
                  <img
                    src={p.img}
                    alt="Illustrative future-facing Bioupgrade editorial imagery."
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="mono absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs text-accent">
                    {p.index}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-[22px]">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                    {p.body}
                  </p>
                  <Link
                    href={p.href}
                    className="mt-5 inline-flex min-h-11 items-center text-sm text-accent hover:text-foreground"
                  >
                    Explore {p.title.replace("The ", "").toLowerCase()} →
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
