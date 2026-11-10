import { raw, type Express, type Request, type Response } from "express";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { commerceOrders, type CommerceOrder } from "../drizzle/schema";
import { requireDb } from "./db";
import { applyVerifiedSnapshot, type PaymentSnapshot } from "./commerce";
const secretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = secretKey
  ? new Stripe(secretKey, {
      apiVersion: "2026-10-28.endive",
      maxNetworkRetries: 2,
    })
  : null;
const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null);

/** Always retrieve current state; signed event payloads can be stale or out of order. */
export async function retrievePaymentSnapshot(
  sessionId: string,
  client: Stripe = stripe!
): Promise<PaymentSnapshot | null> {
  if (!client)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Payment reconciliation is unavailable.",
    });
  const session = await client.checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.order_id;
  if (!orderId) return null;
  if (session.metadata?.user_id !== session.client_reference_id)
    throw new Error("Stripe ownership metadata mismatch");
  const lines = await client.checkout.sessions.listLineItems(session.id, {
    limit: 2,
  });
  if (lines.has_more || lines.data.length !== 1 || lines.data[0].quantity !== 1)
    throw new Error("Unexpected Stripe order lines");
  const line = lines.data[0];
  const productCents = line.amount_total - line.amount_tax;
  if (
    !Number.isSafeInteger(productCents) ||
    productCents < 0 ||
    productCents !== line.amount_subtotal - line.amount_discount
  )
    throw new Error("Invalid net product amount");
  let paymentIntentId = idOf(session.payment_intent);
  if (!paymentIntentId && session.mode === "subscription" && session.invoice) {
    // Current API links invoice payments separately, not invoice.payment_intent.
    const payments = await client.invoicePayments.list({
      invoice: idOf(session.invoice)!,
      limit: 2,
    });
    const intents = payments.data
      .map(p => idOf(p.payment.payment_intent))
      .filter((v): v is string => Boolean(v));
    if (payments.has_more || intents.length > 1)
      throw new Error("Ambiguous subscription payment");
    paymentIntentId = intents[0] ?? null;
  }
  const intent = paymentIntentId
    ? await client.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      })
    : null;
  const latestCharge = intent?.latest_charge;
  const charge =
    typeof latestCharge === "string"
      ? await client.charges.retrieve(latestCharge)
      : (latestCharge ?? null);
  const paid =
    session.payment_status === "paid" &&
    session.status === "complete" &&
    intent?.status === "succeeded" &&
    Boolean(charge?.paid) &&
    intent.amount_received === session.amount_total &&
    intent.currency === session.currency &&
    charge?.currency === session.currency &&
    charge.amount === session.amount_total &&
    idOf(charge.payment_intent) === intent.id;
  return {
    orderId,
    sessionId: session.id,
    userReference: session.client_reference_id,
    productId: session.metadata?.product_id,
    catalog: session.metadata?.catalog,
    priceCents: line.price?.unit_amount ?? null,
    currency: line.currency,
    mode: session.mode,
    paymentIntentId,
    subscriptionId: idOf(session.subscription),
    paid,
    productCents,
    refundedCents: charge?.amount_refunded ?? 0,
    fullyRefunded: charge?.refunded ?? false,
    disputed: charge?.disputed ?? false,
    sessionStatus: session.status,
    paymentFailed:
      intent?.status === "canceled" ||
      intent?.status === "requires_payment_method",
  };
}
async function sessionForIntent(intentId: string, client: Stripe) {
  const db = await requireDb();
  const known = (
    await db
      .select()
      .from(commerceOrders)
      .where(eq(commerceOrders.stripePaymentIntentId, intentId))
      .limit(1)
  )[0];
  if (known?.stripeSessionId) return known.stripeSessionId;
  const sessions = await client.checkout.sessions.list({
    payment_intent: intentId,
    limit: 2,
  });
  if (sessions.data.length === 1 && !sessions.has_more)
    return sessions.data[0].id;
  // For a delayed initial subscription payment, resolve invoice -> subscription -> initial Checkout session.
  const payments = await client.invoicePayments.list({
    payment: { type: "payment_intent", payment_intent: intentId },
    limit: 2,
  });
  if (payments.has_more || payments.data.length !== 1) return null;
  const invoiceId = idOf(payments.data[0].invoice)!;
  const invoice = await client.invoices.retrieve(invoiceId);
  const subscriptionId = idOf(
    invoice.parent?.subscription_details?.subscription
  );
  if (!subscriptionId || invoice.billing_reason !== "subscription_create")
    return null;
  const subscriptionSessions = await client.checkout.sessions.list({
    subscription: subscriptionId,
    limit: 2,
  });
  return (
    subscriptionSessions.data.find(s => idOf(s.invoice) === invoiceId)?.id ??
    null
  );
}
export async function processVerifiedStripeEvent(
  event: Stripe.Event,
  client: Stripe = stripe!
) {
  if (!client) throw new Error("Stripe unavailable");
  let sessionId: string | null = null;
  if (event.type.startsWith("checkout.session."))
    sessionId = (event.data.object as Stripe.Checkout.Session).id;
  else if (
    [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "payment_intent.canceled",
    ].includes(event.type)
  )
    sessionId = await sessionForIntent(
      (event.data.object as Stripe.PaymentIntent).id,
      client
    );
  else if (
    [
      "charge.refunded",
      "charge.dispute.created",
      "charge.dispute.closed",
    ].includes(event.type)
  ) {
    // Defense in depth if explicitly subscribed later; current platform delivery is NOT assumed.
    const object = event.data.object as Stripe.Charge | Stripe.Dispute;
    const charge =
      object.object === "charge"
        ? object
        : await client.charges.retrieve(idOf(object.charge)!);
    const intentId = idOf(charge.payment_intent);
    if (intentId) sessionId = await sessionForIntent(intentId, client);
  }
  const snapshot = sessionId
    ? await retrievePaymentSnapshot(sessionId, client)
    : null;
  return applyVerifiedSnapshot(snapshot, { id: event.id, type: event.type });
}
/** Reconcile only server-selected known orders, never an order/session ID supplied by an account caller. */
export async function reconcileKnownOrders(orders: CommerceOrder[]) {
  const known = orders.filter(o => o.stripeSessionId);
  if (known.length && !stripe)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Payment status verification is unavailable. Please try again later.",
    });
  const verified = new Set<string>();
  // Bounded network concurrency. No Stripe call is made while a database lock is held.
  for (let offset = 0; offset < known.length; offset += 4) {
    await Promise.all(
      known.slice(offset, offset + 4).map(async order => {
        try {
          const snapshot = await retrievePaymentSnapshot(
            order.stripeSessionId!
          );
          if (!snapshot || snapshot.orderId !== order.id)
            throw new Error("Missing owned Stripe snapshot");
          const paid = await applyVerifiedSnapshot(snapshot);
          if (paid) verified.add(order.id);
        } catch (cause) {
          if (cause instanceof TRPCError) throw cause;
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message:
              "Current payment status could not be verified. Please try again later.",
            cause,
          });
        }
      })
    );
  }
  return verified;
}
/** Must be registered BEFORE express.json(). No test-event ID bypass exists. */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    raw({ type: "application/json", limit: "1mb" }),
    async (req: Request, res: Response) => {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET)
        return res
          .status(503)
          .json({ error: "Stripe webhook is not configured" });
      const signature = req.headers["stripe-signature"];
      if (!Buffer.isBuffer(req.body) || typeof signature !== "string")
        return res
          .status(400)
          .json({ error: "A signed raw webhook body is required" });
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
      try {
        await processVerifiedStripeEvent(event);
        return res.json({ received: true });
      } catch {
        console.error(
          "[Stripe] Verified event processing failed; retry required"
        );
        return res
          .status(503)
          .json({ error: "Payment processing temporarily unavailable" });
      }
    }
  );
}
