import type { Express, Request, Response } from "express";
import { z } from "zod";
import {
  SHOPIFY_API_VERSION,
  SHOPIFY_REFERENCE_DOMAIN,
  type ShopifyCartMutation,
  type ShopifyCartResult,
  type ShopifyCatalogResult,
} from "../shared/shopify";
import {
  ShopifyCartSession,
  hasShopifyMutationOrigin,
  shopifyAllowedOrigins,
  shopifyCartKey,
  type ShopifyEnvironment,
} from "./shopify-cart-session";
import {
  MAX_CART_LINES,
  ShopifyStorefront,
  ShopifyStorefrontError,
  publicShopifyCart,
  readShopifyConfig,
  validateShopifyCheckoutUrl,
  type PrivateShopifyCart,
} from "./shopify-storefront";

const GUEST_MESSAGE =
  "Guest Shopify cart only. These existing store services are separate from the site's educational and quote-only offers. Account orders and Signal Points are not linked; cart activity or a checkout return does not prove payment.";
const CLOSED_MESSAGE =
  "Hosted checkout is closed pending explicit approval of the existing store services. Research materials and unmapped educational or quote-only offers cannot enter this cart.";
const mutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("add"),
      merchandiseId: z
        .string()
        .regex(/^gid:\/\/shopify\/ProductVariant\/[1-9]\d{0,19}$/),
      quantity: z.number().int().min(1).max(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("update"),
      lineId: z.string().regex(/^sl_[A-Za-z0-9_-]{43}$/),
      quantity: z.number().int().min(1).max(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("remove"),
      lineId: z.string().regex(/^sl_[A-Za-z0-9_-]{43}$/),
    })
    .strict(),
  z.object({ action: z.literal("clear") }).strict(),
]);

/** Safe configuration-only readiness. Does NOT attest live Storefront data, stock or payments.
 * Required cart env: SHOPIFY_CART_COOKIE_SECRET (CART_SESSION_SECRET fallback) +
 * SHOPIFY_CART_ALLOWED_ORIGINS, or exact APP_ORIGIN/PUBLIC_APP_URL/TRUSTED_ORIGINS.
 * Checkout additionally requires SHOPIFY_CHECKOUT_ENABLED=true and a nonempty approved-ID subset.
 * Optional: SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION (must be 2026-10),
 * SHOPIFY_STOREFRONT_ENABLED=false. Managed SHOPIFY_STOREFRONT_ACCESS_TOKEN is canonical;
 * self-hosted real SHOPIFY_STOREFRONT_{PUBLIC,PRIVATE}_ACCESS_TOKEN are scoped alternatives.
 */
export function getShopifyConfiguration(env: ShopifyEnvironment = process.env) {
  try {
    const config = readShopifyConfig(env);
    const originsConfigured = shopifyAllowedOrigins(env).length > 0;
    const cartConfigured =
      config.enabled && Boolean(shopifyCartKey(env)) && originsConfigured;
    return {
      status: config.enabled ? ("configured" as const) : ("disabled" as const),
      storeDomain: config.domain,
      apiVersion: config.apiVersion,
      storefrontConfigured: config.enabled,
      cartConfigured,
      checkoutConfigured: cartConfigured && config.checkoutEnabled,
      originsConfigured,
      accessMode: config.privateAccessToken
        ? "private-token"
        : config.publicAccessToken
          ? "public-token"
          : "tokenless",
      connectivityVerified: false as const,
    };
  } catch {
    return {
      status: "unavailable" as const,
      storeDomain: SHOPIFY_REFERENCE_DOMAIN,
      apiVersion: SHOPIFY_API_VERSION,
      storefrontConfigured: false,
      cartConfigured: false,
      checkoutConfigured: false,
      originsConfigured: false,
      accessMode: "unavailable",
      connectivityVerified: false as const,
    };
  }
}
export const getShopifyStatus = getShopifyConfiguration;

export type ShopifyRouteOptions = {
  env?: () => ShopifyEnvironment;
  fetchApi?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
};

