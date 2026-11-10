import { afterEach, describe, expect, it, vi } from "vitest";
import { getCommerceProvider } from "../shared/commerce-provider";
import { getServiceStatus } from "./_core/env";
import {
  getPublicPageMetadata,
  renderPublicBody,
  publicSitemap,
  publicRobots,
} from "./public-pages";
afterEach(() => vi.unstubAllEnvs());
describe("Selected commerce provider and private cart boundary", () => {
  it("defaults to the owner's Shopify choice and requires explicit legacy selection", () => {
    vi.stubEnv("COMMERCE_PROVIDER", "");
    expect(getCommerceProvider()).toBe("shopify");
    expect(getCommerceProvider("stripe")).toBe("stripe");
    expect(getCommerceProvider("unexpected")).toBe("shopify");
  });
  it("does not report configured Stripe credentials as selected Shopify payment readiness", () => {
    vi.stubEnv("COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("STRIPE_SECRET_KEY", "isolated-not-a-real-key");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "isolated-not-a-real-signature-key");
    vi.stubEnv("SHOPIFY_CHECKOUT_ENABLED", "false");
    expect(getServiceStatus()).toMatchObject({
      commerceProvider: "shopify",
      services: { payments: false },
      shopify: {
        accountLinkageImplemented: false,
        connectivityVerified: false,
      },
    });
  });
  it("keeps cart content out of initial HTML and out of search indexing", () => {
    const body = renderPublicBody(
      "/cart",
      "?cartId=foreign-secret&key=foreign"
    );
    expect(getPublicPageMetadata("/cart")).toMatchObject({
      status: 200,
      indexable: false,
    });
    expect(body).toContain("loaded privately");
    expect(body).not.toContain("foreign-secret");
    expect(body).not.toContain("foreign");
    expect(publicSitemap("https://app.example.test")).not.toContain("/cart");
    expect(publicRobots("https://app.example.test")).toContain(
      "Disallow: /cart"
    );
  });
});
