import { useEffect, useRef, useState } from "react";

/**
 * Counts a stat like "35k+" or "10k" up from zero when it scrolls into view.
 * SSR and reduced-motion users get the final value immediately.
 */
export default function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? Number(match[1]) : NaN;
  const suffix = match ? match[2] : "";
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || Number.isNaN(target)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(`${Math.round(target * eased)}${suffix}`);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        setShown(`0${suffix}`);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, suffix, duration]);

  return (
    <span ref={ref} className="tabular-nums" aria-label={value}>
      {shown}
    </span>
  );
}
