import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, or, isNotNull } from "drizzle-orm";
import {
  commerceOrders,
  commercePaymentEvents,
  rewardEvents,
  type CommerceOrder,
} from "../drizzle/schema";
import {
  appendRewardLedger,
  commerceTransaction,
  requireDb,
  type CommerceTx,
} from "./db";
import {
  ORDINARY_KINDS,
  pointsForProduct,
  retainedProductCents,
} from "./commerceRules";
import { qualifyReferralTx, revokeReferralTx } from "./referrals";
export type PaymentSnapshot = {
  orderId: string;
  sessionId: string;
  userReference: string | null;
  productId: string | undefined;
  catalog: string | undefined;
  priceCents: number | null;
  currency: string;
  mode: string | null;
  paymentIntentId: string | null;
  subscriptionId: string | null;
  paid: boolean;
  productCents: number;
  refundedCents: number;
  fullyRefunded: boolean;
  disputed: boolean;
  sessionStatus: string | null;
  paymentFailed?: boolean;
};
export async function createInternalOrder(input: {
  userId: number;
  productId: string;
  productTitle: string;
  productKind: string;
  catalog: string;
  amountCents: number;
  checkoutMode: "payment" | "subscription";
}) {
  const id = randomUUID();
  await commerceTransaction(async tx => {
    await tx
      .insert(commerceOrders)
      .values({ ...input, id, currency: "eur", status: "created" });
  });
  return id;
}
export async function attachStripeSession(
  orderId: string,
  userId: number,
  sessionId: string
) {
  await commerceTransaction(async tx => {
    const order = (
      await tx
        .select()
        .from(commerceOrders)
        .where(
          and(eq(commerceOrders.id, orderId), eq(commerceOrders.userId, userId))
        )
        .limit(1)
    )[0];
    if (
      !order ||
      (order.stripeSessionId && order.stripeSessionId !== sessionId)
    )
      throw new TRPCError({
        code: "CONFLICT",
        message: "Order session mismatch.",
      });
    await tx
      .update(commerceOrders)
      .set({
        stripeSessionId: sessionId,
        ...(!order.fulfilledAt ? { status: "pending" as const } : {}),
      })
      .where(eq(commerceOrders.id, orderId));
  });
}
export function publicOrder(order: CommerceOrder) {
  return {
    id: order.id,
    productTitle: order.productTitle,
    amountCents: order.fulfilledAt ? order.productPaidCents : order.amountCents,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt,
    ...(order.fulfilledAt ? { fulfilledAt: order.fulfilledAt } : {}),
    ...(order.stripeSessionId
      ? { stripeSessionId: order.stripeSessionId }
      : {}),
  };
}
export async function ownedOrders(userId: number) {
  const db = await requireDb();
  return db
    .select()
    .from(commerceOrders)
    .where(eq(commerceOrders.userId, userId))
    .orderBy(desc(commerceOrders.createdAt));
}
export function snapshotMatchesOrder(order: CommerceOrder, s: PaymentSnapshot) {
  return (
    s.orderId === order.id &&
    s.userReference === String(order.userId) &&
    s.productId === order.productId &&
    s.catalog === order.catalog &&
    s.currency === order.currency &&
    s.priceCents === order.amountCents &&
    s.mode === order.checkoutMode &&
    ORDINARY_KINDS.has(order.productKind) &&
    (!order.stripeSessionId || s.sessionId === order.stripeSessionId) &&
    (!order.stripePaymentIntentId ||
      order.stripePaymentIntentId === s.paymentIntentId) &&
    Number.isSafeInteger(s.productCents) &&
    s.productCents >= 0 &&
    s.productCents <= order.amountCents &&
    Number.isSafeInteger(s.refundedCents) &&
    s.refundedCents >= 0
  );
}
async function settleTx(tx: CommerceTx, snapshot: PaymentSnapshot) {
  let order = (
    await tx
      .select()
      .from(commerceOrders)
      .where(eq(commerceOrders.id, snapshot.orderId))
      .limit(1)
  )[0];
  if (!order) return false; // An unrelated Stripe payment cannot manufacture a local order.
  if (!snapshotMatchesOrder(order, snapshot))
    throw new Error("Verified Stripe snapshot does not match internal order");
  if (!snapshot.paid) {
    if (!order.fulfilledAt)
      await tx
        .update(commerceOrders)
        .set({
          stripeSessionId: snapshot.sessionId,
          stripePaymentIntentId: snapshot.paymentIntentId,
          stripeSubscriptionId: snapshot.subscriptionId,
          status:
            snapshot.sessionStatus === "expired"
              ? "canceled"
              : snapshot.paymentFailed
                ? "failed"
                : "pending",
        })
        .where(eq(commerceOrders.id, order.id));
    return false;
  }
  const now = new Date();
  const firstSettlement = !order.fulfilledAt;
  const productPaidCents = firstSettlement
    ? snapshot.productCents
    : order.productPaidCents;
  const refundedCents = Math.max(order.refundedCents, snapshot.refundedCents);
  const disputed = snapshot.disputed || order.status === "disputed";
  const fullyRefunded = snapshot.fullyRefunded || order.status === "refunded";
  const retained = retainedProductCents(
    productPaidCents,
    refundedCents,
    disputed,
    fullyRefunded
  );
  const targetPoints = pointsForProduct(retained);
  let firstPurchasePoints = order.firstPurchasePoints;
  if (firstSettlement) {
    const priorOrders = await tx
      .select({ id: commerceOrders.id })
      .from(commerceOrders)
      .where(
        and(
          eq(commerceOrders.userId, order.userId),
          isNotNull(commerceOrders.fulfilledAt)
        )
      )
      .limit(1);
    const priorPurchases = await tx
      .select({ id: rewardEvents.id })
      .from(rewardEvents)
      .where(
        and(
          eq(rewardEvents.userId, order.userId),
          eq(rewardEvents.eventType, "purchase")
        )
      )
      .limit(1);
    if (targetPoints > 0)
      await appendRewardLedger(tx, {
        userId: order.userId,
        points: targetPoints,
        eventType: "purchase",
        dedupKey: `order:${order.id}:purchase`,
        referenceId: order.id,
        note: `Purchase: ${order.productTitle}`,
      });
    if (
      !priorOrders.length &&
      !priorPurchases.length &&
      productPaidCents > 0 &&
      !refundedCents &&
      !disputed &&
      !fullyRefunded
    ) {
      const legacy = await tx
        .select({ id: rewardEvents.id })
        .from(rewardEvents)
        .where(
          and(
            eq(rewardEvents.userId, order.userId),
            or(
              eq(
                rewardEvents.referenceId,
                `mission:${order.userId}:first-purchase`
              ),
              eq(rewardEvents.dedupKey, `user:${order.userId}:first-purchase`)
            )
          )
        )
        .limit(1);
      if (
        !legacy.length &&
        (await appendRewardLedger(tx, {
          userId: order.userId,
          points: 100,
          eventType: "first_purchase",
          dedupKey: `user:${order.userId}:first-purchase`,
          referenceId: order.id,
          note: "First verified eligible purchase.",
        }))
      )
        firstPurchasePoints = 100;
    }
  } else if (targetPoints < order.purchasePoints) {
    await appendRewardLedger(tx, {
      userId: order.userId,
      points: targetPoints - order.purchasePoints,
      eventType: disputed ? "dispute_reversal" : "refund_reversal",
      dedupKey: `order:${order.id}:purchase-reversal:${targetPoints}`,
      referenceId: order.id,
      note: "Purchase points adjusted to retained paid product amount.",
    });
  }
  if (
    (refundedCents > 0 || disputed || fullyRefunded) &&
    firstPurchasePoints > 0
  ) {
    await appendRewardLedger(tx, {
      userId: order.userId,
      points: -firstPurchasePoints,
      eventType: "first_purchase_reversal",
      dedupKey: `order:${order.id}:first-reversal`,
      referenceId: order.id,
      note: "First-purchase qualification revoked after refund/dispute.",
    });
    firstPurchasePoints = 0;
  }
  const status: CommerceOrder["status"] = disputed
    ? "disputed"
    : fullyRefunded
      ? "refunded"
      : refundedCents > 0
        ? "partially_refunded"
        : "paid";
  const purchasePoints = firstSettlement
    ? targetPoints
    : Math.min(order.purchasePoints, targetPoints);
  await tx
    .update(commerceOrders)
    .set({
      stripeSessionId: snapshot.sessionId,
      stripePaymentIntentId: snapshot.paymentIntentId,
      stripeSubscriptionId: snapshot.subscriptionId,
      productPaidCents,
      refundedCents,
      purchasePoints,
      firstPurchasePoints,
      status,
      fulfilledAt: order.fulfilledAt ?? now,
    })
    .where(eq(commerceOrders.id, order.id));
  order = {
    ...order,
    productPaidCents,
    refundedCents,
    purchasePoints,
    firstPurchasePoints,
    status,
    fulfilledAt: order.fulfilledAt ?? now,
  };
  if (refundedCents > 0 || disputed || fullyRefunded)
    await revokeReferralTx(tx, order.id);
  else if (firstSettlement) await qualifyReferralTx(tx, order, now);
  return true;
}
export async function applyVerifiedSnapshot(
  snapshot: PaymentSnapshot | null,
  event?: { id: string; type: string }
) {
  return commerceTransaction(async tx => {
    if (event) {
      const existing = await tx
        .select({ id: commercePaymentEvents.eventId })
        .from(commercePaymentEvents)
        .where(eq(commercePaymentEvents.eventId, event.id))
        .limit(1);
      if (existing.length) return false;
      await tx.insert(commercePaymentEvents).values({
        eventId: event.id,
        eventType: event.type,
        orderId: snapshot?.orderId ?? null,
      });
    }
    return snapshot ? settleTx(tx, snapshot) : false;
  });
}
