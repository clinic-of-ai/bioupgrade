import Reveal from "@/components/Reveal";

/*
 * §09 The H+ Shelf: books that shaped the movement, shown as a row of spines.
 * Notes are our own paraphrases (no quotations). Authors are not affiliated.
 */
const BOOKS = [
  {
    title: "Homo Deus",
    author: "Yuval Noah Harari",
    year: 2016,
    note: "The post-survival agenda: once famine, plague and war are managed, humans turn to upgrading themselves.",
    tone: "bg-foreground text-white",
  },
  {
    title: "The Transhumanist Reader",
    author: "Max More & Natasha Vita-More (eds.)",
    year: 2013,
    note: "The movement's founding essays, from morphological freedom to radical life extension.",
    tone: "bg-accent text-white",
  },
  {
    title: "The Singularity Is Nearer",
    author: "Ray Kurzweil",
    year: 2024,
    note: "Exponential AI meets biology, and what that does to the limits of a human life.",
    tone: "bg-[#dff0e2] text-foreground",
  },
  {
    title: "Regenesis",
    author: "George Church & Ed Regis",
    year: 2012,
    note: "Synthetic biology as a toolkit for rebuilding nature, and eventually ourselves.",
    tone: "bg-white text-foreground",
  },
  {
    title: "A Crack in Creation",
    author: "Jennifer Doudna & Samuel Sternberg",
    year: 2017,
    note: "CRISPR from the bench where it was born: the power to edit the code of life, and the duty that comes with it.",
    tone: "bg-foreground text-white",
  },
  {
    title: "Lifespan",
    author: "David Sinclair",
    year: 2019,
    note: "Ageing treated as a biological process you can study, measure and push back on.",
    tone: "bg-[#9ee8ad] text-foreground",
  },
  {
    title: "Outlive",
    author: "Peter Attia",
    year: 2023,
    note: "Healthspan as a long-term training plan across metabolism, muscle, sleep and the brain.",
    tone: "bg-white text-foreground",
  },
  {
    title: "Superintelligence",
    author: "Nick Bostrom",
    year: 2014,
    note: "Our counterweight: ambition about intelligence demands equal rigor about risk.",
    tone: "bg-accent text-white",
  },
] as const;

export default function Shelf() {
  return (
    <section id="shelf" className="border-t border-accent/20 bg-background">
      <div className="container py-24 md:py-32">
        <Reveal>
          <p className="mono text-[12px] tracking-[0.24em] text-accent">
            <span className="text-foreground/35">§09 / </span>THE H+ SHELF
          </p>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
            <h2 className="text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] text-foreground">
              From sapiens
              <br />
              <span className="text-accent">to what comes next.</span>
            </h2>
            <p className="max-w-xl text-[16px] leading-relaxed text-foreground/65">
              Harari argues that, with famine, plague and war largely brought
              under control, humanity&apos;s next project is upgrading itself:
              the brain, the body and the lifespan. Maybe you came in through
              nootropic stacks, looksmaxxing threads, longevity protocols or
              late-night chemistry forums. These are the books that shaped how
              we think about the step after sapiens.
            </p>
          </div>
        </Reveal>
        <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOOKS.map((b, i) => (
            <li key={b.title}>
              <Reveal>
                <article className="group flex h-full overflow-hidden rounded-[16px] border border-accent/25 bg-white/70 transition hover:-translate-y-1 hover:border-accent/60">
                  <div
                    className={`flex w-14 shrink-0 items-center justify-center ${b.tone}`}
                    aria-hidden="true"
                  >
                    <span
                      className="mono whitespace-nowrap text-[11px] tracking-[0.2em]"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    >
                      H+{String(i + 1).padStart(2, "0")} · {b.year}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-[19px] leading-tight text-foreground">
                      {b.title}
                    </h3>
                    <p className="mono mt-1 text-[11px] tracking-[0.08em] text-foreground/50">
                      {b.author}
                    </p>
                    <p className="mt-3 text-[14px] leading-relaxed text-foreground/70">
                      {b.note}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
        <p className="mono mt-6 text-[11px] tracking-[0.06em] text-foreground/40">
          Recommended reading. Notes are our own summaries; authors are not
          affiliated with Bioupgrade.
        </p>
      </div>
    </section>
  );
}
