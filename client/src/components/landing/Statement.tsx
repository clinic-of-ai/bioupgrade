import Reveal from "@/components/Reveal";

/* §01 — Statement: big two-tone headline with signal-green emphasis.
 * Isomorphic Labs-inspired mint canvas; asymmetric editorial layout.
 */
export default function Statement() {
  return (
    <section id="statement" className="relative bg-background">
      <div className="container py-28 md:py-36">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="mono mb-6 text-[12px] tracking-[0.22em] text-accent">
                <span className="text-foreground/35">§01 / </span>THE THESIS
                <span className="ml-3 text-foreground/30">// signal vs. hype</span>
              </p>
              <h2 className="text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.0] text-foreground/55">
                Not biohacking.
                <br />
                <span className="text-accent">Biofluency.</span>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-5 md:pt-3">
            <Reveal delay={120}>
              <p className="text-[16px] leading-relaxed text-foreground/70 md:text-[17px]">
                Anyone can buy a supplement. We do the harder thing: read the primary
                literature, separate signal from hype, and pressure-test it as a
                community before anyone bets their biology on it. The result is a
                living, current understanding of human enhancement — built from
                papers, not podcasts.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
