import { Link } from "wouter";
import Reveal from "@/components/Reveal";

const PILLARS = [
  {
    index: "01",
    title: "The Meta",
    cta: "Decode the meta",
    img: "/images/pillar-meta.webp",
    alt: "Risograph collage of an annotated molecule over acetate overlays, a DNA helix and pathway maps, marking what a mechanism explains and what stays uncertain.",
    href: "/meta",
    body: "The constant new meta, decoded. What is moving in cognition, physique, aesthetics, vitality and longevity: the mechanism, the evidence and what is still unproven, so you see the next step before it goes mainstream.",
  },
  {
    index: "02",
    title: "Academic Rigor",
    cta: "Inspect the evidence",
    img: "/images/pillar-library.webp",
    alt: "A clipped and tabbed stack of research papers in an underground archive, with a DNA helix and molecular chains rising from its pages.",
    href: "/research",
    body: "Technological ruthlessness, applied to the evidence. Every claim traced to its source, every study weighed by its design, negative results included. It is the foundation everything else stands on.",
  },
  {
    index: "03",
    title: "The Lab",
    cta: "Explore the lab",
    img: "/images/pillar-lab.webp",
    alt: "Risograph illustration of gloved hands raising an amber vial over a basement lab bench with a vial rack, a glowing flask, sketched molecules and an AI protein model on a laptop.",
    href: "/shop",
    body: "Chemical curiosity, made physical. We develop and select our own research products from our ongoing work, and document what goes into each one.",
  },
] as const;
export default function Pillars() {
  return (
    <section id="pillars" className="bg-background">
      <div className="container pb-28 md:pb-36">
        <Reveal>
          <div className="flex items-baseline justify-between gap-4">
            <p className="mono text-xs tracking-[0.22em] text-accent">
              <span className="text-foreground/35">§02 / </span>THE SYSTEM
            </p>
            <span className="mono text-[11px] tracking-[0.2em] text-foreground/35">
              META / RIGOR / LAB
            </span>
          </div>
          <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.02]">
            Decode. Verify.
            <br />
            Build.
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
                    alt={p.alt}
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
                    className="mt-auto pt-5 inline-flex min-h-11 items-center text-sm text-accent hover:text-foreground"
                  >
                    {p.cta} →
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
