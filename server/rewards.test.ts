import { describe, expect, it } from "vitest";
import { getNextTier, getTier, getTierProgress } from "../shared/rewards";
import { MARKETPLACE_PRODUCTS } from "../shared/marketplace";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Bioupgrade rewards and marketplace guardrails", () => {
  it("maps points to a tier and progress bar", () => {
    expect(getTier(0).label).toBe("Signal");
    expect(getTier(500).label).toBe("Protocol");
    expect(getNextTier(500)?.label).toBe("Frontier");
    expect(getTierProgress(750)).toBe(25);
  });

  it("keeps research drops out of live checkout until gated", async () => {
    const gated = MARKETPLACE_PRODUCTS.find((item) => item.status === "gated");
    expect(gated).toBeDefined();
    const context: TrpcContext = {
      user: null,
      req: { headers: { origin: "https://example.com" } } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(context);
    await expect(caller.checkout.createSession({ productId: gated!.id, catalog: "marketplace" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
