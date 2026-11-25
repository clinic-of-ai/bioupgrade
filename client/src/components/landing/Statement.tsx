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
                <span className="ml-3 text-foreground/30">// baseline is a choice</span>
              </p>
              <h2 className="text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.0] text-foreground/55">
                Most never test their ceiling.
                <br />
                <span className="text-accent">We build past it.</span>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-5 md:pt-3">
            <Reveal delay={120}>
              <p className="text-[16px] leading-relaxed text-foreground/70 md:text-[17px]">
                Most people never give themselves the chance to be the best they
                can be. We do the opposite. We read the primary literature as it
                lands, decode the constantly shifting meta with AI-assisted
                research, and turn it into molecules, protocols and decisions,
                then pressure-test all of it with a community that lives inside
                the science. This is H+: the paradigm shift is here, and we
                intend to use every tool it brings to develop the human itself.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
