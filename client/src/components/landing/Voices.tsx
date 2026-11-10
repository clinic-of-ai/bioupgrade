import Reveal from "@/components/Reveal";

const STANDARDS = [
  {
    index: "S—01",
    title: "Methods before headlines.",
    body: "A preprint, a small trial and a replicated result do not carry the same weight. We keep the limitations beside the finding.",
    detail: "EVIDENCE STANDARD",
  },
  {
    index: "S—02",
    title: "A reference is not an approval.",
    body: "Supplier labels, membership tiers and a research-only disclaimer cannot establish identity, quality or permission to sell a product.",
    detail: "COMMERCE STANDARD",
  },
] as const;
export default function Voices() {
  return (
    <section className="border-t border-accent/20 bg-background">
      <div className="container py-28 md:py-36">
        <Reveal>
          <p className="mono text-xs tracking-[0.22em] text-accent">
            <span className="text-muted-foreground">§04 / </span>OUR OPERATING
            STANDARD
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {STANDARDS.map((item, index) => (
            <Reveal key={item.index} delay={index * 90}>
              <article className="flex h-full flex-col justify-between rounded-2xl border border-accent/30 bg-white p-8 md:p-10">
                <p className="mono text-xs tracking-[0.2em] text-accent">
                  {item.index}
                </p>
                <h3 className="mt-6 text-[clamp(1.5rem,2.4vw,2rem)] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <p className="mono mt-8 text-xs tracking-[0.14em] text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
