import {
  createGraphQLClient,
  type CustomFetchApi,
  type ClientResponse,
} from "@shopify/graphql-client";
import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { z } from "zod";
import {
  EXISTING_SHOPIFY_SERVICES,
  SHOPIFY_API_VERSION,
  SHOPIFY_REFERENCE_DOMAIN,
  type ShopifyCart,
  type ShopifyProduct,
} from "../shared/shopify";
import {
  isPrivateShopifyCartId,
  type ShopifyCartSession,
  type ShopifyEnvironment,
} from "./shopify-cart-session";

export const SERVICE_PRODUCT_IDS = new Set<string>(
  EXISTING_SHOPIFY_SERVICES.map(service => service.id)
);
export const MAX_CART_LINES = 20;
const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/[1-9]\d{0,19}$/;
const PRODUCT_ID = /^gid:\/\/shopify\/Product\/[1-9]\d{0,19}$/;
const moneySchema = z.object({
  amount: z.string().regex(/^\d{1,12}(?:\.\d{1,6})?$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
});
const text = z.string().max(1000);
const variantSchema = z.object({
  __typename: z.literal("ProductVariant"),
  id: z.string().regex(VARIANT_ID),
  title: text,
  availableForSale: z.boolean(),
  price: moneySchema,
  product: z.object({
    id: z.string().regex(PRODUCT_ID),
    title: text,
    availableForSale: z.boolean(),
  }),
});
const productSchema = z.object({
  __typename: z.literal("Product"),
  id: z.string().regex(PRODUCT_ID),
  title: text,
  handle: z.string().max(300),
  productType: text,
  description: z.string().max(20000),
  availableForSale: z.boolean(),
  featuredImage: z
    .object({ url: z.string().max(2048), altText: text.nullable() })
    .nullable(),
  variants: z.object({
    nodes: z
      .array(
        z.object({
          id: z.string().regex(VARIANT_ID),
          title: text,
          availableForSale: z.boolean(),
          price: moneySchema,
        })
      )
      .max(20),
  }),
});
const cartSchema = z.object({
  id: z.string().refine(isPrivateShopifyCartId),
  totalQuantity: z
    .number()
    .int()
    .min(0)
    .max(MAX_CART_LINES * 20),
  checkoutUrl: z.string().max(4096).optional(),
  cost: z.object({ subtotalAmount: moneySchema, totalAmount: moneySchema }),
  lines: z.object({
    pageInfo: z.object({ hasNextPage: z.boolean() }),
    nodes: z
      .array(
        z.object({
          __typename: z.literal("CartLine"),
          id: z.string().min(1).max(2000),
          quantity: z.number().int().min(1).max(20),
          merchandise: variantSchema,
          cost: z.object({ totalAmount: moneySchema }),
          // Not requested (needs unauthenticated_read_selling_plans); still rejected if ever present.
          sellingPlanAllocation: z
            .object({ sellingPlan: z.object({ id: z.string() }) })
            .nullable()
            .optional(),
        })
      )
      .max(MAX_CART_LINES),
  }),
});
export type PrivateShopifyCart = z.infer<typeof cartSchema>;
export type StorefrontVariant = z.infer<typeof variantSchema>;
export type StorefrontConfig = {
  domain: string;
  apiVersion: typeof SHOPIFY_API_VERSION;
  enabled: boolean;
  publicAccessToken?: string;
  privateAccessToken?: string;
  approvedServiceIds: Set<string>;
  checkoutEnabled: boolean;
};

/** Controlled error messages only; never carry upstream GraphQL text, URLs, IDs, headers or PII. */
export class ShopifyStorefrontError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly resetCart = false
  ) {
    super(message);
  }
}
const unavailable = () =>
  new ShopifyStorefrontError(
    503,
    "SHOPIFY_UNAVAILABLE",
    "The Shopify store is temporarily unavailable. No payment has been recorded here."
  );
const invalidCart = () =>
  new ShopifyStorefrontError(
    409,
    "CART_INVALID",
    "This guest cart is no longer eligible. Start a new cart with an available existing store service.",
    true
  );

