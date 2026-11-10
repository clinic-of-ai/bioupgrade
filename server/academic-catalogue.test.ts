import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  OWNER_CATALOGUE_PRODUCTS,
  OWNER_CATALOGUE_ROWS,
  MARKETPLACE_PRODUCTS,
  isMarketplacePurchasable,
} from "../shared/marketplace";
import {
  RESEARCH_BRIEFS,
  getResearchPapers,
  getResearchBrief,
} from "../shared/research";
import { PRODUCT_IMAGES, getProductImage } from "../shared/product-images";
import {
  configuredPublicOrigin,
  escapeHtml,
  getPublicPageMetadata,
  renderPublicBody,
  renderPublicDocument,
  publicRobots,
  publicSitemap,
} from "./public-pages";

const template =
  '<!doctype html><html><head><title>Original</title><meta name="description" content="Original"/><meta property="og:title" content="Original"/></head><body><div id="root"></div><script type="module" src="/assets/main.js"></script></body></html>';
afterEach(() => vi.unstubAllEnvs());

describe("Current owner catalogue and scientific attribution", () => {
  it("preserves all27 exact owner-list prices and separates older conflicting attachment records", () => {
    expect(OWNER_CATALOGUE_PRODUCTS).toHaveLength(27);
    expect(OWNER_CATALOGUE_ROWS.map(row => row[1])).toEqual([
      75, 150, 115, 145, 90, 145, 180, 170, 100, 80, 120, 110, 90, 120, 120,
      160, 90, 80, 80, 80, 70, 90, 100, 80, 75, 70, 60,
    ]);
    expect(OWNER_CATALOGUE_PRODUCTS[1].title).toBe(
      "Tirzepatida 25mg (5x5mg) ZPHC"
    );
    expect(OWNER_CATALOGUE_PRODUCTS[6].title).toBe("Pen Tirzepatida 30mg ZPHC");
    expect(
      MARKETPLACE_PRODUCTS.find(p => p.id === "image-tirzepatide-30")?.amountEur
    ).toBe(100);
    expect(
      MARKETPLACE_PRODUCTS.find(p => p.id === "tirzepatida-30mg")?.amountEur
    ).toBe(115);
    expect(
      OWNER_CATALOGUE_PRODUCTS.every(
        p =>
          p.quantityLabel &&
          p.manufacturerLabel &&
          p.formLabel &&
          p.documentationStatus
      )
    ).toBe(true);
  });
  it("links all27 variants to16 research families without turning literature or status into purchase permission", () => {
    expect(RESEARCH_BRIEFS).toHaveLength(16);
    expect(new Set(OWNER_CATALOGUE_PRODUCTS.map(p => p.familyId)).size).toBe(
      16
    );
    for (const product of OWNER_CATALOGUE_PRODUCTS) {
      expect(getResearchBrief(product.familyId)).toBeDefined();
      expect(product.points).toBe(0);
      expect(product.commerceApproved).toBe(false);
      expect(
        isMarketplacePurchasable({
          ...product,
          status: "available",
          commerceApproved: true,
        })
      ).toBe(false);
    }
  });
  it("keeps undefined blend and fragment identities free of presumed ingredient papers", () => {
    for (const family of ["klow", "glow", "hgh-fragment"]) {
      const brief = getResearchBrief(family)!;
      expect(brief.evidenceLevel).toBe("Identity unresolved");
      expect(brief.papers).toHaveLength(0);
      expect(brief.limitation.length).toBeGreaterThan(40);
    }
    expect(
      getResearchBrief("wolverine")!.papers.every(
        p => p.relationship === "component only"
      )
    ).toBe(true);
    expect(
      getResearchBrief("ipamorelin-cjc")!.papers.every(
        p => p.relationship === "component only"
      )
    ).toBe(true);
    expect(
      OWNER_CATALOGUE_PRODUCTS.find(p =>
        p.id.startsWith("wolverine-stack-bpc-5mg")
      )!.title
    ).toContain("BPC 5mg");
  });
  it("includes21 distinct source-linked papers with findings, limitations and primary metadata", () => {
    const papers = getResearchPapers();
    expect(papers).toHaveLength(21);
    for (const paper of papers) {
      expect(paper.url).toMatch(/^https:\/\//);
      expect(paper.doi).toMatch(/^10\./);
      expect(paper.pmid).toMatch(/^\d+$/);
      expect(paper.title.length).toBeGreaterThan(12);
      expect(paper.authors.length).toBeGreaterThan(4);
      expect(paper.studyType.length).toBeGreaterThan(12);
      expect(paper.finding.length).toBeGreaterThan(40);
      expect(paper.limitation.length).toBeGreaterThan(40);
      expect(paper.year).toBeLessThanOrEqual(2026);
    }
  });
  it("retains null results and correction context rather than presenting research as general performance benefit", () => {
    expect(
      getResearchBrief("ss31")!.papers.some(p =>
        p.finding.includes("did not meet")
      )
    ).toBe(true);
    expect(getResearchBrief("oxytocin")!.papers[0].finding).toContain(
      "No significant advantage"
    );
    expect(getResearchBrief("epithalon")!.papers[1].limitation).toContain(
      "correction"
    );
    expect(getResearchBrief("glutathione")!.limitation).toContain("route");
  });
  it("uses only existing local derivatives and visibly distinguishes molecular/reference imagery from stock photos", () => {
    expect(
      Object.values(PRODUCT_IMAGES).filter(
        image => image.type === "molecular structure"
      )
    ).toHaveLength(8);
    expect(PRODUCT_IMAGES["tirzepatida-25mg-5x5mg-zphc"].type).toBe(
      "reference packaging"
    );
    for (const product of OWNER_CATALOGUE_PRODUCTS) {
      const image = getProductImage(product.id, product.familyId);
      expect(
        existsSync(path.join(process.cwd(), "client/public", image.src))
      ).toBe(true);
      expect(image.sourceUrl).toMatch(/^https:\/\//);
      expect(image.caption.toLowerCase()).toMatch(/not|reference/);
      expect(image.alt.length).toBeGreaterThan(25);
    }
  });
});

describe("Public initial HTML and private-account boundary", () => {
  it("renders research citations, metadata and body before executing JavaScript", () => {
    const result = renderPublicDocument(template, "/research");
    expect(result.status).toBe(200);
    expect(result.html).toContain("Read the papers.");
    expect(result.html).toContain("10.1172/jci.insight.140532");
    expect(result.html).toContain("Findings");
    expect(result.html).toContain("Bioupgrade Research");
    expect(result.html.match(/<title>/g)).toHaveLength(1);
    expect(result.html).not.toContain('<div id="root"></div>');
  });
  it("renders exact current product content and component/identity limitations on detail routes", () => {
    const product = renderPublicDocument(
      template,
      "/shop/tirzepatida-25mg-5x5mg-zphc"
    );
    expect(product.status).toBe(200);
    expect(product.html).toContain("Tirzepatida 25mg (5x5mg) ZPHC");
    expect(product.html).toContain("€150");
    expect(product.html).toContain("not supplied batch");
    const blend = renderPublicDocument(template, "/shop/klow-80mg");
    expect(blend.html).toContain("Identity unresolved");
    expect(blend.html).toContain("No primary papers are attributed");
  });
  it("never includes an authenticated account, cached points or guessed order in public SSR", () => {
    expect(renderPublicBody("/account")).toBe("");
    const result = renderPublicDocument(
      template,
      "/account?checkout=processing&order=someone-elses-order"
    );
    expect(result.html).toContain('<div id="root"></div>');
    expect(result.html).toContain('content="noindex,follow"');
    expect(result.html).not.toContain("someone-elses-order");
    expect(result.html).not.toContain("AVAILABLE SIGNAL POINTS");
  });
  it("returns real404 metadata for missing pages/products and does not index archived variants", () => {
    for (const route of ["/missing-page", "/shop/missing-compound"]) {
      const result = renderPublicDocument(template, route);
      expect(result.status).toBe(404);
      expect(result.html).toContain('content="noindex,follow"');
    }
    expect(getPublicPageMetadata("/shop/image-ghk-cu-100").indexable).toBe(
      false
    );
  });
  it("omits guessed absolute URLs and emits only a configured real HTTPS origin", () => {
    vi.stubEnv("APP_ORIGIN", "");
    vi.stubEnv("PUBLIC_APP_URL", "");
    expect(configuredPublicOrigin()).toBeNull();
    expect(renderPublicDocument(template, "/research").html).not.toContain(
      'rel="canonical"'
    );
    expect(publicSitemap()).toBeNull();
    expect(publicRobots()).toContain("Disallow: /");
    vi.stubEnv("APP_ORIGIN", "https://actual.example");
    const result = renderPublicDocument(template, "/research?family=mots-c");
    expect(result.html).toContain(
      'rel="canonical" href="https://actual.example/research"'
    );
    const sitemap = publicSitemap()!;
    expect(sitemap).toContain("https://actual.example/shop/mots-c-40mg");
    expect(sitemap).not.toContain("/account");
    expect(sitemap).not.toContain("/shop/image-");
    expect(publicRobots()).toContain("Disallow: /api/");
    vi.stubEnv("APP_ORIGIN", "https://bad.example/path");
    expect(configuredPublicOrigin()).toBeNull();
  });
  it("escapes head text and retains application scripts without exposing request-controlled HTML", () => {
    expect(escapeHtml('<tag x="a&b">\'')).toBe(
      "&lt;tag x=&quot;a&amp;b&quot;&gt;&#39;"
    );
    const result = renderPublicDocument(template, "/shop/%3Cscript%3E");
    expect(result.status).toBe(404);
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain('src="/assets/main.js"');
  });
});

describe("Confirmed review regressions", () => {
  it("places the local question builder and its input inside the existing collector exclusion boundary", () => {
    const html = renderPublicBody("/community");
    const section = html.match(
      /<section[^>]*id="question-builder"[^>]*>[\s\S]*?<\/section>/
    )?.[0];
    expect(section).toBeDefined();
    expect(section).toContain("manus-no-record");
    expect(section).toContain('id="discussion-question"');
    expect(section).toContain("Nothing is automatically sent or saved");
    expect(section).toContain("explicit action, not a verified post");
  });
  it("renders a briefs deep link and a parameter-free papers view consistently with the shared location parser", async () => {
    const { researchLocationState } = await import(
      "../client/src/pages/Research"
    );
    expect(researchLocationState("?family=tirzepatide&view=briefs")).toEqual({
      family: "tirzepatide",
      view: "briefs",
    });
    expect(researchLocationState("?family=mots-c")).toEqual({
      family: "mots-c",
      view: "papers",
    });
    expect(researchLocationState("?view=unknown")).toEqual({
      family: "",
      view: "papers",
    });
    const html = renderPublicDocument(
      template,
      "/research?family=klow&view=briefs"
    ).html;
    expect(html).toContain("Identity unresolved");
    expect(html).toContain("Klow");
  });
});
