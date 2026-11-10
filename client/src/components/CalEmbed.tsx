import { useEffect, useRef } from "react";
import { CAL_LINK } from "@/lib/site";

/*
 * Cal.com inline embed — light mint surface with signal-green brand color.
 * The embed handles slot selection AND Stripe payment in one flow.
 * `calLink` defaults to the placeholder the owner swaps in.
 *
 * No Stripe secret keys, no payment backend, no API keys live here — the only
 * thing the site holds is the public Cal.com embed link.
 */
declare global {
  interface Window {
    Cal?: any;
  }
}

const PLACEHOLDER = "CAL_LINK_PLACEHOLDER";

export default function CalEmbed({ calLink = CAL_LINK }: { calLink?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPlaceholder = !calLink || calLink === PLACEHOLDER;

  useEffect(() => {
    if (isPlaceholder) return;

    // Official Cal.com embed loader snippet (inlined; no external build deps).
    (function (C: any, A: string, L: string) {
      const p = function (a: any, ar: any) {
        a.q.push(ar);
      };
      const d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          const cal = C.Cal;
          const ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else {
              p(cal, ar);
            }
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    const Cal = window.Cal;
    Cal("init", "session", { origin: "https://app.cal.com" });
    Cal.ns.session("inline", {
      elementOrSelector: containerRef.current,
      calLink,
      layout: "month_view",
      config: { theme: "light" },
    });
    Cal.ns.session("ui", {
      theme: "light",
      cssVarsPerTheme: {
        light: {
          "cal-brand": "#3f995f",
          "cal-bg": "#ffffff",
          "cal-bg-emphasis": "#eff8f0",
          "cal-border": "#cfe4d3",
        },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, [calLink, isPlaceholder]);

  if (isPlaceholder) {
    return (
      <div
        className="relative isolate flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-[16px] border border-accent/30 bg-white p-10 text-center"
        data-cal-link={PLACEHOLDER}
        style={{ boxShadow: "0 16px 36px 0 rgba(63,153,95,0.12)" }}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-[90px]" />
        <span className="mono mb-4 text-[11px] tracking-[0.24em] text-accent">
          BOOKING NOT OPEN YET
        </span>
        <p className="max-w-sm text-[15px] leading-relaxed text-foreground/70">
          The owner has not connected a live calendar. No slot, payment or
          reservation can be confirmed here.
        </p>
        <p className="mono mt-6 text-[12px] leading-relaxed text-muted-foreground">
          Availability and booking terms will be shown before confirmation.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-cal-link={calLink}
      className="min-h-[560px] w-full overflow-hidden rounded-[16px] border border-accent/30 bg-white"
      style={{ boxShadow: "0 16px 36px 0 rgba(63,153,95,0.12)" }}
    />
  );
}
