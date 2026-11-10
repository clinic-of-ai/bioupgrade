import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  commerceOrders,
  referrals,
  rewardAccounts,
  rewardEvents,
} from "../drizzle/schema";
import { REWARD_MISSIONS } from "../shared/rewards";
import { commerceTransaction, requireDb } from "./db";
import { ownedOrders, publicOrder } from "./commerce";
import { REFERRAL_RULES } from "./commerceRules";
import { referralCodeTx, releaseReferralsTx } from "./referrals";
import { reconcileKnownOrders } from "./stripe";
import { protectedProcedure, router } from "./_core/trpc";
export async function accountSnapshot(userId: number) {
  try {
    const db = await requireDb();
    const orders = await ownedOrders(userId);
    const activeRefs = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerUserId, userId),
          inArray(referrals.status, ["qualified", "earned"])
        )
      );
    const ids = activeRefs
      .map(ref => ref.orderId)
      .filter((v): v is string => Boolean(v));
    // Private, server-selected referred orders are inspected solely for reward integrity, not exposed to the referrer.
    const referralOrders = ids.length
      ? await db
          .select()
          .from(commerceOrders)
          .where(inArray(commerceOrders.id, ids))
      : [];
    const reconciliationOrders = Array.from(
      new Map(
        [...orders, ...referralOrders].map(order => [order.id, order])
      ).values()
    );
    const verified = await reconcileKnownOrders(reconciliationOrders);
    return await commerceTransaction(async tx => {
      await releaseReferralsTx(tx, userId, new Date(), verified);
      const code = await referralCodeTx(tx, userId);
      const account = (
        await tx
          .select()
          .from(rewardAccounts)
          .where(eq(rewardAccounts.userId, userId))
          .limit(1)
      )[0];
      const events = await tx
        .select()
        .from(rewardEvents)
        .where(eq(rewardEvents.userId, userId))
        .orderBy(desc(rewardEvents.createdAt), desc(rewardEvents.id))
        .limit(100);
      const currentOrders = await tx
        .select()
        .from(commerceOrders)
        .where(eq(commerceOrders.userId, userId))
        .orderBy(desc(commerceOrders.createdAt))
        .limit(100);
      const records = await tx
        .select()
        .from(referrals)
        .where(eq(referrals.referrerUserId, userId))
        .orderBy(desc(referrals.createdAt))
        .limit(100);
      return {
        account: {
          pointsBalance: account?.pointsBalance ?? 0,
          lifetimePoints: account?.lifetimePoints ?? 0,
        },
        events,
        orders: currentOrders.map(publicOrder),
        referral: {
          code,
          records: records.map(ref => ({
            id: ref.id,
            status: ref.status,
            createdAt: ref.createdAt,
            ...(ref.qualifiedAt ? { qualifiedAt: ref.qualifiedAt } : {}),
            rewardPoints: ref.rewardPoints,
            ...(ref.releaseAt ? { releaseAt: ref.releaseAt } : {}),
          })),
          rules: REFERRAL_RULES,
        },
        missions: REWARD_MISSIONS,
      };
    });
  } catch (cause) {
    if (cause instanceof TRPCError) throw cause;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Your account could not be loaded. Please try again later.",
      cause,
    });
  }
}
export const accountRouter = router({
  me: protectedProcedure.query(({ ctx }) => accountSnapshot(ctx.user.id)),
});
