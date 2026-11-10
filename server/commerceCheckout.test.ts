import { TRPCError } from "@trpc/server";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  create: vi.fn(),
  order: vi.fn(),
  attach: vi.fn(),
  product: null as any,
}));
vi.mock("./stripe", () => ({
  stripe: { checkout: { sessions: { create: state.create } } },
}));
vi.mock("./commerce", () => ({
  createInternalOrder: state.order,
  attachStripeSession: state.attach,
  ownedOrders: async () => [],
  publicOrder: (order: any) => order,
}));
vi.mock("../shared/marketplace", () => ({
  getMarketplaceProduct: () => state.product,
}));
import { checkoutRouter } from "./checkout";
import type { TrpcContext } from "./_core/context";
function caller(origin = "https://trusted.example") {
  const ctx: TrpcContext = {
    user: {
      id: 42,
      openId: "isolated-owner",
      role: "user",
      name: "Isolated",
      email: "owner@example.test",
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      headers: {
        origin,
        host: "untrusted-host.invalid",
        "x-forwarded-host": "evil.invalid",
      },
    } as any,
    res: {} as any,
  };
  return checkoutRouter.createCaller(ctx);
}
beforeEach(() => {
  vi.stubEnv("COMMERCE_PROVIDER", "stripe");
  vi.stubEnv("PUBLIC_APP_URL", "https://trusted.example");
  vi.stubEnv("ALLOWED_ORIGINS", "");
  state.create.mockReset().mockResolvedValue({
    id: "cs_isolated",
    url: "https://checkout.stripe.com/isolated-fixture",
  });
  state.order.mockReset().mockResolvedValue("isolated-order");
  state.attach.mockReset().mockResolvedValue(undefined);
  state.product = {
    id: "isolated-membership",
    title: "Approved educational membership fixture",
    description: "Test only",
    kind: "membership",
    status: "available",
    amountEur: 19,
    commerceApproved: true,
  };
});
afterEach(() => vi.unstubAllEnvs());
describe("checkout order and Stripe request contract (no external transport)", () => {
  it("blocks new legacy Stripe orders when Shopify is selected", async () => {
    vi.stubEnv("COMMERCE_PROVIDER", "shopify");
    await expect(
      caller().createSession({ productId: "research-strategy-session" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.order).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });
  it("persists the authenticated immutable order before a recurring monthly membership session", async () => {
    const result = await caller().createSession({
      productId: "isolated-membership",
      catalog: "marketplace",
      email: "different@example.test",
      userId: 999,
    } as any);
    expect(result).toMatchObject({ orderId: "isolated-order" });
    expect(state.order).toHaveBeenCalledWith({
      userId: 42,
      productId: "isolated-membership",
      productTitle: state.product.title,
      productKind: "membership",
      catalog: "marketplace",
      amountCents: 1900,
      checkoutMode: "subscription",
    });
    expect(state.order.mock.invocationCallOrder[0]).toBeLessThan(
      state.create.mock.invocationCallOrder[0]
    );
    const params = state.create.mock.calls[0][0];
    expect(params).toMatchObject({
      mode: "subscription",
      allow_promotion_codes: true,
      client_reference_id: "42",
      customer_email: "owner@example.test",
      metadata: { order_id: "isolated-order", user_id: "42" },
      subscription_data: { metadata: { order_id: "isolated-order" } },
    });
    expect(params.line_items[0].price_data).toMatchObject({
      unit_amount: 1900,
      recurring: { interval: "month" },
      tax_behavior: "exclusive",
    });
    expect(params.success_url).toBe(
      "https://trusted.example/account?checkout=processing&order=isolated-order&session_id={CHECKOUT_SESSION_ID}"
    );
    expect(params.cancel_url).toBe(
      "https://trusted.example/account?checkout=cancelled&order=isolated-order"
    );
    expect(state.attach).toHaveBeenCalledWith(
      "isolated-order",
      42,
      "cs_isolated"
    );
  });
  it("uses one-time mode for the explicitly enabled educational session", async () => {
    await caller().createSession({ productId: "research-strategy-session" });
    expect(state.order.mock.calls[0][0]).toMatchObject({
      userId: 42,
      amountCents: 20000,
      checkoutMode: "payment",
    });
    const params = state.create.mock.calls[0][0];
    expect(params.mode).toBe("payment");
    expect(params.line_items[0].price_data.recurring).toBeUndefined();
    expect(params.payment_intent_data.metadata.order_id).toBe("isolated-order");
  });
  it("never creates orders/payment sessions for untrusted origins or storage failures", async () => {
    await expect(
      caller("https://evil.invalid").createSession({
        productId: "research-strategy-session",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.order).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
    state.order.mockRejectedValueOnce(
      new TRPCError({ code: "SERVICE_UNAVAILABLE" })
    );
    await expect(
      caller().createSession({ productId: "research-strategy-session" })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(state.create).not.toHaveBeenCalled();
  });
});
