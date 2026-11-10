import { describe, expect, it } from "vitest";
import {
  MARKETPLACE_PRODUCTS,
  isMarketplacePurchasable,
} from "../shared/marketplace";
import {
  SCREENSHOT_REFERENCE,
  SUPPLIER_SHIPPING_REFERENCE,
} from "../shared/supplier-reference";
import { getTier, getTierProgress, getNextTier } from "../shared/rewards";
import { PRODUCTS } from "../shared/products";

describe("Recovered catalogue source fidelity", () => {
  it("keeps all 23 screenshot rows as distinct non-purchasable source references", () => {
    expect(SCREENSHOT_REFERENCE).toHaveLength(23);
    const imageProducts = MARKETPLACE_PRODUCTS.filter(
      item => item.source === "supplier-image"
    );
    expect(imageProducts).toHaveLength(23);
    expect(
      imageProducts.every(
        item => !isMarketplacePurchasable(item) && item.points === 0
      )
    ).toBe(true);
    expect(new Set(MARKETPLACE_PRODUCTS.map(item => item.id)).size).toBe(
      MARKETPLACE_PRODUCTS.length
    );
  });
  it("preserves conflicting prices instead of silently overwriting the previous list", () => {
    expect(
      MARKETPLACE_PRODUCTS.find(item => item.id === "tirzepatida-30mg")
        ?.amountEur
    ).toBe(115);
    expect(
      MARKETPLACE_PRODUCTS.find(item => item.id === "image-tirzepatide-30")
        ?.amountEur
    ).toBe(100);
    expect(
      MARKETPLACE_PRODUCTS.find(item => item.id === "image-ghk-cu-100")
        ?.amountEur
    ).toBe(45);
    expect(SUPPLIER_SHIPPING_REFERENCE[0].referencePriceEur).toBe(15);
  });
  it("does not correct ambiguous labels or invent missing quantities", () => {
    expect(
      SCREENSHOT_REFERENCE.find(item => item.id === "image-semak-10")?.title
    ).toBe("SEMAK");
    expect(
      SCREENSHOT_REFERENCE.find(item => item.id === "image-mt1")?.quantityLabel
    ).toBe("Not supplied");
    expect(
      SCREENSHOT_REFERENCE.find(item => item.id === "image-klow-80")
        ?.identityNote
    ).toContain("not supplied");
  });
  it("keeps all materials blocked even after a status-only edit", () => {
    for (const item of MARKETPLACE_PRODUCTS.filter(item =>
      ["peptide", "molecule", "accessory"].includes(item.kind)
    )) {
      expect(
        isMarketplacePurchasable({
          ...item,
          commerceApproved: true,
          status: "available",
        })
      ).toBe(false);
    }
    expect(
      MARKETPLACE_PRODUCTS.every(item => !isMarketplacePurchasable(item))
    ).toBe(true);
  });
  it("makes scoped starting prices quote-only", () => {
    expect(
      PRODUCTS.filter(item => item.priceLabel.startsWith("From")).every(
        item => !item.checkoutEnabled
      )
    ).toBe(true);
  });
});
describe("Tier presentation", () => {
  it("never produces a negative or non-finite progress bar for adjusted balances", () => {
    expect(getTierProgress(-500)).toBe(0);
    expect(getTierProgress(Number.NaN)).toBe(0);
    expect(getTier(-500).label).toBe("Signal");
    expect(getNextTier(-500)?.label).toBe("Protocol");
    expect(getTierProgress(5000)).toBe(100);
  });
});
