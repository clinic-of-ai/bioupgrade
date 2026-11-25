import Reveal from "@/components/Reveal";
import { ASSETS } from "@/lib/site";

/* §05 — Manifesto moment — oversized editorial line over the biopunk collage (pale left, collage right).
 * The light mint wash and forest type keep it legible while preserving cinematic depth.
 */
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
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#eff8f0]/85 to-[#eff8f0]/85 md:bg-gradient-to-r md:from-[#eff8f0]/95 md:via-[#eff8f0]/85 md:via-50% md:to-transparent md:to-90%" />

      <div className="container py-36 md:py-48">
        <Reveal>
          <p className="mono mb-8 text-[12px] tracking-[0.24em] text-accent">
            <span className="text-foreground/35">§05 / </span>THE MANIFESTO
          </p>
          <p className="max-w-4xl text-[clamp(2rem,6vw,4.5rem)] md:max-w-[52%] leading-[1.05] text-foreground">
            The papers are the cheat codes.{" "}
            <span className="text-foreground/45">
              Most people just never read them.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
