import { ArrowUpRight, FlaskConical, MessagesSquare } from "lucide-react";
import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { INTAKE_SERVICES } from "@shared/consultation-intake";

/*
 * Two ways in: the sales band placed directly under the hero so consultations
 * and lab products are never more than one scroll away. Same card language as
 * Products / ShopSection (white cards, forest type, signal-green CTA).
 */
const fromPrice = INTAKE_SERVICES[0]?.priceLabel ?? "";

export default function TwoPaths() {
  return (
    <section id="start" className="relative bg-background">
      <div className="container py-14 md:py-16">
        <Reveal>
          <p className="mono text-[12px] tracking-[0.24em] text-accent">
            <span className="text-foreground/35">START HERE / </span>TWO WAYS IN
          </p>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Reveal>
            <Link
              href="/book"
              className="group flex h-full flex-col justify-between rounded-[22px] border border-accent/20 bg-white/70 p-7 shadow-[var(--shadow-soft)] transition hover:border-accent/50 md:p-9"
            >
              <div>
                <div className="flex items-center justify-between">
                  <MessagesSquare className="h-6 w-6 text-accent" />
                  <span className="mono text-[11px] tracking-[0.2em] text-foreground/45">
                    {INTAKE_SERVICES.length} FORMATS · FROM {fromPrice}
                  </span>
                </div>
                <h3 className="mt-6 text-[clamp(1.6rem,3vw,2.2rem)] text-foreground">
                  Consult the team
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-foreground/65">
                  A 1:1 session with researchers who live at the frontier. Bring
                  your goal; leave with a literature-backed research strategy
                  built around you.
                </p>
              </div>
              <span className="btn-primary mt-8 inline-flex w-fit items-center gap-2 px-5 py-3 text-[13px]">
                Book a consultation <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>
          <Reveal>
            <Link
              href="/shop"
              className="group flex h-full flex-col justify-between rounded-[22px] border border-accent/20 bg-foreground p-7 text-background transition hover:border-accent md:p-9"
            >
              <div>
                <div className="flex items-center justify-between">
                  <FlaskConical className="h-6 w-6 text-[#9ee8ad]" />
                  <span className="mono text-[11px] tracking-[0.2em] text-white/55">
                    RESEARCH USE ONLY
                  </span>
                </div>
                <h3 className="mt-6 text-[clamp(1.6rem,3vw,2.2rem)] text-white">
                  Shop the lab
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
                  Physical research compounds, selected and documented by the
                  team. The tangible output of our work, sold strictly for
                  laboratory research.
                </p>
              </div>
              <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-5 py-3 font-mono text-[13px] text-white transition group-hover:bg-white group-hover:text-foreground">
                Browse products <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
