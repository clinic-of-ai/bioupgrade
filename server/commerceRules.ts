import { TRPCError } from "@trpc/server";
import type { Product } from "../shared/products";
import type { MarketplaceProduct } from "../shared/marketplace";
import { POINTS_PER_EURO } from "../shared/rewards";
export const ORDINARY_KINDS = new Set([
  "field-kit",
  "membership",
  "service",
  "workshop",
  "session",
]);
export function assertEligibleProduct(
  product: Product | MarketplaceProduct,
  catalog: "services" | "marketplace"
) {
  if (
    !ORDINARY_KINDS.has(product.kind) ||
    !Number.isFinite(product.amountEur) ||
    product.amountEur <= 0 ||
    !Number.isSafeInteger(Math.round(product.amountEur * 100))
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "This product is not approved for checkout.",
    });
  }
  const approval = (product as Product & { commerceApproved?: boolean })
    .commerceApproved;
  if (
    catalog === "marketplace" &&
    (!["field-kit", "membership"].includes(product.kind) ||
      !("status" in product) ||
      product.status !== "available" ||
      approval !== true)
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "This product is not approved for checkout.",
    });
  }
  if (
    catalog === "services" &&
    ((product as Product & { checkoutEnabled?: boolean }).checkoutEnabled !==
      true ||
      approval === false)
  )
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "This service requires an agreed scope before checkout.",
    });
}
function normalizeOrigin(value: string): string {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("Not an origin");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      local &&
      process.env.NODE_ENV !== "production"
    )
  )
    throw new Error("HTTPS origin required");
  return url.origin;
}
function checkoutOriginConfiguration(env = process.env) {
  let primary: string | undefined;
  const allowed = new Set<string>();
  try {
    if (env.PUBLIC_APP_URL) {
      primary = normalizeOrigin(env.PUBLIC_APP_URL);
      allowed.add(primary);
    }
    for (const raw of (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map(v => v.trim())
      .filter(Boolean))
      allowed.add(normalizeOrigin(raw));
  } catch {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Trusted application origins are not correctly configured.",
    });
  }
  if (!allowed.size)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "A trusted application origin must be configured before checkout.",
    });
  return { primary, allowed };
}
export function hasValidCheckoutOriginConfiguration(
  env = process.env
): boolean {
  try {
    checkoutOriginConfiguration(env);
    return true;
  } catch {
    return false;
  }
}
export function trustedCheckoutOrigin(
  originHeader: unknown,
  env = process.env
): string {
  const { primary, allowed } = checkoutOriginConfiguration(env);
  if (typeof originHeader === "string") {
    let origin: string;
    try {
      origin = normalizeOrigin(originHeader);
    } catch {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Untrusted checkout origin.",
      });
    }
    if (!allowed.has(origin))
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Untrusted checkout origin.",
      });
    return origin;
  }
  // Never infer from Host or forwarded headers, even behind a proxy.
  if (!primary)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PUBLIC_APP_URL is required when Origin is absent.",
    });
  return primary;
}
export function pointsForProduct(netProductCents: number) {
  if (!Number.isSafeInteger(netProductCents) || netProductCents < 0)
    throw new Error("Invalid paid product amount");
  return Math.floor(netProductCents / 100) * POINTS_PER_EURO;
}
export function retainedProductCents(
  productCents: number,
  refundedCents: number,
  disputed: boolean,
  fullyRefunded = false
) {
  // Conservative partial-refund allocation: refund reduces product first, never invent shipping/tax points.
  return disputed || fullyRefunded
    ? 0
    : Math.max(0, productCents - refundedCents);
}
export const REFERRAL_RULES = {
  rewardPoints: 250,
  holdDays: 14,
  maxPerMonth: 4,
} as const;
export const DAY_MS = 86_400_000;
export function withinAttributionWindow(attributedAt: Date, paidAt: Date) {
  return (
    paidAt.getTime() >= attributedAt.getTime() &&
    paidAt.getTime() <= attributedAt.getTime() + 30 * DAY_MS
  );
}
