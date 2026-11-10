import Reveal from "@/components/Reveal";
import { SOURCES } from "@/lib/site";

/*
 * Source strip — quiet credibility row (NOT a logo wall): the journals we read.
 * Isomorphic Labs-inspired mint field, forest type, and restrained green separators.
 */
export default function SourceStrip() {
  return (
    <section className="border-y border-accent/20 bg-secondary/45" id="meta">
      <div className="container py-10">
        <Reveal>
          <p className="mono text-center text-[12px] leading-relaxed tracking-[0.06em] text-muted-foreground md:text-[13px]">
            <span className="text-foreground/55">
              We read it so the frontier doesn&apos;t pass you by
            </span>
            <span className="mx-2 text-accent">—</span>
            {SOURCES.map((s, i) => (
              <span key={s}>
                <span className="text-foreground/85">{s}</span>
                {i < SOURCES.length - 1 && (
                  <span className="mx-2 text-foreground/25">·</span>
                )}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