export function readShopifyConfig(env: ShopifyEnvironment): StorefrontConfig {
  const domain = env.SHOPIFY_STORE_DOMAIN ?? SHOPIFY_REFERENCE_DOMAIN;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/.test(domain)) {
    throw new ShopifyStorefrontError(
      503,
      "SHOPIFY_CONFIGURATION",
      "Shopify store configuration is unavailable."
    );
  }
  if (
    env.SHOPIFY_API_VERSION !== undefined &&
    env.SHOPIFY_API_VERSION !== SHOPIFY_API_VERSION
  ) {
    throw new ShopifyStorefrontError(
      503,
      "SHOPIFY_CONFIGURATION",
      "Shopify API configuration is unavailable."
    );
  }
  // Approval must be an explicit, nonempty subset. One unknown ID closes the entire checkout gate.
  const rawApprovals = (env.SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const validApprovals =
    rawApprovals.length > 0 &&
    rawApprovals.every(value => SERVICE_PRODUCT_IDS.has(value));
  const approvedServiceIds = new Set(validApprovals ? rawApprovals : []);
  const publicAccessToken =
    env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    env.SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN ||
    undefined;
  const privateAccessToken =
    env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN || undefined;
  for (const token of [publicAccessToken, privateAccessToken]) {
    if (token && (token.length > 512 || /[\s\x00-\x1f]/.test(token)))
      throw unavailable();
  }
  // No Admin token aliases, no client-prefixed or fabricated fallback tokens.
  return {
    domain,
    apiVersion: SHOPIFY_API_VERSION,
    enabled: env.SHOPIFY_STOREFRONT_ENABLED !== "false",
    ...(privateAccessToken
      ? { privateAccessToken }
      : publicAccessToken
        ? { publicAccessToken }
        : {}),
    approvedServiceIds,
    checkoutEnabled: env.SHOPIFY_CHECKOUT_ENABLED === "true" && validApprovals,
  };
}

const MONEY = "amount currencyCode";
const VARIANT = `__typename id title availableForSale price { ${MONEY} } product { id title availableForSale }`;
const CART_FIELDS = `id totalQuantity cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
  lines(first: 20) { pageInfo { hasNextPage } nodes {
    __typename id quantity cost { totalAmount { ${MONEY} } }
    merchandise { ... on ProductVariant { ${VARIANT} } }
  } }`;