type RouteContext = {
  env: ShopifyEnvironment;
  store: ShopifyStorefront;
  session: ShopifyCartSession;
  catalogCache?: { value: ShopifyCatalogResult; expires: number };
  catalogPending?: Promise<ShopifyCatalogResult>;
};

/** Register before SPA/static handlers. Parent owns all framework and provider-selection wiring.
 * No database, Admin, authentication-account, order, payment-event or rewards writes occur here.
 */
export function registerShopifyRoutes(
  app: Express,
  options: ShopifyRouteOptions = {}
): void {
  const now = options.now || Date.now;
  let lastFingerprint = "";
  let lastContext: RouteContext | undefined;
  const buckets = new Map<string, { start: number; count: number }>();
  const locks = new Set<string>();

  function context(): RouteContext {
    const env = { ...(options.env ? options.env() : process.env) };
    const config = readShopifyConfig(env);
    const fingerprint = JSON.stringify([
      config.domain,
      config.enabled,
      config.privateAccessToken,
      config.publicAccessToken,
      config.checkoutEnabled,
      [...config.approvedServiceIds],
      shopifyCartKey(env)?.toString("base64"),
      shopifyAllowedOrigins(env),
    ]);
    if (!lastContext || fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      lastContext = {
        env,
        store: new ShopifyStorefront(
          config,
          options.fetchApi,
          options.timeoutMs
        ),
        session: new ShopifyCartSession(env, config.domain, now),
      };
    }
    return lastContext;
  }

  function headers(res: Response): void {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.vary("Origin");
    res.vary("Cookie");
  }
  function limit(req: Request): void {
    // In-memory best effort only; configure a trusted edge limit for a multiprocess deployment.
    const key = `${req.socket.remoteAddress || "unknown"}:${req.method === "POST" ? "write" : "read"}`;
    const existing = buckets.get(key);
    const entry =
      existing && now() - existing.start < 60_000
        ? existing
        : { start: now(), count: 0 };
    if (!existing && buckets.size >= 1000)
      buckets.delete(buckets.keys().next().value!);
    buckets.set(key, entry);
    entry.count++;
    if (entry.count > (req.method === "POST" ? 20 : 60))
      throw new ShopifyStorefrontError(
        429,
        "RATE_LIMITED",
        "Too many Shopify requests. Wait a minute before trying again."
      );
  }
  function cartConfigured(ctx: RouteContext): boolean {
    return (
      ctx.store.config.enabled &&
      ctx.session.enabled &&
      shopifyAllowedOrigins(ctx.env).length > 0
    );
  }
  function result(
    ctx?: RouteContext,
    cart: PrivateShopifyCart | null = null,
    message?: string,
    warnings: string[] = []
  ): ShopifyCartResult {
    const remoteAvailable = ctx?.catalogCache?.value.status === "connected";
    const cartEnabled = Boolean(ctx && cartConfigured(ctx) && remoteAvailable);
    const checkoutEnabled = Boolean(
      cartEnabled &&
        ctx?.store.config.checkoutEnabled &&
        (!cart ||
          (cart.lines.nodes.length > 0 &&
            cart.lines.nodes.every(line =>
              ctx!.store.config.approvedServiceIds.has(
                line.merchandise.product.id
              )
            )))
    );
    return {
      cart: cart && ctx ? publicShopifyCart(cart, ctx.session, warnings) : null,
      cartEnabled,
      checkoutEnabled,
      message:
        message ||
        `${GUEST_MESSAGE}${checkoutEnabled ? " Totals are estimates; final checkout pricing may change." : ` ${CLOSED_MESSAGE}`}`,
    };
  }
  async function catalog(ctx: RouteContext): Promise<ShopifyCatalogResult> {
    if (ctx.catalogCache && ctx.catalogCache.expires > now())
      return ctx.catalogCache.value;
    if (ctx.catalogPending) return ctx.catalogPending;
    ctx.catalogPending = (async () => {
      let value: ShopifyCatalogResult;
      try {
        if (!ctx.store.config.enabled) {
          value = {
            status: "disabled",
            storeDomain: ctx.store.config.domain,
            updatedAt: null,
            products: [],
            cartEnabled: false,
            checkoutEnabled: false,
            message:
              "This Shopify source is disabled. No store inventory or payment readiness is claimed.",
          };
        } else {
          const products = await ctx.store.catalog();
          const enabled = cartConfigured(ctx);
          value = {
            status: "connected",
            storeDomain: ctx.store.config.domain,
            updatedAt: new Date(now()).toISOString(),
            products,
            cartEnabled: enabled,
            checkoutEnabled: enabled && ctx.store.config.checkoutEnabled,
            message: `${products.length ? "Existing Shopify services retrieved from the Storefront source." : "The Storefront source responded, but no allowlisted services are published to it."} ${GUEST_MESSAGE}${enabled ? "" : " Cart actions require a dedicated cookie secret and explicitly trusted origins."}${ctx.store.config.checkoutEnabled ? "" : ` ${CLOSED_MESSAGE}`}`,
          };
        }
      } catch (error) {
        const safe = safeError(error);
        value = {
          status: "unavailable",
          storeDomain: ctx.store.config.domain,
          updatedAt: null,
          products: [],
          cartEnabled: false,
          checkoutEnabled: false,
          message:
            safe.code === "SHOPIFY_CHANNEL_LOCKED"
              ? safe.message
              : "The Shopify Storefront source is unavailable. No stock or payment readiness is claimed; cart actions are closed.",
        };
      }
      ctx.catalogCache = {
        value,
        expires: now() + (value.status === "connected" ? 30_000 : 10_000),
      };
      return value;
    })();
    try {
      return await ctx.catalogPending;
    } finally {
      ctx.catalogPending = undefined;
    }
  }
  async function requireCart(ctx: RouteContext): Promise<void> {
    if (!cartConfigured(ctx))
      throw new ShopifyStorefrontError(
        503,
        "CART_DISABLED",
        "Guest cart actions require a dedicated server cookie secret and explicitly trusted application origins."
      );
    const source = await catalog(ctx);
    if (source.status !== "connected")
      throw new ShopifyStorefrontError(
        503,
        "SHOPIFY_UNAVAILABLE",
        source.message
      );
  }
  function requireOrigin(req: Request, ctx: RouteContext): void {
    if (!hasShopifyMutationOrigin(req, ctx.env))
      throw new ShopifyStorefrontError(
        403,
        "ORIGIN_REJECTED",
        "This cart action requires an exact trusted application Origin."
      );
  }
  async function readCart(
    req: Request,
    res: Response,
    ctx: RouteContext,
    checkout = false
  ): Promise<PrivateShopifyCart | null> {
    const id = ctx.session.read(req, res);
    if (!id) return null;
    const cart = await ctx.store.cart(id, checkout);
    if (!cart) ctx.session.clear(req, res);
    return cart;
  }
  const safeError = (error: unknown) =>
    error instanceof ShopifyStorefrontError
      ? error
      : new ShopifyStorefrontError(
          503,
          "SHOPIFY_UNAVAILABLE",
          "The Shopify operation is unavailable. No payment has been recorded here."
        );
  function onCartError(
    req: Request,
    res: Response,
    ctx: RouteContext | undefined,
    error: unknown
  ): void {
    const safe = safeError(error);
    if (safe.resetCart && ctx) ctx.session.clear(req, res);
    if (safe.code === "SHOPIFY_UNAVAILABLE" && ctx)
      ctx.catalogCache = undefined;
    // An upstream failure never echoes SDK error text or the private cart identifier.
    const payload = result(ctx, null, safe.message);
    if (safe.code === "SHOPIFY_UNAVAILABLE" || safe.status === 503) {
      payload.cartEnabled = false;
      payload.checkoutEnabled = false;
    }
    if (safe.code === "RATE_LIMITED") res.setHeader("Retry-After", "60");
    res.status(safe.status).json(payload);
  }

  app.get("/api/shopify/catalog", async (req, res) => {
    headers(res);
    try {
      limit(req);
      res.json(await catalog(context()));
    } catch (error) {
      const safe = safeError(error);
      if (safe.status === 429) res.setHeader("Retry-After", "60");
      const payload: ShopifyCatalogResult = {
        status: "unavailable",
        storeDomain: SHOPIFY_REFERENCE_DOMAIN,
        updatedAt: null,
        products: [],
        cartEnabled: false,
        checkoutEnabled: false,
        message: safe.message,
      };
      res.status(safe.status).json(payload);
    }
  });

  app.get("/api/shopify/cart", async (req, res) => {
    headers(res);
    let ctx: RouteContext | undefined;
    try {
      limit(req);
      ctx = context();
      if (!cartConfigured(ctx)) {
        ctx.session.read(req, res);
        res.json(
          result(
            ctx,
            null,
            "Guest cart actions are disabled until a dedicated cookie secret and explicit application origins are configured."
          )
        );
        return;
      }
      await requireCart(ctx);
      const cart = await readCart(req, res, ctx);
      res.json(
        result(
          ctx,
          cart,
          cart
            ? undefined
            : `Your guest Shopify cart is empty or its previous session expired. ${GUEST_MESSAGE}`
        )
      );
    } catch (error) {
      onCartError(req, res, ctx, error);
    }
  });

  app.post("/api/shopify/cart", async (req, res) => {
    headers(res);
    let ctx: RouteContext | undefined;
    let lock: string | undefined;
    let acquiredLock = false;
    try {
      limit(req);
      ctx = context();
      requireOrigin(req, ctx);
      const parsed = mutationSchema.safeParse(req.body);
      if (!parsed.success)
        throw new ShopifyStorefrontError(
          400,
          "CART_INPUT_INVALID",
          "Choose add, update, remove or clear with valid server line handles and integer quantities from 1 to 20."
        );
      const action: ShopifyCartMutation = parsed.data;
      await requireCart(ctx);
      const id = ctx.session.read(req, res);
      // Serialize changes on this process. Do not store raw cart IDs in logs or public state.
      lock = id
        ? ctx.session.lineHandle(id, "mutation-lock")
        : `${req.socket.remoteAddress || "unknown"}:new-cart`;
      if (locks.has(lock))
        throw new ShopifyStorefrontError(
          409,
          "CART_BUSY",
          "Another guest cart action is still in progress. Refresh before trying again."
        );
      locks.add(lock);
      acquiredLock = true;
      let cart = id ? await ctx.store.cart(id) : null;
      if (id && !cart) ctx.session.clear(req, res);
      if (action.action === "clear") {
        let warnings: string[] = [];
        if (cart && cart.lines.nodes.length) {
          const changed = await ctx.store.mutate("remove", {
            cartId: cart.id,
            lineIds: cart.lines.nodes.map(line => line.id),
          });
          cart = changed.cart;
          warnings = changed.warnings;
        }
        if (
          cart &&
          (cart.lines.nodes.length !== 0 || cart.totalQuantity !== 0)
        ) {
          const message =
            "Some services remain in your guest Shopify cart. Refresh and review the actual quantities before continuing; this clear action was not retried.";
          res.json(
            result(ctx, cart, `${message} ${GUEST_MESSAGE}`, [
              ...warnings,
              message,
            ])
          );
          return;
        }
        ctx.session.clear(req, res);
        res.json(
          result(
            ctx,
            null,
            `Your guest Shopify cart has been cleared. ${GUEST_MESSAGE}`
          )
        );
        return;
      }
      let changed: { cart: PrivateShopifyCart; warnings: string[] };
      if (action.action === "add") {
        await ctx.store.availableVariant(action.merchandiseId);
        const quantity =
          (cart?.lines.nodes
            .filter(line => line.merchandise.id === action.merchandiseId)
            .reduce((sum, line) => sum + line.quantity, 0) || 0) +
          action.quantity;
        if (
          quantity > 20 ||
          (cart &&
            cart.lines.nodes.length >= MAX_CART_LINES &&
            !cart.lines.nodes.some(
              line => line.merchandise.id === action.merchandiseId
            ))
        ) {
          throw new ShopifyStorefrontError(
            400,
            "CART_LIMIT",
            "A variant may have at most 20 units and a guest cart at most 20 lines."
          );
        }
        changed = await ctx.store.mutate(cart ? "add" : "create", {
          ...(cart ? { cartId: cart.id } : {}),
          lines: [
            { merchandiseId: action.merchandiseId, quantity: action.quantity },
          ],
        });
      } else {
        if (!cart)
          throw new ShopifyStorefrontError(
            409,
            "CART_EXPIRED",
            "This guest cart is empty or expired. Add an available existing service to start again.",
            true
          );
        const line = cart.lines.nodes.find(
          line => ctx!.session.lineHandle(cart!.id, line.id) === action.lineId
        );
        if (!line)
          throw new ShopifyStorefrontError(
            400,
            "LINE_NOT_OWNED",
            "This line does not belong to the current guest cart."
          );
        if (action.action === "update") {
          const quantity = cart.lines.nodes
            .filter(
              sibling =>
                sibling.id !== line.id &&
                sibling.merchandise.id === line.merchandise.id
            )
            .reduce((sum, sibling) => sum + sibling.quantity, action.quantity);
          if (quantity > 20)
            throw new ShopifyStorefrontError(
              400,
              "CART_LIMIT",
              "A variant may have at most 20 units and a guest cart at most 20 lines."
            );
        }
        changed =
          action.action === "update"
            ? await ctx.store.mutate("update", {
                cartId: cart.id,
                lines: [{ id: line.id, quantity: action.quantity }],
              })
            : await ctx.store.mutate("remove", {
                cartId: cart.id,
                lineIds: [line.id],
              });
      }
      cart = changed.cart;
      ctx.session.write(req, res, cart.id);
      res.json(result(ctx, cart, undefined, changed.warnings));
    } catch (error) {
      onCartError(req, res, ctx, error);
    } finally {
      if (lock && acquiredLock) locks.delete(lock);
    }
  });

  app.post("/api/shopify/checkout", async (req, res) => {
    headers(res);
    let ctx: RouteContext | undefined;
    try {
      limit(req);
      ctx = context();
      requireOrigin(req, ctx);
      if (
        req.body !== undefined &&
        !z.object({}).strict().safeParse(req.body).success
      )
        throw new ShopifyStorefrontError(
          400,
          "CHECKOUT_INPUT_INVALID",
          "Hosted checkout does not accept cart identifiers or buyer details from the browser."
        );
      await requireCart(ctx);
      if (!ctx.store.config.checkoutEnabled)
        throw new ShopifyStorefrontError(
          403,
          "CHECKOUT_CLOSED",
          CLOSED_MESSAGE
        );
      // Refresh ALL bounded lines and checkoutUrl together, immediately before returning the URL.
      const cart = await readCart(req, res, ctx, true);
      if (!cart || !cart.lines.nodes.length)
        throw new ShopifyStorefrontError(
          409,
          "CART_EMPTY",
          "The guest cart is empty or expired. No checkout was opened."
        );
      if (
        !cart.lines.nodes.every(line =>
          ctx!.store.config.approvedServiceIds.has(line.merchandise.product.id)
        )
      )
        throw new ShopifyStorefrontError(
          403,
          "SERVICE_NOT_APPROVED",
          CLOSED_MESSAGE
        );
      const url = validateShopifyCheckoutUrl(
        cart.checkoutUrl,
        ctx.store.config.domain
      );
      res.json({ url }); // Full checkout URL appears ONLY in this explicit, origin-protected POST result.
    } catch (error) {
      const safe = safeError(error);
      if (safe.resetCart && ctx) ctx.session.clear(req, res);
      if (safe.status === 503 && ctx) ctx.catalogCache = undefined;
      if (safe.status === 429) res.setHeader("Retry-After", "60");
      res.status(safe.status).json({ error: safe.code, message: safe.message });
    }
  });
}
