import { describe, expect, it } from "vitest";
import { MARKETPLACE_PRODUCTS } from "../shared/marketplace";
import { PRODUCTS } from "../shared/products";
import {
  assertEligibleProduct,
  trustedCheckoutOrigin,
  pointsForProduct,
  retainedProductCents,
} from "./commerceRules";
describe("commerce eligibility, origins, and net amount rules", () => {
  it("blocks all unapproved recovered marketplace inventory", () => {
    for (const product of MARKETPLACE_PRODUCTS)
      expect(() => assertEligibleProduct(product, "marketplace")).toThrow();
  });
  it("cannot enable compounds by changing only availability and approval flags", () => {
    const compound = MARKETPLACE_PRODUCTS.find(p => p.kind === "peptide")!;
    expect(() =>
      assertEligibleProduct(
        { ...compound, status: "available", commerceApproved: true },
        "marketplace"
      )
    ).toThrow();
    const kit = MARKETPLACE_PRODUCTS.find(p => p.kind === "field-kit")!;
    expect(() =>
      assertEligibleProduct(
        { ...kit, status: "available", commerceApproved: true },
        "marketplace"
      )
    ).not.toThrow();
  });
  it("rejects all scoped From services but accepts the explicitly enabled session", () => {
    for (const product of PRODUCTS) {
      if (product.checkoutEnabled === true)
        expect(() => assertEligibleProduct(product, "services")).not.toThrow();
      else expect(() => assertEligibleProduct(product, "services")).toThrow();
    }
  });
  it("accepts exact configured HTTPS origins and never guesses a Host", () => {
    const env = {
      PUBLIC_APP_URL: "https://bioupgrade.example",
      ALLOWED_ORIGINS: "https://preview.example",
    };
    expect(trustedCheckoutOrigin("https://preview.example", env)).toBe(
      "https://preview.example"
    );
    expect(trustedCheckoutOrigin(undefined, env)).toBe(
      "https://bioupgrade.example"
    );
    expect(() =>
      trustedCheckoutOrigin("https://bioupgrade.example.evil.test", env)
    ).toThrow();
    expect(() => trustedCheckoutOrigin("https://evil.test", env)).toThrow();
    expect(() => trustedCheckoutOrigin(undefined, {})).toThrow();
    expect(() =>
      trustedCheckoutOrigin(undefined, {
        ALLOWED_ORIGINS: "https://preview.example",
      })
    ).toThrow();
    expect(() => trustedCheckoutOrigin("null", env)).toThrow();
    expect(() =>
      trustedCheckoutOrigin("https://bioupgrade.example/path", env)
    ).toThrow();
    expect(() =>
      trustedCheckoutOrigin("https://user:password@bioupgrade.example", env)
    ).toThrow();
  });
  it("uses actual discounted product cents and conservative refund allocation", () => {
    expect(pointsForProduct(3599)).toBe(35);
    expect(retainedProductCents(3600, 1200, false)).toBe(2400);
    expect(retainedProductCents(3600, 4800, false, true)).toBe(0);
    expect(retainedProductCents(3600, 0, true)).toBe(0);
    expect(() => pointsForProduct(-1)).toThrow();
  });
});
