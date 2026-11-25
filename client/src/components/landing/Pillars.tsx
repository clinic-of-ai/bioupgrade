import { Link } from "wouter";
import Reveal from "@/components/Reveal";

const PILLARS = [
  {
    index: "01",
    title: "The Meta",
    img: "/images/pillar-meta.webp",
    alt: "Risograph collage of an annotated molecule over acetate overlays, a DNA helix and pathway maps, marking what a mechanism explains and what stays uncertain.",
    href: "/meta",
    body: "The constant new meta, decoded. What is moving in cognitive, physical, aesthetic and sexual performance and longevity: the mechanism, the study design and what is still unproven, so you see the next step before it goes mainstream.",
  },
  {
    index: "02",
    title: "The Paper Library",
    img: "/images/pillar-library.webp",
    alt: "A clipped and tabbed stack of research papers in an underground archive, with a DNA helix and molecular chains rising from its pages.",
    href: "/research",
    body: "Our credibility, in full view. Primary papers from Nature and Cell to the latest preprints, each with study type, findings and limits. Every molecule and protocol we build starts here, negative results included.",
  },
  {
    index: "03",
    title: "The Community",
    img: "/images/pillar-community.webp",
    alt: "Underground academic punks in a basement lab-salon sketching DNA and chemical structures on a chalkboard around a shared worktable.",
    href: "/community",
    body: "The H+ crucible: tens of thousands of chemonauts, bio-engineers, athletes and researchers across TikTok and Discord who dive deep into the science and share what they extract. Debate the papers, compare notes, push each other further.",
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
              READ / BUILD / CONNECT
            </span>
          </div>
          <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.02]">
            Ahead of the paradigm.
            <br />
            Built from the source.
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