/** Closed set of operations. Clients can never submit GraphQL or Admin operations. */
const OPERATIONS = {
  catalog: `query ShopifyExistingServices($ids: [ID!]!) { nodes(ids: $ids) { ... on Product {
    __typename id title handle productType description availableForSale featuredImage { url altText }
    variants(first: 20) { nodes { id title availableForSale price { ${MONEY} } } }
  } } }`,
  variant: `query ShopifyAvailableVariant($id: ID!) { node(id: $id) { ... on ProductVariant { ${VARIANT} } } }`,
  cart: `query ShopifyGuestCart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
  checkout: `query ShopifyFreshCheckout($id: ID!) { cart(id: $id) { ${CART_FIELDS} checkoutUrl } }`,
  create: `mutation ShopifyGuestCartCreate($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } userErrors { code } warnings { code } } }`,
  add: `mutation ShopifyGuestCartAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { code } warnings { code } } }`,
  update: `mutation ShopifyGuestCartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { code } warnings { code } } }`,
  remove: `mutation ShopifyGuestCartRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { code } warnings { code } } }`,
} as const;

export function validatePrivateCart(
  value: unknown,
  expectedId?: string
): PrivateShopifyCart {
  const parsed = cartSchema.safeParse(value);
  if (!parsed.success) throw invalidCart();
  const cart = parsed.data;
  const lineIds = cart.lines.nodes.map(line => line.id);
  if (
    (expectedId && cart.id !== expectedId) ||
    cart.lines.pageInfo.hasNextPage ||
    new Set(lineIds).size !== lineIds.length ||
    cart.totalQuantity !==
      cart.lines.nodes.reduce((sum, line) => sum + line.quantity, 0)
  )
    throw invalidCart();
  const variantQuantities = new Map<string, number>();
  for (const line of cart.lines.nodes) {
    const quantity =
      (variantQuantities.get(line.merchandise.id) || 0) + line.quantity;
    variantQuantities.set(line.merchandise.id, quantity);
    if (
      !SERVICE_PRODUCT_IDS.has(line.merchandise.product.id) ||
      !line.merchandise.availableForSale ||
      !line.merchandise.product.availableForSale ||
      line.sellingPlanAllocation ||
      quantity > 20 ||
      line.cost.totalAmount.currencyCode !==
        cart.cost.totalAmount.currencyCode ||
      line.merchandise.price.currencyCode !== cart.cost.totalAmount.currencyCode
    )
      throw invalidCart();
  }
  if (
    cart.cost.subtotalAmount.currencyCode !== cart.cost.totalAmount.currencyCode
  )
    throw invalidCart();
  return cart;
}

export function publicShopifyCart(
  cart: PrivateShopifyCart,
  session: ShopifyCartSession,
  warnings: string[] = []
): ShopifyCart {
  return {
    totalQuantity: cart.totalQuantity,
    lines: cart.lines.nodes.map(line => ({
      id: session.lineHandle(cart.id, line.id),
      quantity: line.quantity,
      title: line.merchandise.product.title,
      variantTitle: line.merchandise.title,
      merchandiseId: line.merchandise.id,
      productId: line.merchandise.product.id,
      price: line.merchandise.price,
      totalAmount: line.cost.totalAmount,
    })),
    subtotalAmount: cart.cost.subtotalAmount,
    totalAmount: cart.cost.totalAmount,
    warnings,
  };
}

/** Shopify Cart checkout links use /cart/c/:token, or its /checkouts/cn/:token hosted path.
 * No arbitrary page, legacy checkout, port, credential, fragment, URL normalization or redirect parameter.
 */
export function validateShopifyCheckoutUrl(
  value: unknown,
  domain: string
): string {
  if (
    typeof value !== "string" ||
    value.length > 4096 ||
    /[\s\\\x00-\x1f]/.test(value)
  )
    throw invalidCheckout();
  try {
    const url = new URL(value);
    if (
      !value.startsWith(`https://${domain}/`) ||
      url.protocol !== "https:" ||
      url.host !== domain ||
      url.port ||
      url.username ||
      url.password ||
      url.hash ||
      !/^\/(?:cart\/c|checkouts\/cn)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ||
      url.href !== value
    )
      throw invalidCheckout();
    const allowed = new Set(["key", "channel", "locale", "lang"]);
    for (const [key, item] of url.searchParams) {
      if (
        !allowed.has(key) ||
        url.searchParams.getAll(key).length !== 1 ||
        !/^[A-Za-z0-9_-]{1,512}$/.test(item)
      )
        throw invalidCheckout();
    }
    return value;
  } catch {
    throw invalidCheckout();
  }
}
function invalidCheckout() {
  return new ShopifyStorefrontError(
    502,
    "CHECKOUT_URL_INVALID",
    "Shopify did not return an approved hosted checkout link. Checkout remains closed."
  );
}

