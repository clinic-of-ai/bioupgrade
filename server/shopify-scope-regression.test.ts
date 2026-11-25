import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Storefront cart query scopes", () => {
  it("does not request selling-plan fields that the connected public token cannot read", () => {
    const source = readFileSync(new URL("./shopify-storefront.ts", import.meta.url), "utf8");
    const fields = source.match(/const CART_FIELDS = `([\s\S]*?)`;/)?.[1] ?? "";
    expect(fields).toContain("lines(first: 20)");
    expect(fields).not.toMatch(/sellingPlan/);
  });
});
