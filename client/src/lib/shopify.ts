import {
  EXISTING_SHOPIFY_SERVICES,
  SHOPIFY_REFERENCE_DOMAIN,
  type ShopifyCart,
  type ShopifyCartLine,
  type ShopifyCartMutation,
  type ShopifyCartResult,
  type ShopifyCatalogResult,
  type ShopifyMoney,
  type ShopifyProduct,
  type ShopifyVariant,
} from "@shared/shopify";

const serviceIds = new Set<string>(
  EXISTING_SHOPIFY_SERVICES.map(service => service.id)
);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isMoney = (value: unknown): value is ShopifyMoney =>
  isRecord(value) &&
  typeof value.amount === "string" &&
  /^\d+(?:\.\d+)?$/.test(value.amount) &&
  Number.isFinite(Number(value.amount)) &&
  typeof value.currencyCode === "string" &&
  /^[A-Z]{3}$/.test(value.currencyCode);
const isVariant = (value: unknown): value is ShopifyVariant =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.availableForSale === "boolean" &&
  isMoney(value.price);
const isProduct = (value: unknown): value is ShopifyProduct =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.handle === "string" &&
  typeof value.productType === "string" &&
  typeof value.description === "string" &&
  typeof value.availableForSale === "boolean" &&
  (value.image === null ||
    (isRecord(value.image) &&
      typeof value.image.url === "string" &&
      (value.image.altText === null ||
        typeof value.image.altText === "string"))) &&
  Array.isArray(value.variants) &&
  value.variants.every(isVariant);
const isCartLine = (value: unknown): value is ShopifyCartLine =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.variantTitle === "string" &&
  typeof value.merchandiseId === "string" &&
  typeof value.productId === "string" &&
  serviceIds.has(value.productId) &&
  typeof value.quantity === "number" &&
  Number.isSafeInteger(value.quantity) &&
  value.quantity > 0 &&
  isMoney(value.price) &&
  isMoney(value.totalAmount);
const isCart = (value: unknown): value is ShopifyCart =>
  isRecord(value) &&
  typeof value.totalQuantity === "number" &&
  Number.isSafeInteger(value.totalQuantity) &&
  value.totalQuantity >= 0 &&
  Array.isArray(value.lines) &&
  value.lines.every(isCartLine) &&
  isMoney(value.subtotalAmount) &&
  isMoney(value.totalAmount) &&
  Array.isArray(value.warnings) &&
  value.warnings.every(warning => typeof warning === "string");
const isCartResult = (value: unknown): value is ShopifyCartResult =>
  isRecord(value) &&
  (value.cart === null || isCart(value.cart)) &&
  typeof value.cartEnabled === "boolean" &&
  typeof value.checkoutEnabled === "boolean" &&
  typeof value.message === "string";
const isCatalogResult = (value: unknown): value is ShopifyCatalogResult =>
  isRecord(value) &&
  ["connected", "unavailable", "disabled"].includes(String(value.status)) &&
  typeof value.storeDomain === "string" &&
  value.storeDomain === SHOPIFY_REFERENCE_DOMAIN &&
  (value.updatedAt === null || typeof value.updatedAt === "string") &&
  Array.isArray(value.products) &&
  value.products.every(isProduct) &&
  typeof value.cartEnabled === "boolean" &&
  typeof value.checkoutEnabled === "boolean" &&
  typeof value.message === "string";

export class ShopifyRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ShopifyRequestError";
  }
}

async function request<T>(
  path: string,
  validate: (value: unknown) => value is T,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(body)
      ? typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : null
      : null;
    throw new ShopifyRequestError(
      message || "Shopify is unavailable. Please refresh and try again.",
      response.status
    );
  }
  if (!validate(body)) {
    throw new ShopifyRequestError(
      "The Shopify response could not be confirmed. Please refresh before continuing.",
      response.status
    );
  }
  return body;
}

/** Guest session ownership stays in the server's HttpOnly cookie, never browser storage. */
export const getShopifyCatalog = (signal?: AbortSignal) =>
  request("/api/shopify/catalog", isCatalogResult, { signal });
export const getShopifyCart = (signal?: AbortSignal) =>
  request("/api/shopify/cart", isCartResult, { signal });
