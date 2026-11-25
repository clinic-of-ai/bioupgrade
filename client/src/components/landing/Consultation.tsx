import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { ASSETS } from "@/lib/site";
import { INTAKE_SERVICES } from "@shared/consultation-intake";

export default function Consultation() {

  return (
    <section
      id="consultation"
      className="border-t border-accent/20 bg-background"
    >
      <div className="container py-28 md:py-36">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[16px] border border-accent/30"
              style={{ boxShadow: "0 16px 36px 0 rgba(63,153,95,0.14)" }}
            >
              <img
                src={ASSETS.consultation}
                alt="An academic and a younger researcher reviewing a highlighted paper beside a molecular model."
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-accent/10" />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="mono text-[12px] tracking-[0.22em] text-accent">
                <span className="text-foreground/35">§03 / </span>THE
                CONSULTATION
                <span className="ml-3 text-foreground/30">// 1:1</span>
              </p>
              <h2 className="mt-4 text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] text-foreground">
                Your ceiling,
                <br />
                mapped from the evidence.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-7 text-[16px] leading-relaxed text-foreground/70">
                One-to-one sessions with a team that came up through
                biotechnology, biochemistry, neurology and pharmacology. Bring
                your goal, whether strength, focus, body composition, recovery,
                vitality or longevity, and we map it against the newest research,
                our own protocol work and what is still uncertain. You leave
                with a clear, source-linked strategy built for you.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Every booking starts with a short brief tailored to your
                profile, from athletes and knowledge workers to practitioners
                and advanced self-experimenters, so the session starts at depth.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-7 grid grid-cols-2 gap-2 rounded-[12px] border border-accent/20 bg-white p-3 sm:grid-cols-4">
                {INTAKE_SERVICES.map(service => (
                  <Link
                    key={service.id}
                    href={`/consultation/intake?service=${service.id}`}
                    className="rounded-[8px] px-3 py-2 transition-colors hover:bg-secondary/60"
                  >
                    <p className="text-[13px] leading-snug text-foreground">
                      {service.title}
                    </p>
                    <p className="mono mt-1 text-[12px] text-foreground/60">
                      {service.minutes} min
                      <span className="mx-1.5 text-foreground/30">·</span>
                      <span className="text-accent">{service.priceLabel}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/consultation/intake"
                  className="btn-primary inline-flex min-h-12 items-center px-6 py-3.5 text-[14px]"
                >
                  Start your brief
                </Link>
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4"
                >
                  Compare the four protocols
                </Link>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Sessions are educational and research-focused. They are not
                medical diagnosis or treatment.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
