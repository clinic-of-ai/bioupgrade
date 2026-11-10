export type CommerceProvider = "stripe" | "shopify";
/** The10November request selects Shopify; legacy Stripe history remains readable. */
export function getCommerceProvider(preference?: unknown): CommerceProvider {
  const configured =
    typeof preference === "string"
      ? preference
      : typeof process !== "undefined"
        ? process.env.COMMERCE_PROVIDER
        : undefined;
  return configured === "stripe" ? "stripe" : "shopify";
}
