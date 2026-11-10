import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { productInterests } from "../drizzle/schema";
import { getMarketplaceProduct } from "../shared/marketplace";
import { commerceTransaction, requireDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
export const interestRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const records = await db
      .select({
        productId: productInterests.productId,
        createdAt: productInterests.createdAt,
      })
      .from(productInterests)
      .where(eq(productInterests.userId, ctx.user.id))
      .limit(25);
    return records.map(record => ({
      ...record,
      title: getMarketplaceProduct(record.productId)?.title ?? record.productId,
    }));
  }),
  leave: protectedProcedure
    .input(z.object({ productId: z.string().min(1).max(128) }).strict())
    .mutation(async ({ ctx, input }) =>
      commerceTransaction(async tx => {
        await tx
          .delete(productInterests)
          .where(
            and(
              eq(productInterests.userId, ctx.user.id),
              eq(productInterests.productId, input.productId)
            )
          );
        return { removed: true as const, productId: input.productId };
      })
    ),
  join: protectedProcedure
    .input(
      z
        .object({
          productId: z.string().min(1).max(128),
          consent: z.literal(true),
        })
        .strict()
    )
    .mutation(async ({ ctx, input }) => {
      if (!getMarketplaceProduct(input.productId))
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      return commerceTransaction(async tx => {
        const existing = await tx
          .select({ id: productInterests.id })
          .from(productInterests)
          .where(
            and(
              eq(productInterests.userId, ctx.user.id),
              eq(productInterests.productId, input.productId)
            )
          )
          .limit(1);
        if (existing.length)
          return {
            joined: true as const,
            alreadyJoined: true,
            productId: input.productId,
          };
        const count = await tx
          .select({ id: productInterests.id })
          .from(productInterests)
          .where(eq(productInterests.userId, ctx.user.id))
          .limit(25);
        if (count.length >= 25)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You can register interest in at most 25 products.",
          });
        await tx.insert(productInterests).values({
          userId: ctx.user.id,
          productId: input.productId,
          consentVersion: "interest-v1",
          createdAt: new Date(),
        });
        return {
          joined: true as const,
          alreadyJoined: false,
          productId: input.productId,
        };
      });
    }),
});