export class ShopifyStorefront {
  private readonly request: (
    query: string,
    options: {
      variables: Record<string, unknown>;
      retries: number;
      signal: AbortSignal;
    }
  ) => Promise<ClientResponse<unknown>>;
  private active = 0;
  constructor(
    readonly config: StorefrontConfig,
    fetchApi: typeof fetch = globalThis.fetch,
    private readonly timeoutMs = 8000
  ) {
    const endpoint = `https://${config.domain}/api/${config.apiVersion}/graphql.json`;
    const customFetchApi: CustomFetchApi = async (url, init) => {
      if (url !== endpoint || init?.method !== "POST") throw unavailable();
      const response = await fetchApi(url, {
        ...init,
        redirect: "error",
        credentials: "omit",
      });
      // Bound response memory; retain the original signal through consumption.
      const reportedVersion = response.headers.get("x-shopify-api-version");
      if (reportedVersion && reportedVersion !== config.apiVersion) {
        await response.body?.cancel();
        throw unavailable();
      }
      if (Number(response.headers.get("content-length") || "0") > 1024 * 1024) {
        await response.body?.cancel();
        throw unavailable();
      }
      if (!response.body) return response;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 1024 * 1024) throw unavailable();
          chunks.push(value);
        }
      } catch {
        await reader.cancel();
        throw unavailable();
      }
      const body = Buffer.concat(chunks);
      const safeHeaders = new Headers(response.headers);
      safeHeaders.delete("x-bioupgrade-source-error");
      // Preserve HTTP status; this private marker transports only a known controlled diagnosis.
      try {
        const payload: unknown = JSON.parse(body.toString("utf8"));
        const errorList = z
          .object({
            errors: z.array(
              z.object({
                message: z.string(),
                extensions: z.object({ code: z.string() }).optional(),
              })
            ),
          })
          .safeParse(payload);
        if (
          response.status === 400 &&
          errorList.success &&
          errorList.data.errors.some(
            error =>
              error.message === "Online Store channel is locked." &&
              error.extensions?.code === "BAD_REQUEST"
          )
        ) {
          safeHeaders.set("x-bioupgrade-source-error", "channel-locked");
        }
      } catch {
        /* All other upstream diagnostics remain private. */
      }
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: safeHeaders,
      });
    };
    // Never attach a logger: SDK HTTP events can contain request bodies with private cart keys.
    if (config.privateAccessToken || config.publicAccessToken) {
      const client = createStorefrontApiClient({
        storeDomain: config.domain,
        apiVersion: config.apiVersion,
        ...(config.privateAccessToken
          ? { privateAccessToken: config.privateAccessToken }
          : { publicAccessToken: config.publicAccessToken! }),
        retries: 0,
        customFetchApi,
        logger: () => undefined,
      });
      this.request = (query, options) =>
        client.request<unknown>(query, options);
    } else {
      const client = createGraphQLClient({
        url: endpoint,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        retries: 0,
        customFetchApi,
        logger: () => undefined,
      });
      this.request = (query, options) =>
        client.request<unknown>(query, options);
    }
  }

  private async operation(
    name: keyof typeof OPERATIONS,
    variables: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.config.enabled || this.active >= 8) throw unavailable();
    this.active++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Abort + race bounds even a custom transport that ignores AbortSignal. No mutation retries.
      const result = await Promise.race([
        this.request(OPERATIONS[name], {
          variables,
          retries: 0,
          signal: controller.signal,
        }),
        new Promise<never>((_, reject) =>
          controller.signal.addEventListener(
            "abort",
            () => reject(unavailable()),
            { once: true }
          )
        ),
      ]);
      if (
        result.errors?.response?.headers.get("x-bioupgrade-source-error") ===
        "channel-locked"
      ) {
        throw new ShopifyStorefrontError(
          503,
          "SHOPIFY_CHANNEL_LOCKED",
          "The Shopify Online Store channel is locked. This Storefront source cannot currently retrieve services or operate this guest cart."
        );
      }
      if (result.errors || !result.data) throw unavailable();
      return result.data;
    } catch (error) {
      throw error instanceof ShopifyStorefrontError ? error : unavailable();
    } finally {
      clearTimeout(timer);
      this.active--;
    }
  }

  async catalog(): Promise<ShopifyProduct[]> {
    const response = z
      .object({ nodes: z.array(z.unknown()).max(SERVICE_PRODUCT_IDS.size) })
      .safeParse(
        await this.operation("catalog", { ids: [...SERVICE_PRODUCT_IDS] })
      );
    if (!response.success) throw unavailable();
    const products: ShopifyProduct[] = [];
    for (const node of response.data.nodes) {
      if (node === null) continue; // Not published to this Storefront source; do not invent stock.
      const parsed = productSchema.safeParse(node);
      if (!parsed.success || !SERVICE_PRODUCT_IDS.has(parsed.data.id))
        throw unavailable();
      const product = parsed.data;
      let image: ShopifyProduct["image"] = null;
      if (product.featuredImage) {
        try {
          const url = new URL(product.featuredImage.url);
          if (
            url.protocol === "https:" &&
            url.hostname === "cdn.shopify.com" &&
            !url.username &&
            !url.password &&
            !url.port &&
            !url.hash
          )
            image = {
              url: product.featuredImage.url,
              altText: product.featuredImage.altText,
            };
        } catch {
          /* An untrusted image is omitted, not reflected into the public catalogue. */
        }
      }
      products.push({
        id: product.id,
        title: product.title,
        handle: product.handle,
        productType: product.productType,
        description: product.description,
        availableForSale: product.availableForSale,
        image,
        variants: product.variants.nodes,
      });
    }
    if (new Set(products.map(product => product.id)).size !== products.length)
      throw unavailable();
    return products;
  }

  async availableVariant(id: string): Promise<StorefrontVariant> {
    if (!VARIANT_ID.test(id))
      throw new ShopifyStorefrontError(
        400,
        "VARIANT_INVALID",
        "Choose a valid existing store variant."
      );
    const response = z
      .object({ node: variantSchema.nullable() })
      .safeParse(await this.operation("variant", { id }));
    if (
      !response.success ||
      !response.data.node ||
      response.data.node.id !== id ||
      !SERVICE_PRODUCT_IDS.has(response.data.node.product.id) ||
      !response.data.node.availableForSale ||
      !response.data.node.product.availableForSale
    ) {
      throw new ShopifyStorefrontError(
        409,
        "VARIANT_UNAVAILABLE",
        "Only available variants of the four existing store services can enter this guest cart."
      );
    }
    return response.data.node;
  }

  async cart(id: string, checkout = false): Promise<PrivateShopifyCart | null> {
    if (!isPrivateShopifyCartId(id)) throw invalidCart();
    const response = z
      .object({ cart: z.unknown() })
      .safeParse(await this.operation(checkout ? "checkout" : "cart", { id }));
    if (!response.success || response.data.cart === undefined)
      throw unavailable();
    return response.data.cart === null
      ? null
      : validatePrivateCart(response.data.cart, id);
  }

  async mutate(
    action: "create" | "add" | "update" | "remove",
    variables: Record<string, unknown>
  ): Promise<{ cart: PrivateShopifyCart; warnings: string[] }> {
    const key = {
      create: "cartCreate",
      add: "cartLinesAdd",
      update: "cartLinesUpdate",
      remove: "cartLinesRemove",
    }[action];
    const data = await this.operation(action, variables);
    const wrapper = z.record(z.string(), z.unknown()).safeParse(data);
    const payload = z
      .object({
        cart: z.unknown(),
        userErrors: z.array(z.object({ code: z.string().nullable() })).max(250),
        warnings: z.array(z.object({ code: z.string() })).max(250),
      })
      .safeParse(wrapper.success ? wrapper.data[key] : null);
    if (!payload.success) throw unavailable();
    if (payload.data.userErrors.length) {
      throw new ShopifyStorefrontError(
        409,
        "CART_REJECTED",
        "Shopify could not apply this cart change. Refresh the cart before trying again; no payment has been recorded here.",
        payload.data.cart === null
      );
    }
    if (payload.data.cart === null || payload.data.cart === undefined)
      throw invalidCart();
    const cart = validatePrivateCart(
      payload.data.cart,
      typeof variables.cartId === "string" ? variables.cartId : undefined
    );
    // Do not expose arbitrary warnings, fields or messages; they can echo cart IDs or buyer details.
    return {
      cart,
      warnings: payload.data.warnings.length
        ? [
            "Shopify adjusted this cart. Review quantities and estimated totals before checkout.",
          ]
        : [],
    };
  }
}
