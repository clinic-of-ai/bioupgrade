import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getProduct } from "../shared/products";
import { getCommerceProvider } from "../shared/commerce-provider";
import { getMarketplaceProduct } from "../shared/marketplace";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { stripe } from "./stripe";
import {
  createInternalOrder,
  attachStripeSession,
  ownedOrders,
  publicOrder,
} from "./commerce";
import { assertEligibleProduct, trustedCheckoutOrigin } from "./commerceRules";
export const checkoutRouter = router({
  createSession: publicProcedure
    .input(
      z.object({
        productId: z.string().min(1).max(128),
        catalog: z.enum(["services", "marketplace"]).default("services"),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product =
        input.catalog === "marketplace"
          ? getMarketplaceProduct(input.productId)
          : getProduct(input.productId);
      if (!product)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      assertEligibleProduct(product, input.catalog);
      if (!ctx.user)
        throw new TRPCError({
          code: ctx.authError ? "SERVICE_UNAVAILABLE" : "UNAUTHORIZED",
          message: ctx.authError
            ? "Account sign-in is unavailable."
            : "Sign in before checkout.",
        });
      const origin = trustedCheckoutOrigin(ctx.req.headers.origin);
      if (getCommerceProvider() === "shopify")
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Shopify is the selected checkout route. Legacy Stripe purchases are not enabled; existing account records are preserved.",
        });
      if (!stripe)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Stripe checkout is unavailable until payment services are configured.",
        });
      const mode =
        product.kind === "membership"
          ? ("subscription" as const)
          : ("payment" as const);
      const amountCents = Math.round(product.amountEur * 100);
      const orderId = await createInternalOrder({
        userId: ctx.user.id,
        productId: product.id,
        productTitle: product.title,
        productKind: product.kind,
        catalog: input.catalog,
        amountCents,
        checkoutMode: mode,
      });
      const metadata = {
        order_id: orderId,
        user_id: String(ctx.user.id),
        product_id: product.id,
        catalog: input.catalog,
      };
      let session;
      try {
        session = await stripe.checkout.sessions.create(
          {
            mode,
            customer_email: ctx.user.email ?? input.email,
            client_reference_id: String(ctx.user.id),
            allow_promotion_codes: true,
            metadata,
            ...(mode === "subscription"
              ? { subscription_data: { metadata } }
              : { payment_intent_data: { metadata } }),
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: amountCents,
                  tax_behavior: "exclusive",
                  ...(mode === "subscription"
                    ? { recurring: { interval: "month" as const } }
                    : {}),
                  product_data: {
                    name: product.title,
                    description: product.description,
                    metadata: { product_id: product.id },
                  },
                },
              },
            ],
            // These params are navigation state only. Neither is evidence of a payment.
            success_url: `${origin}/account?checkout=processing&order=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/account?checkout=cancelled&order=${encodeURIComponent(orderId)}`,
          },
          { idempotencyKey: `checkout:${orderId}` }
        );
      } catch {
        // Keep the created order: network failure can be ambiguous, and must not erase a potentially paid session.
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Checkout could not be started. Please try again later.",
        });
      }
      await attachStripeSession(orderId, ctx.user.id, session.id);
      if (!session.url)
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Stripe did not return a checkout URL.",
        });
      return { url: session.url, orderId };
    }),
  history: protectedProcedure.query(async ({ ctx }) =>
    (await ownedOrders(ctx.user.id)).slice(0, 100).map(publicOrder)
  ),
});
