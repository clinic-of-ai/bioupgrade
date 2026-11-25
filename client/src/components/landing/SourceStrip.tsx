import type { CSSProperties, ReactNode } from "react";
import { SOURCES, SOURCE_PLACEHOLDERS } from "@/lib/site";

/*
 * Source strip: a two-row "live reading feed" marquee of journal wordmarks.
 * Wordmarks are typographic renderings (no third-party logo files), so the strip
 * reads as "what we read", never as an endorsement. Row two holds placeholder
 * names from cell biology / genomics until real partners are confirmed.
 * Motion pauses on hover and stops under prefers-reduced-motion.
 */
type Mark = { style: CSSProperties; content?: ReactNode };

const serif = "'Times New Roman', Georgia, serif";
const grotesk = "Helvetica, Arial, sans-serif";

const MARKS: Record<string, Mark> = {
  Nature: {
    style: { fontFamily: serif, fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" },
    content: "nature",
  },
  Cell: {
    style: { fontFamily: grotesk, fontWeight: 800, fontSize: 30, letterSpacing: "-0.04em" },
  },
  bioRxiv: {
    style: { fontFamily: serif, fontWeight: 700, fontSize: 28 },
    content: (
      <>
        bio<span className="text-accent">R</span>
        <span className="italic text-accent">x</span>iv
      </>
    ),
  },
  Science: {
    style: { fontFamily: serif, fontWeight: 700, fontSize: 30, fontStyle: "italic" },
  },
  PNAS: {
    style: { fontFamily: grotesk, fontWeight: 900, fontSize: 27, letterSpacing: "0.06em" },
  },
  arXiv: {
    style: { fontFamily: serif, fontSize: 29 },
    content: (
      <>
        ar<span className="font-bold text-accent">X</span>iv
      </>
    ),
  },
};

const fallback: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 21,
  letterSpacing: "-0.01em",
};

function Wordmark({ label }: { label: string }) {
  const m = MARKS[label];
  return (
    <span
      className="whitespace-nowrap leading-none text-foreground/80"
      style={m?.style ?? fallback}
    >
      {m?.content ?? label}
    </span>
  );
}

function Row({
  items,
  reverse,
  muted,
}: {
  items: readonly string[];
  reverse?: boolean;
  muted?: boolean;
}) {
  const loop = [...items, ...items];
  return (
    <div className="marquee-mask relative overflow-hidden">
      <div
        className={`marquee-track flex w-max items-center ${reverse ? "marquee-reverse" : ""} ${muted ? "opacity-55" : ""}`}
      >
        {loop.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="flex items-center"
            aria-hidden={i >= items.length ? true : undefined}
          >
            <span className="px-7 md:px-10">
              <Wordmark label={s} />
            </span>
            <span className="h-1.5 w-1.5 rotate-45 bg-accent/40" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SourceStrip() {
  return (
    <section
      className="border-y border-accent/20 bg-secondary/45"
      id="meta"
      aria-label="Journals and preprint servers we follow"
    >
      <div className="container pt-9 pb-2">
        <div className="flex flex-col items-center gap-1 text-center md:flex-row md:justify-between md:text-left">
          <p className="mono text-[11px] tracking-[0.24em] text-accent">
            <span className="text-foreground/35">LIVE FEED / </span>SOURCES WE READ
          </p>
          <p className="mono text-[11px] tracking-[0.06em] text-foreground/45">
            The frontier is published daily. We read it so it doesn&apos;t pass you by.
          </p>
        </div>
      </div>
      <div className="space-y-5 pb-9 pt-5">
        <Row items={SOURCES} />
        <Row items={SOURCE_PLACEHOLDERS} reverse muted />
      </div>
      <p className="sr-only">
        We follow {SOURCES.join(", ")} and {SOURCE_PLACEHOLDERS.join(", ")}.
        Names are shown for reference only and do not imply affiliation or
        endorsement.
      </p>
    </section>
  );
}
