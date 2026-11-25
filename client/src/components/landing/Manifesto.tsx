import Reveal from "@/components/Reveal";
import { ASSETS } from "@/lib/site";

/* §05 — Manifesto moment — oversized editorial line over the biopunk collage (pale left, collage right).
 * The light mint wash and forest type keep it legible while preserving cinematic depth.
 */
const TENETS = [
  {
    title: "Better than well.",
    body: "Medicine repairs what is broken. We study how far a healthy mind and body can be extended.",
  },
  {
    title: "Challenge over comfort.",
    body: "Baseline is where you start. There is always a sharper, stronger version of you to build toward.",
  },
  {
    title: "Rigor over dogma.",
    body: "Read everything, then read the methods. Learn from error fast, and change your mind when the data does.",
  },
  {
    title: "Chemical curiosity.",
    body: "Molecules, protocols and tools: we are makers and discoverers who build what does not exist yet.",
  },
  {
    title: "Every tool of the shift.",
    body: "AI, molecular design, genomics and whatever arrives next, aimed squarely at developing the human itself.",
  },
  {
    title: "An open crucible.",
    body: "Share what works, publish what fails, and lift everyone around you.",
  },
] as const;

export default function Manifesto() {
  return (
    <section className="relative isolate overflow-hidden border-t border-accent/20 grain">
      <img
        src={ASSETS.manifestoBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-right"
        loading="lazy"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#eff8f0]/92 to-[#eff8f0]/92 md:bg-gradient-to-r md:from-[#eff8f0] md:via-[#eff8f0]/90 md:via-55% md:to-transparent md:to-[88%]" />

      <div className="container py-36 md:py-48">
        <Reveal>
          <p className="mono mb-8 text-[12px] tracking-[0.24em] text-accent">
            <span className="text-foreground/35">§09 / </span>THE MANIFESTO
          </p>
          <p className="max-w-4xl text-[clamp(2rem,6vw,4.5rem)] md:max-w-[52%] leading-[1.05] text-foreground">
            Evolution is slow.{" "}
            <span className="text-foreground/60">
              We would rather build.
            </span>
          </p>
          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-foreground/75 md:max-w-[44%] md:text-[19px]">
            So we build what comes next: new molecules, new products, new
            protocols and a community of active participants in our own
            evolution, chasing the next step for the human body and mind.
          </p>
          <ol className="mt-12 max-w-xl space-y-5 border-l border-accent/40 pl-6 md:max-w-[46%]">
            {TENETS.map((tenet, index) => (
              <li key={tenet.title} className="text-[15px] leading-relaxed text-foreground/75">
                <span className="mono mr-3 text-[12px] tracking-[0.18em] text-accent">
                  H+{String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground">{tenet.title}</span>{" "}
                {tenet.body}
              </li>
            ))}
          </ol>
          <figure className="mt-12 max-w-xl md:max-w-[46%]">
            <blockquote className="text-[17px] italic leading-relaxed text-foreground/80">
              “Humanity looks to me like a magnificent beginning but not the
              final word.”
            </blockquote>
            <figcaption className="mono mt-3 text-[11px] tracking-[0.18em] text-foreground/50">
              FREEMAN DYSON · PHYSICIST
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
