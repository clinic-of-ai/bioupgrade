import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import ConsultingFit, {
  ConsultingWorksheet,
  resolveConsultingOffer,
} from "../client/src/components/consulting/ConsultingFit";
import { renderPublicBody } from "./public-pages";

describe("consulting offer journey", () => {
  it("uses the existing entry session for absent or unknown offer IDs", () => {
    expect(resolveConsultingOffer(null).id).toBe("research-strategy-session");
    expect(resolveConsultingOffer("unknown").id).toBe(
      "research-strategy-session"
    );
  });
  it("resolves a quote-only offer without changing its billing or flags", () => {
    const offer = resolveConsultingOffer("evidence-briefing");
    expect(offer.amountEur).toBe(850);
    expect(offer.checkoutEnabled).toBe(false);
  });
  it("renders proposed outputs and prework, not completed-work guarantees", () => {
    const markup = renderToStaticMarkup(
      createElement(Router, {
        ssrPath: "/products",
        ssrSearch: "",
        children: createElement(ConsultingFit, {
          productId: "research-strategy-session",
        }),
      })
    );
    expect(markup).toContain("Proposed written outputs");
    expect(markup).toContain("delivery capability and terms");
    expect(markup).toContain("Prework");
    expect(markup).toContain("No diagnosis");
  });
  it("protects worksheet inputs and draft with the no-record ancestor and no submission claim", () => {
    const markup = renderToStaticMarkup(
      createElement(ConsultingWorksheet, {
        productId: "research-strategy-session",
      })
    );
    expect(markup).toMatch(/<section[^>]*class="manus-no-record/);
    expect(markup).toContain("Local draft only");
    expect(markup).toContain("Copy draft");
    expect(markup).toContain("Download .txt");
    expect(markup).not.toContain("Draft copied");
    expect(markup).not.toContain("<form");
  });
  it("keeps query-selected quote detail and prices in readable initial booking HTML", () => {
    const markup = renderPublicBody("/book", "?product=evidence-briefing");
    expect(markup).toContain("Evidence Briefing");
    expect(markup).toContain("From €850");
    expect(markup).toContain("final quote");
    expect(markup).not.toContain("AI Workflow Sprint");
    expect(markup).not.toContain("<iframe");
  });
});
