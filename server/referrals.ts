import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, isNotNull, or } from "drizzle-orm";
import { z } from "zod";
import {
  commerceOrders,
  referralCodes,
  referrals,
  rewardEvents,
  type CommerceOrder,
} from "../drizzle/schema";
import { appendRewardLedger, commerceTransaction, type CommerceTx } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  DAY_MS,
  REFERRAL_RULES,
  ORDINARY_KINDS,
  withinAttributionWindow,
} from "./commerceRules";
export async function referralCodeTx(tx: CommerceTx, userId: number) {
  const existing = (
    await tx
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1)
  )[0];
  if (existing) return existing.code;
  const code = randomBytes(15).toString("base64url");
  await tx.insert(referralCodes).values({ userId, code });
  return code;
}
export async function qualifyReferralTx(
  tx: CommerceTx,
  order: CommerceOrder,
  now: Date
) {
  if (
    !ORDINARY_KINDS.has(order.productKind) ||
    order.productPaidCents <= 0 ||
    order.refundedCents > 0 ||
    order.status !== "paid"
  )
    return;
  const ref = (
    await tx
      .select()
      .from(referrals)
      .where(eq(referrals.referredUserId, order.userId))
      .limit(1)
  )[0];
  if (!ref || ref.status !== "pending") return;
  // Attribution must precede checkout, not just the webhook; only the first paid ordinary order qualifies.
  const prior = await tx
    .select({ id: commerceOrders.id })
    .from(commerceOrders)
    .where(
      and(
        eq(commerceOrders.userId, order.userId),
        isNotNull(commerceOrders.fulfilledAt)
      )
    );
  if (
    prior.some(p => p.id !== order.id) ||
    order.createdAt < ref.createdAt ||
    !withinAttributionWindow(ref.createdAt, now)
  ) {
    await tx
      .update(referrals)
      .set({ status: "expired" })
      .where(eq(referrals.id, ref.id));
    return;
  }
  const recent = await tx
    .select({ id: referrals.id })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerUserId, ref.referrerUserId),
        gte(referrals.qualifiedAt, new Date(now.getTime() - 30 * DAY_MS))
      )
    );
  if (recent.length >= REFERRAL_RULES.maxPerMonth) {
    await tx
      .update(referrals)
      .set({ status: "capped", orderId: order.id })
      .where(eq(referrals.id, ref.id));
    return;
  }
  await tx
    .update(referrals)
    .set({
      status: "qualified",
      orderId: order.id,
      qualifiedAt: now,
      releaseAt: new Date(now.getTime() + REFERRAL_RULES.holdDays * DAY_MS),
      rewardPoints: REFERRAL_RULES.rewardPoints,
    })
    .where(eq(referrals.id, ref.id));
  // Zero-value audit event exposes the pending hold without crediting the balance.
  await appendRewardLedger(tx, {
    userId: ref.referrerUserId,
    points: 0,
    eventType: "referral_pending",
    dedupKey: `referral:${ref.id}:pending`,
    referenceId: order.id,
    note: "Referral qualified; 14-day payment hold.",
  });
}
export async function revokeReferralTx(tx: CommerceTx, orderId: string) {
  const ref = (
    await tx
      .select()
      .from(referrals)
      .where(eq(referrals.orderId, orderId))
      .limit(1)
  )[0];
  if (!ref || !["qualified", "earned"].includes(ref.status)) return;
  await appendRewardLedger(tx, {
    userId: ref.referrerUserId,
    points: ref.status === "earned" ? -ref.rewardPoints : 0,
    eventType: "referral_reversal",
    dedupKey: `referral:${ref.id}:reversal`,
    referenceId: orderId,
    note: "Referral revoked after a refund or dispute.",
  });
  await tx
    .update(referrals)
    .set({ status: "revoked" })
    .where(eq(referrals.id, ref.id));
}
export async function releaseReferralsTx(
  tx: CommerceTx,
  userId: number,
  now: Date,
  verifiedOrderIds: ReadonlySet<string>
) {
  const pending = await tx
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerUserId, userId),
        eq(referrals.status, "qualified")
      )
    );
  for (const ref of pending) {
    // Legacy qualified referrals lack a verified order/hold and are never auto-awarded.
    if (
      !ref.orderId ||
      !ref.releaseAt ||
      ref.releaseAt > now ||
      !verifiedOrderIds.has(ref.orderId)
    )
      continue;
    const order = (
      await tx
        .select()
        .from(commerceOrders)
        .where(eq(commerceOrders.id, ref.orderId))
        .limit(1)
    )[0];
    if (
      !order ||
      order.status !== "paid" ||
      order.refundedCents > 0 ||
      order.productPaidCents <= 0 ||
      !ORDINARY_KINDS.has(order.productKind)
    ) {
      await revokeReferralTx(tx, ref.orderId);
      continue;
    }
    await appendRewardLedger(tx, {
      userId,
      points: ref.rewardPoints,
      eventType: "referral",
      dedupKey: `referral:${ref.id}:earned`,
      referenceId: ref.orderId,
      note: "Qualified referral payment hold completed.",
    });
    await tx
      .update(referrals)
      .set({ status: "earned" })
      .where(eq(referrals.id, ref.id));
  }
  const attributed = await tx
    .select()
    .from(referrals)
    .where(
      and(eq(referrals.referrerUserId, userId), eq(referrals.status, "pending"))
    );
  for (const ref of attributed)
    if (now.getTime() > ref.createdAt.getTime() + 30 * DAY_MS)
      await tx
        .update(referrals)
        .set({ status: "expired" })
        .where(eq(referrals.id, ref.id));
}
export const referralsRouter = router({
  applyCode: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .min(8)
          .max(32)
          .regex(/^[A-Za-z0-9_-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) =>
      commerceTransaction(async tx => {
        const code = (
          await tx
            .select()
            .from(referralCodes)
            .where(eq(referralCodes.code, input.code))
            .limit(1)
        )[0];
        if (!code)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Referral code not found.",
          });
        if (code.userId === ctx.user.id)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot refer yourself.",
          });
        const existing = (
          await tx
            .select()
            .from(referrals)
            .where(eq(referrals.referredUserId, ctx.user.id))
            .limit(1)
        )[0];
        if (existing) {
          if (existing.referralCode === input.code)
            return { applied: true as const, status: existing.status };
          throw new TRPCError({
            code: "CONFLICT",
            message: "A referral has already been attributed to this account.",
          });
        }
        const purchased = await tx
          .select({ id: commerceOrders.id })
          .from(commerceOrders)
          // Conservative new-buyer policy: attribution must precede even an unpaid checkout.
          // This also avoids equal-second timestamp ambiguity in the preserved legacy referral table.
          .where(eq(commerceOrders.userId, ctx.user.id))
          .limit(1);
        const legacy = await tx
          .select({ id: rewardEvents.id })
          .from(rewardEvents)
          .where(
            and(
              eq(rewardEvents.userId, ctx.user.id),
              or(
                eq(rewardEvents.eventType, "purchase"),
                eq(
                  rewardEvents.referenceId,
                  `mission:${ctx.user.id}:first-purchase`
                )
              )
            )
          )
          .limit(1);
        if (purchased.length || legacy.length)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Referral attribution is only available before your first checkout.",
          });
        await tx.insert(referrals).values({
          referrerUserId: code.userId,
          referredUserId: ctx.user.id,
          referralCode: code.code,
          status: "pending",
          createdAt: new Date(),
        });
        return { applied: true as const, status: "pending" as const };
      })
    ),
});