export const mutateShopifyCart = (mutation: ShopifyCartMutation) =>
  request("/api/shopify/cart", isCartResult, {
    method: "POST",
    body: JSON.stringify(mutation),
  });

const secureCartSessionError = () =>
  new ShopifyRequestError(
    "The secure guest-cart cookie session could not be confirmed. Enable cookies for this site, then reload this page before adding again. Do not repeat the previous change; no automatic retry was made.",
    409
  );

/** One client flow, with no storage or private cart capability. An add is not persistent
 * success until an independent same-origin read recovers its opaque lines/quantities.
 * A failed read leaves further adds blocked until the visitor fixes cookies and reloads.
 * API errors are propagated unchanged; neither mutations nor reads are retried here.
 */
export function createShopifyCartFlow(
  dependencies: {
    mutate?: typeof mutateShopifyCart;
    read?: typeof getShopifyCart;
  } = {}
) {
  const mutate = dependencies.mutate ?? mutateShopifyCart;
  const read = dependencies.read ?? getShopifyCart;
  let blocked = false;
  return {
    isBlocked: () => blocked,
    async mutate(mutation: ShopifyCartMutation): Promise<ShopifyCartResult> {
      if (mutation.action !== "add") return mutate(mutation);
      if (blocked) throw secureCartSessionError();
      const changed = await mutate(mutation);
      const expected = changed.cart;
      if (!expected?.lines.length) return changed;
      // A successful write followed by any unconfirmed read must never trigger another create.
      blocked = true;
      const recovered = await read();
      const actual = recovered.cart;
      if (
        !recovered.cartEnabled ||
        !actual ||
        actual.totalQuantity !== expected.totalQuantity ||
        actual.lines.length !== expected.lines.length ||
        !expected.lines.every(line =>
          actual.lines.some(
            item =>
              item.id === line.id &&
              item.merchandiseId === line.merchandiseId &&
              item.productId === line.productId &&
              item.quantity === line.quantity
          )
        )
      )
        throw secureCartSessionError();
      blocked = false;
      return {
        ...recovered,
        cart: {
          ...actual,
          warnings: [...new Set([...expected.warnings, ...actual.warnings])],
        },
      };
    },
  };
}

export function isExistingShopifyService(product: ShopifyProduct): boolean {
  return serviceIds.has(product.id);
}

/** Display only: never calculate cart prices or send monetary amounts to the server. */
export function formatShopifyMoney(money: ShopifyMoney): string {
  if (!isMoney(money)) return "Amount unavailable";
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: money.currencyCode,
    }).format(Number(money.amount));
  } catch {
    return `${money.amount} ${money.currencyCode}`;
  }
}

/** Defence in depth; the server independently refreshes and validates the checkout URL. */
export function guardShopifyCheckoutUrl(value: string): string {
  let url: URL;
  try {
    if (value.length > 4096 || /[\s\\\x00-\x1f]/.test(value)) {
      throw new Error("Invalid checkout URL encoding.");
    }
    url = new URL(value);
  } catch {
    throw new Error("Shopify returned an invalid checkout link.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== SHOPIFY_REFERENCE_DOMAIN ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.hash !== "" ||
    !value.startsWith(`https://${SHOPIFY_REFERENCE_DOMAIN}/`) ||
    url.href !== value ||
    !/^\/(?:cart\/c|checkouts\/cn)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
  ) {
    throw new Error(
      "The checkout link could not be verified for the connected Shopify store."
    );
  }
  const allowedQueryKeys = new Set(["key", "channel", "locale", "lang"]);
  for (const [key, item] of url.searchParams) {
    if (
      !allowedQueryKeys.has(key) ||
      url.searchParams.getAll(key).length !== 1 ||
      !/^[A-Za-z0-9_-]{1,512}$/.test(item)
    ) {
      throw new Error(
        "The Shopify checkout link contains an unverified parameter."
      );
    }
  }
  return url.href;
}

export async function createShopifyCheckoutUrl(): Promise<string> {
  const result = await request(
    "/api/shopify/checkout",
    (value): value is { url: string } =>
      isRecord(value) && typeof value.url === "string",
    { method: "POST", body: JSON.stringify({}) }
  );
  return guardShopifyCheckoutUrl(result.url);
}

export function shopifyErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Shopify is unavailable. Please try again.";
}
