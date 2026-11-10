import { describe, expect, it } from "vitest";
import { PRODUCTS, getProduct } from "../shared/products";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Bioupgrade products and checkout", () => {
  it("keeps a complete validation catalogue with euro prices", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(4);
    expect(PRODUCTS.every((product) => product.amountEur > 0)).toBe(true);
    expect(getProduct("evidence-briefing")?.featured).toBe(true);
  });

  it("rejects unknown products before contacting Stripe", async () => {
    const context: TrpcContext = {
      user: null,
      req: { headers: { origin: "https://example.com" } } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(context);
    await expect(
      caller.checkout.createSession({ productId: "does-not-exist" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
