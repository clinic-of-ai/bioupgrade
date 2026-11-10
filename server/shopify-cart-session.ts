import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { parse } from "cookie";
import type { CookieOptions, Request, Response } from "express";

export type ShopifyEnvironment = Record<string, string | undefined>;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const SECURE_COOKIE = "__Host-bioupgrade_shopify_cart";
const LOCAL_COOKIE = "bioupgrade_shopify_cart_local";

/** Explicit configuration only; unlike general authentication, no Host fallback. */
export function exactShopifyOrigin(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || /[\s\\]/.test(value))
    return null;
  try {
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      url.origin !== value
    )
      return null;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function shopifyAllowedOrigins(env: ShopifyEnvironment): string[] {
  // A supplied Shopify list overrides, rather than widens, application origins.
  const raw =
    env.SHOPIFY_CART_ALLOWED_ORIGINS !== undefined
      ? env.SHOPIFY_CART_ALLOWED_ORIGINS.split(",")
      : [
          env.APP_ORIGIN || env.PUBLIC_APP_URL || "",
          ...(env.TRUSTED_ORIGINS || "").split(","),
        ];
  const values = raw.map(value => value.trim()).filter(Boolean);
  if (!values.length || values.some(value => !exactShopifyOrigin(value)))
    return [];
  return [...new Set(values)];
}

export function hasShopifyMutationOrigin(
  req: Request,
  env: ShopifyEnvironment
): boolean {
  const origin = exactShopifyOrigin(req.headers.origin);
  return origin !== null && shopifyAllowedOrigins(env).includes(origin);
}

export function shopifyCookiePolicy(
  req: Request,
  env: ShopifyEnvironment
): { name: string; options: CookieOptions } {
  let local = false;
  const allowed = shopifyAllowedOrigins(env);
  const requestOrigin = exactShopifyOrigin(req.headers.origin);
  // A GET without Origin can use explicit local configuration, never inferred Host alone.
  const candidates = requestOrigin
    ? allowed.includes(requestOrigin)
      ? [requestOrigin]
      : []
    : allowed;
  const forwarded = req.headers["x-forwarded-proto"];
  const forwardedHttps = (
    Array.isArray(forwarded) ? forwarded.join(",") : forwarded || ""
  )
    .split(",")
    .some(value => value.trim().toLowerCase() === "https");
  if (req.protocol === "http" && !forwardedHttps) {
    local = candidates.some(origin => {
      const url = new URL(origin);
      return (
        url.protocol === "http:" &&
        url.host === req.headers.host &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      );
    });
  }
  return {
    name: local ? LOCAL_COOKIE : SECURE_COOKIE,
    options: {
      httpOnly: true,
      path: "/",
      sameSite: local ? "lax" : "none",
      secure: !local,
    },
  };
}

/** SHOPIFY_CART_COOKIE_SECRET is dedicated server-only entropy (at least 32 UTF-8 bytes).
 * CART_SESSION_SECRET is a supported fallback alias; JWT/authentication keys are NEVER reused.
 * Prefer base64:<32-byte random key encoded as base64>. Changing the key drops existing carts.
 */
export function shopifyCartKey(env: ShopifyEnvironment): Buffer | null {
  const secret = env.SHOPIFY_CART_COOKIE_SECRET ?? env.CART_SESSION_SECRET;
  if (!secret || secret.length > 512) return null;
  if (secret.startsWith("base64:")) {
    const encoded = secret.slice(7);
    if (!/^[A-Za-z0-9+/]{43}=$/.test(encoded)) return null;
    const key = Buffer.from(encoded, "base64");
    return key.length === 32 && key.toString("base64") === encoded ? key : null;
  }
  if (Buffer.byteLength(secret, "utf8") < 32) return null;
  return createHash("sha256").update(secret).digest();
}

/** Tokens are deliberately treated as opaque; Shopify may change cart token format. */
export function isPrivateShopifyCartId(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2000 ||
    /[\s\x00-\x1f]/.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "gid:" &&
      url.hostname === "shopify" &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith("/Cart/") &&
      url.pathname.length > 6 &&
      !url.hash &&
      url.searchParams.getAll("key").length === 1 &&
      Boolean(url.searchParams.get("key"))
    );
  } catch {
    return false;
  }
}

export class ShopifyCartSession {
  readonly enabled: boolean;
  private readonly key: Buffer | null;
  private readonly aad: Buffer;
  constructor(
    private readonly env: ShopifyEnvironment,
    domain: string,
    private readonly now = Date.now
  ) {
    this.key = shopifyCartKey(env);
    this.enabled = Boolean(this.key);
    this.aad = Buffer.from(`bioupgrade-shopify-cart:v1:${domain}`);
  }

  seal(cartId: string): string {
    if (!this.key || !isPrivateShopifyCartId(cartId))
      throw new Error("Cart session unavailable.");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(this.aad);
    const payload = JSON.stringify({
      id: cartId,
      expires: this.now() + MAX_AGE,
    });
    const encrypted = Buffer.concat([
      cipher.update(payload, "utf8"),
      cipher.final(),
    ]);
    return [
      "v1",
      iv.toString("base64url"),
      encrypted.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
    ].join(".");
  }

  open(value: unknown): string | null {
    if (!this.key || typeof value !== "string" || value.length > 3500)
      return null;
    try {
      if (!/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))
        return null;
      const [, ivText, payloadText, tagText] = value.split(".");
      const iv = Buffer.from(ivText, "base64url"),
        tag = Buffer.from(tagText, "base64url");
      if (iv.length !== 12 || tag.length !== 16) return null;
      const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
      decipher.setAAD(this.aad);
      decipher.setAuthTag(tag);
      const data: unknown = JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(payloadText, "base64url")),
          decipher.final(),
        ]).toString("utf8")
      );
      if (!data || typeof data !== "object") return null;
      const record = data as { id?: unknown; expires?: unknown };
      if (
        !isPrivateShopifyCartId(record.id) ||
        typeof record.expires !== "number" ||
        !Number.isSafeInteger(record.expires) ||
        record.expires <= this.now() ||
        record.expires > this.now() + MAX_AGE
      )
        return null;
      return record.id;
    } catch {
      return null;
    }
  }

  read(req: Request, res: Response): string | null {
    const policy = shopifyCookiePolicy(req, this.env);
    let value: string | undefined;
    try {
      value = parse(req.headers.cookie || "")[policy.name];
    } catch {
      this.clear(req, res);
      return null;
    }
    const cartId = this.open(value);
    if (value && !cartId) this.clear(req, res);
    return cartId;
  }

  write(req: Request, res: Response, cartId: string): void {
    const policy = shopifyCookiePolicy(req, this.env);
    res.cookie(policy.name, this.seal(cartId), {
      ...policy.options,
      maxAge: MAX_AGE,
    });
  }

  clear(req: Request, res: Response): void {
    const policy = shopifyCookiePolicy(req, this.env);
    res.clearCookie(policy.name, policy.options);
  }

  /** Public stable line handles bind both the full private cart and its Shopify line ID. */
  lineHandle(cartId: string, lineId: string): string {
    if (!this.key) throw new Error("Cart session unavailable.");
    return `sl_${createHmac("sha256", this.key).update(this.aad).update("\0").update(cartId).update("\0").update(lineId).digest("base64url")}`;
  }
}
