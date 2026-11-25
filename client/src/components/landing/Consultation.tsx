import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { ASSETS } from "@/lib/site";
import { getProduct } from "@shared/products";

export default function Consultation() {
  const session = getProduct("research-strategy-session");
  if (!session) return null;

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
                One question.
                <br />
                One paper. A clearer read.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-7 text-[16px] leading-relaxed text-foreground/70">
                For curious readers, students and science communicators who want
                to understand a published finding. Bring one educational
                question, the paper link and the passage that needs a closer
                read. Examine the entity, model, endpoint and uncertainty—not a
                personal treatment or performance plan.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Proposed written outputs: a question map, a source-linked
                evidence read and a next-reading shortlist. Scope, format,
                timing and correction terms need agreement before commitment;
                these are proposed engagement outputs, not completed-work
                claims.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-7 rounded-[12px] border border-accent/20 bg-white px-5 py-4">
                <p className="mono text-[13px] leading-relaxed text-foreground/80">
                  60 minutes
                  <span className="mx-2 text-foreground/30">·</span>
                  1:1
                  <span className="mx-2 text-foreground/30">·</span>
                  <span className="text-accent">{session.priceLabel}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Confirm fit and availability first. Payment and scheduling are
                  separate; a purchase does not reserve a calendar slot.
                </p>
              </div>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href={`/book?product=${session.id}`}
                  className="btn-primary inline-flex min-h-12 items-center px-6 py-3.5 text-[14px]"
                >
                  Prepare your paper question
                </Link>
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4"
                >
                  Compare wider project scopes
                </Link>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Research literacy only—not diagnosis, prescribing, dosing or
                personalised human-use protocols. Wider source reviews, team
                workshops and workflow evaluations require separate scope and
                quotes; no upgrade is required.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 text-sm">
                <Link
                  href="/research"
                  className="inline-flex min-h-11 items-center text-accent hover:underline"
                >
                  Research library & prework →
                </Link>
                <Link
                  href="/community#community-network"
                  className="inline-flex min-h-11 items-center text-accent hover:underline"
                >
                  Community connection status →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
