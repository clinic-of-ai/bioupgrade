import { createHmac } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fixture_only";
  return {
    session: null as any,
    line: null as any,
    intent: null as any,
    apply: vi.fn(),
    client: null as any,
  };
});
vi.mock("./commerce", () => ({ applyVerifiedSnapshot: state.apply }));
vi.mock("./db", () => ({
  requireDb: async () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [] }) }),
    }),
  }),
}));
vi.mock("stripe", async () => {
  const actual = await vi.importActual<any>("stripe");
  return {
    default: class {
      constructor() {
        const real = new actual.default("sk_test_fixture_only");
        state.client = {
          webhooks: real.webhooks,
          checkout: {
            sessions: {
              retrieve: vi.fn(async () => state.session),
              listLineItems: vi.fn(async () => ({
                data: [state.line],
                has_more: false,
              })),
              list: vi.fn(async () => ({
                data: [state.session],
                has_more: false,
              })),
            },
          },
          paymentIntents: { retrieve: vi.fn(async () => state.intent) },
          charges: { retrieve: vi.fn(async () => state.intent.latest_charge) },
          invoicePayments: {
            list: vi.fn(async () => ({
              data: [
                {
                  invoice: "in_initial",
                  payment: {
                    type: "payment_intent",
                    payment_intent: "pi_initial",
                  },
                },
              ],
              has_more: false,
            })),
          },
        };
        return state.client;
      }
    },
  };
});
import {
  registerStripeWebhook,
  retrievePaymentSnapshot,
  processVerifiedStripeEvent,
} from "./stripe";
function webhookHandler() {
  let handler: any;
  registerStripeWebhook({
    post(_path: string, ...handlers: any[]) {
      handler = handlers.at(-1);
    },
  } as any);
  return handler;
}
function response() {
  return {
    statusCode: 200,
    body: null as any,
    status(n: number) {
      this.statusCode = n;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };
}
function signed(payload: string) {
  const t = Math.floor(Date.now() / 1000);
  return `t=${t},v1=${createHmac("sha256", "whsec_fixture_only").update(`${t}.${payload}`).digest("hex")}`;
}
beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture_only");
  state.apply.mockReset().mockResolvedValue(true);
  state.session = {
    id: "cs_fixture",
    metadata: {
      order_id: "internal-order",
      product_id: "field-notes-kit",
      catalog: "marketplace",
      user_id: "42",
    },
    client_reference_id: "42",
    payment_intent: "pi_fixture",
    currency: "eur",
    mode: "payment",
    amount_total: 4320,
    status: "complete",
    payment_status: "paid",
  };
  state.line = {
    quantity: 1,
    price: { unit_amount: 4800 },
    amount_subtotal: 4800,
    amount_discount: 1200,
    amount_tax: 720,
    amount_total: 4320,
    currency: "eur",
  };
  state.intent = {
    id: "pi_fixture",
    status: "succeeded",
    amount_received: 4320,
    currency: "eur",
    latest_charge: {
      id: "ch_fixture",
      amount: 4320,
      currency: "eur",
      paid: true,
      payment_intent: "pi_fixture",
      amount_refunded: 0,
      refunded: false,
      disputed: false,
    },
  };
});
afterEach(() => vi.unstubAllEnvs());
describe("Stripe raw verification and current settlement snapshots (no external transport)", () => {
  it("rejects wrong signatures and parsed bodies before any order writes", async () => {
    const handler = webhookHandler();
    const payload = JSON.stringify({
      id: "evt_fixture",
      type: "checkout.session.completed",
      data: { object: { id: "cs_fixture" } },
    });
    const invalid = response();
    await handler(
      { body: Buffer.from(payload), headers: { "stripe-signature": "bad" } },
      invalid
    );
    expect(invalid.statusCode).toBe(400);
    const parsed = response();
    await handler(
      {
        body: JSON.parse(payload),
        headers: { "stripe-signature": signed(payload) },
      },
      parsed
    );
    expect(parsed.statusCode).toBe(400);
    expect(state.apply).not.toHaveBeenCalled();
  });
  it("does not bypass verified evt_test_ IDs and writes the normal event path", async () => {
    const payload = JSON.stringify({
      id: "evt_test_paid_fixture",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_fixture" } },
    });
    const res = response();
    await webhookHandler()(
      {
        body: Buffer.from(payload),
        headers: { "stripe-signature": signed(payload) },
      },
      res
    );
    expect(res.statusCode).toBe(200);
    expect(state.apply).toHaveBeenCalledWith(
      expect.objectContaining({ paid: true, productCents: 3600 }),
      { id: "evt_test_paid_fixture", type: "checkout.session.completed" }
    );
  });
  it("does not call unpaid checkout completed paid, then resolves delayed payment_intent.succeeded", async () => {
    state.session.payment_status = "unpaid";
    state.intent.status = "processing";
    state.intent.latest_charge.paid = false;
    await processVerifiedStripeEvent(
      {
        id: "evt_unpaid",
        type: "checkout.session.completed",
        data: { object: { id: "cs_fixture" } },
      } as any,
      state.client
    );
    expect(state.apply.mock.calls[0][0].paid).toBe(false);
    state.session.payment_status = "paid";
    state.intent.status = "succeeded";
    state.intent.latest_charge.paid = true;
    await processVerifiedStripeEvent(
      {
        id: "evt_delayed",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_fixture" } },
      } as any,
      state.client
    );
    expect(state.apply.mock.calls[1][0]).toMatchObject({
      paid: true,
      productCents: 3600,
    });
  });
  it("reads current refunded/disputed charge state, and rejects a payment amount mismatch", async () => {
    state.intent.latest_charge.amount_refunded = 1200;
    state.intent.latest_charge.disputed = true;
    expect(
      await retrievePaymentSnapshot("cs_fixture", state.client)
    ).toMatchObject({
      paid: true,
      refundedCents: 1200,
      disputed: true,
      productCents: 3600,
    });
    state.intent.amount_received = 999999;
    expect(
      await retrievePaymentSnapshot("cs_fixture", state.client)
    ).toMatchObject({ paid: false });
  });
  it("resolves the initial monthly subscription invoice payment via the current API", async () => {
    state.session.mode = "subscription";
    state.session.payment_intent = null;
    state.session.invoice = "in_initial";
    state.session.subscription = "sub_initial";
    state.intent.id = "pi_initial";
    state.intent.latest_charge.payment_intent = "pi_initial";
    expect(
      await retrievePaymentSnapshot("cs_fixture", state.client)
    ).toMatchObject({
      paid: true,
      paymentIntentId: "pi_initial",
      subscriptionId: "sub_initial",
      mode: "subscription",
    });
  });
  it("returns a retryable failure if a verified event cannot be stored", async () => {
    state.apply.mockRejectedValueOnce(new Error("isolated storage failure"));
    const payload = JSON.stringify({
      id: "evt_retry",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_fixture" } },
    });
    const res = response();
    await webhookHandler()(
      {
        body: Buffer.from(payload),
        headers: { "stripe-signature": signed(payload) },
      },
      res
    );
    expect(res.statusCode).toBe(503);
  });
});
