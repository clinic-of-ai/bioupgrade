import express from "express";
import type { Request, Response } from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXISTING_SHOPIFY_SERVICES,
  SHOPIFY_REFERENCE_DOMAIN,
} from "../shared/shopify";
import {
  ShopifyCartSession,
  exactShopifyOrigin,
  hasShopifyMutationOrigin,
  isPrivateShopifyCartId,
  shopifyAllowedOrigins,
  shopifyCartKey,
  shopifyCookiePolicy,
  type ShopifyEnvironment,
} from "./shopify-cart-session";
import {
  getShopifyConfiguration,
  registerShopifyRoutes,
} from "./shopify-routes";
import {
  ShopifyStorefront,
  publicShopifyCart,
  readShopifyConfig,
  validatePrivateCart,
  validateShopifyCheckoutUrl,
} from "./shopify-storefront";

// All Shopify requests are fixture transports. Only the isolated Express test server uses loopback HTTP.
const DOMAIN = SHOPIFY_REFERENCE_DOMAIN;
const ORIGIN = "https://app.example.test";
const PRODUCT: string = EXISTING_SHOPIFY_SERVICES[0].id;
const OTHER_PRODUCT = EXISTING_SHOPIFY_SERVICES[1].id;
const VARIANT = "gid://shopify/ProductVariant/123456";
const CART_ID =
  "gid://shopify/Cart/opaque-changing-token?key=fixture-private-cart-key";
const RAW_LINE =
  "gid://shopify/CartLine/fixture-line?cart=opaque-changing-token";
const CHECKOUT = `https://${DOMAIN}/cart/c/opaque-token?key=fixture-checkout-key`;
const SECRET = "fixture-only-shopify-cookie-entropy-0123456789-not-production";
const env = (extra: ShopifyEnvironment = {}): ShopifyEnvironment => ({
  SHOPIFY_CART_COOKIE_SECRET: SECRET,
  SHOPIFY_CART_ALLOWED_ORIGINS: ORIGIN,
  ...extra,
});
const money = { amount: "200.00", currencyCode: "EUR" };
const variant = () => ({
  __typename: "ProductVariant",
  id: VARIANT,
  title: "Default Title",
  availableForSale: true,
  price: money,
  product: {
    id: PRODUCT,
    title: "Existing owner store service",
    availableForSale: true,
  },
});
const product = () => ({
  __typename: "Product",
  id: PRODUCT,
  title: "Existing owner store service",
  handle: "existing-service",
  productType: "Consultation",
  description: "Existing service; not a mapping to the educational source.",
  availableForSale: true,
  featuredImage: {
    url: "https://cdn.shopify.com/fixture-image.png",
    altText: null,
  },
  variants: {
    nodes: [
      {
        id: VARIANT,
        title: "Default Title",
        availableForSale: true,
        price: money,
      },
    ],
  },
});
const cart = () => ({
  id: CART_ID,
  checkoutUrl: CHECKOUT,
  totalQuantity: 1,
  buyerIdentity: { email: "private-fixture-buyer@example.test" },
  cost: { subtotalAmount: money, totalAmount: money },
  lines: {
    pageInfo: { hasNextPage: false },
    nodes: [
      {
        __typename: "CartLine",
        id: RAW_LINE,
        quantity: 1,
        merchandise: variant(),
        cost: { totalAmount: money },
        sellingPlanAllocation: null,
      },
    ],
  },
});
const response = (data: unknown, status = 200) =>
  new globalThis.Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const asFetch = (fn: ReturnType<typeof vi.fn>) => fn as unknown as typeof fetch;
const req = (
  origin: unknown = ORIGIN,
  host = "internal.example.test",
  forwarded?: string
) =>
  ({
    headers: {
      origin,
      host,
      ...(forwarded ? { "x-forwarded-proto": forwarded } : {}),
    },
    protocol: "http",
    method: "POST",
  }) as unknown as Request;
const fixtureSession = () => new ShopifyCartSession(env(), DOMAIN);

const servers = new Set<Server>();
afterEach(async () => {
  vi.restoreAllMocks();
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  servers.clear();
});

async function harness(extra: ShopifyEnvironment = {}) {
  const settings = env(extra);
  let sourceCart: unknown = cart();
  let sourceProduct: unknown = product();
  let sourceVariant: unknown = variant();
  let warning = false;
  let userError = false;
  let badHttp = false;
  const fakeFetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
    if (badHttp) return response(null, 400);
    const body = JSON.parse(String(init?.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    if (body.query.startsWith("query ShopifyExistingServices"))
      return response({ nodes: [sourceProduct] });
    if (body.query.startsWith("query ShopifyAvailableVariant"))
      return response({ node: sourceVariant });
    if (
      body.query.startsWith("query ShopifyGuestCart") ||
      body.query.startsWith("query ShopifyFreshCheckout")
    )
      return response({ cart: sourceCart });
    const key = body.query.includes("cartCreate(")
      ? "cartCreate"
      : body.query.includes("cartLinesAdd(")
        ? "cartLinesAdd"
        : body.query.includes("cartLinesUpdate(")
          ? "cartLinesUpdate"
          : "cartLinesRemove";
    return response({
      [key]: {
        cart: sourceCart,
        userErrors: userError ? [{ code: "INVALID", message: CART_ID }] : [],
        warnings: warning
          ? [
              {
                code: "MERCHANDISE_NOT_ENOUGH_STOCK",
                message: CART_ID,
                target: CART_ID,
              },
            ]
          : [],
      },
    });
  });
  const app = express();
  app.use(express.json({ limit: "2kb" }));
  registerShopifyRoutes(app, {
    env: () => settings,
    fetchApi: asFetch(fakeFetch),
    timeoutMs: 100,
  });
  const server = app.listen(0, "127.0.0.1");
  servers.add(server);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Isolated fixture server missing.");
  const base = `http://127.0.0.1:${address.port}`;
  const cookie = `__Host-bioupgrade_shopify_cart=${fixtureSession().seal(CART_ID)}`;
  return {
    fakeFetch,
    settings,
    cookie,
    setCart: (value: unknown) => {
      sourceCart = value;
    },
    setProduct: (value: unknown) => {
      sourceProduct = value;
    },
    setVariant: (value: unknown) => {
      sourceVariant = value;
    },
    setWarnings: () => {
      warning = true;
    },
    setUserErrors: () => {
      userError = true;
    },
    setHttpError: () => {
      badHttp = true;
    },
    request: async (
      path: string,
      method = "GET",
      body?: unknown,
      customHeaders: Record<string, string> = {}
    ) => {
      const res = await globalThis.fetch(`${base}/api/shopify/${path}`, {
        method,
        headers: {
          ...(method === "POST"
            ? { Origin: ORIGIN, "Content-Type": "application/json" }
            : {}),
          ...customHeaders,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: res.status,
        headers: res.headers,
        json: (await res.json()) as any,
      };
    },
  };
}

function expectPrivateExcluded(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    CART_ID,
    "fixture-private-cart-key",
    CHECKOUT,
    "fixture-checkout-key",
    "private-fixture-buyer",
    "buyerIdentity",
    RAW_LINE,
  ])
    expect(serialized).not.toContain(forbidden);
}

describe("encrypted guest cart sessions and origins", () => {
  it("encrypts and authenticates the complete private cart ID with randomized ciphertext", () => {
    const session = fixtureSession();
    const a = session.seal(CART_ID),
      b = session.seal(CART_ID);
    expect(a).not.toBe(b);
    expect(a).not.toContain("fixture-private");
    expect(session.open(a)).toBe(CART_ID);
    const parts = a.split(".");
    parts[2] = `${parts[2][0] === "A" ? "B" : "A"}${parts[2].slice(1)}`;
    expect(session.open(parts.join("."))).toBeNull();
  });
  it("rejects expired, wrong-key, wrong-store, malformed and oversized cookies", () => {
    let time = 100_000;
    const session = new ShopifyCartSession(env(), DOMAIN, () => time);
    const token = session.seal(CART_ID);
    expect(
      new ShopifyCartSession(
        env({ SHOPIFY_CART_COOKIE_SECRET: `${SECRET}-different` }),
        DOMAIN,
        () => time
      ).open(token)
    ).toBeNull();
    expect(
      new ShopifyCartSession(
        env(),
        "another-shop.myshopify.com",
        () => time
      ).open(token)
    ).toBeNull();
    for (const value of ["v1.a.b.c", "x".repeat(4000), null])
      expect(session.open(value)).toBeNull();
    time += 7 * 24 * 60 * 60 * 1000;
    expect(session.open(token)).toBeNull();
  });
  it("fails closed without dedicated entropy and supports only the documented alias", () => {
    expect(shopifyCartKey({ JWT_SECRET: SECRET })).toBeNull();
    expect(shopifyCartKey({ SHOPIFY_CART_COOKIE_SECRET: "short" })).toBeNull();
    expect(
      shopifyCartKey({
        SHOPIFY_CART_COOKIE_SECRET: "",
        CART_SESSION_SECRET: SECRET,
      })
    ).toBeNull();
    expect(shopifyCartKey({ CART_SESSION_SECRET: SECRET })).not.toBeNull();
    expect(
      shopifyCartKey({
        SHOPIFY_CART_COOKIE_SECRET: `base64:${Buffer.alloc(32, 7).toString("base64")}`,
      })
    ).toHaveLength(32);
    expect(
      shopifyCartKey({ SHOPIFY_CART_COOKIE_SECRET: "base64:invalid" })
    ).toBeNull();
    expect(new ShopifyCartSession({}, DOMAIN).enabled).toBe(false);
  });
  it("keeps cart tokens opaque but requires their complete private key", () => {
    expect(isPrivateShopifyCartId(CART_ID)).toBe(true);
    expect(
      isPrivateShopifyCartId("gid://shopify/Cart/new-format!~?key=fixture-key")
    ).toBe(true);
    for (const id of [
      "gid://shopify/Cart/id",
      "gid://shopify/Cart/id?key=",
      `${CART_ID}&key=duplicate`,
      "https://evil.test/Cart/id?key=secret",
      `${CART_ID}#fragment`,
    ])
      expect(isPrivateShopifyCartId(id)).toBe(false);
  });
  it("binds opaque line handles to both cart and line", () => {
    const session = fixtureSession();
    const handle = session.lineHandle(CART_ID, RAW_LINE);
    expect(handle).toMatch(/^sl_[A-Za-z0-9_-]{43}$/);
    expect(handle).not.toBe(
      session.lineHandle(
        CART_ID.replace("opaque-changing-token", "other"),
        RAW_LINE
      )
    );
    expect(handle).not.toBe(session.lineHandle(CART_ID, `${RAW_LINE}-other`));
  });
  it.each([
    undefined,
    null,
    "null",
    "",
    "https://evil.test",
    `${ORIGIN}/`,
    `${ORIGIN}/path`,
    `${ORIGIN}?x=1`,
    "https://app.example.test@evil.test",
    "http://app.example.test",
    "https://app.example.test:443",
    "https://APP.example.test",
  ])("rejects absent or inexact mutation Origin %s", origin => {
    const request = req();
    (request.headers as Record<string, unknown>).origin = origin;
    expect(hasShopifyMutationOrigin(request, env())).toBe(false);
  });
  it("allows exact explicit HTTPS embeds and validated localhost HTTP origins", () => {
    expect(hasShopifyMutationOrigin(req(), env())).toBe(true);
    expect(
      hasShopifyMutationOrigin(
        req("http://localhost:3000", "localhost:3000"),
        env({ SHOPIFY_CART_ALLOWED_ORIGINS: "http://localhost:3000" })
      )
    ).toBe(true);
    expect(exactShopifyOrigin("https://a.example.test\\evil")).toBeNull();
  });
  it("strict Shopify origins override trusted application origins and malformed config closes all", () => {
    expect(shopifyAllowedOrigins({ APP_ORIGIN: ORIGIN })).toEqual([ORIGIN]);
    expect(
      shopifyAllowedOrigins({
        APP_ORIGIN: ORIGIN,
        SHOPIFY_CART_ALLOWED_ORIGINS: "https://other.example.test",
      })
    ).toEqual(["https://other.example.test"]);
    expect(
      shopifyAllowedOrigins({
        APP_ORIGIN: ORIGIN,
        SHOPIFY_CART_ALLOWED_ORIGINS: "",
      })
    ).toEqual([]);
    expect(
      shopifyAllowedOrigins({
        SHOPIFY_CART_ALLOWED_ORIGINS: `${ORIGIN},garbage`,
      })
    ).toEqual([]);
    expect(hasShopifyMutationOrigin(req(), {})).toBe(false);
  });
  it("uses None/Secure/HttpOnly on embeds even through internal HTTP", () => {
    expect(shopifyCookiePolicy(req(), env())).toMatchObject({
      name: "__Host-bioupgrade_shopify_cart",
      options: { httpOnly: true, secure: true, sameSite: "none", path: "/" },
    });
  });
  it("permits Lax/noSecure only on explicitly allowed local HTTP, never untrusted Host", () => {
    const local = env({
      SHOPIFY_CART_ALLOWED_ORIGINS: "http://localhost:3000",
    });
    expect(
      shopifyCookiePolicy(req("http://localhost:3000", "localhost:3000"), local)
    ).toMatchObject({
      name: "bioupgrade_shopify_cart_local",
      options: { secure: false, sameSite: "lax" },
    });
    const localGet = req(null, "localhost:3000");
    delete localGet.headers.origin;
    expect(shopifyCookiePolicy(localGet, local).options.secure).toBe(false);
    expect(
      shopifyCookiePolicy(
        req("http://localhost:3000", "localhost:3000", "https"),
        local
      ).options.secure
    ).toBe(true);
    expect(
      shopifyCookiePolicy(req("http://localhost:3000", "localhost:3000"), env())
        .options.secure
    ).toBe(true);
    expect(
      shopifyCookiePolicy(
        req("http://localhost:3000", "public.example.test"),
        local
      ).options.secure
    ).toBe(true);
  });
  it("clears a tampered supplied session without rescuing it via a second cookie", () => {
    const res = { clearCookie: vi.fn() } as unknown as Response;
    const request = req();
    request.headers.cookie =
      "__Host-bioupgrade_shopify_cart=tampered; bioupgrade_shopify_cart_local=ignored";
    expect(fixtureSession().read(request, res)).toBeNull();
    expect(res.clearCookie).toHaveBeenCalledOnce();
  });
});

describe("Storefront transport and launch gates", () => {
  it("exports truthful configuration-only readiness without secrets", () => {
    const configured = getShopifyConfiguration(env());
    expect(configured).toMatchObject({
      status: "configured",
      accessMode: "tokenless",
      connectivityVerified: false,
      cartConfigured: true,
      checkoutConfigured: false,
    });
    expect(JSON.stringify(configured)).not.toContain(SECRET);
    expect(getShopifyConfiguration({})).toMatchObject({
      cartConfigured: false,
      checkoutConfigured: false,
    });
    expect(
      getShopifyConfiguration({ SHOPIFY_STORE_DOMAIN: "https://evil.test" })
        .status
    ).toBe("unavailable");
  });
  it.each([
    "https://6v43dx-ck.myshopify.com",
    "evil.test",
    "6v43dx-ck.myshopify.com.evil.test",
    "shop.myshopify.com/path",
    "shop.myshopify.com:443",
    "SHOP.myshopify.com",
    "-shop.myshopify.com",
    "shop.myshopify.com ",
  ])("rejects unsafe domain override %s", domain => {
    expect(() =>
      readShopifyConfig(env({ SHOPIFY_STORE_DOMAIN: domain }))
    ).toThrow();
  });
  it("pins the API version and allows only an explicit approved service subset", () => {
    expect(() =>
      readShopifyConfig(env({ SHOPIFY_API_VERSION: "2025-10" }))
    ).toThrow();
    for (const approvals of [
      "",
      "gid://shopify/Product/999999",
      `${PRODUCT},gid://shopify/Product/999999`,
    ])
      expect(
        readShopifyConfig(
          env({
            SHOPIFY_CHECKOUT_ENABLED: "true",
            SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS: approvals,
          })
        ).checkoutEnabled
      ).toBe(false);
    expect(
      readShopifyConfig(
        env({
          SHOPIFY_CHECKOUT_ENABLED: "TRUE",
          SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS: PRODUCT,
        })
      ).checkoutEnabled
    ).toBe(false);
    expect(
      readShopifyConfig(
        env({
          SHOPIFY_CHECKOUT_ENABLED: "true",
          SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS: PRODUCT,
        })
      ).checkoutEnabled
    ).toBe(true);
  });
  it("uses the official tokenless client with only the exact Storefront endpoint and known IDs", async () => {
    const fake = vi.fn(async () => response({ nodes: [product()] }));
    const products = await new ShopifyStorefront(
      readShopifyConfig(env()),
      asFetch(fake)
    ).catalog();
    expect(products).toHaveLength(1);
    const [url, init] = fake.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://${DOMAIN}/api/2026-10/graphql.json`);
    expect(init).toMatchObject({
      method: "POST",
      redirect: "error",
      credentials: "omit",
    });
    expect(
      new Headers(init.headers).has("x-shopify-storefront-access-token")
    ).toBe(false);
    expect(
      new Headers(init.headers).has("shopify-storefront-private-token")
    ).toBe(false);
    expect(JSON.parse(String(init.body)).variables.ids).toEqual(
      EXISTING_SHOPIFY_SERVICES.map(item => item.id)
    );
    expect(String(init.body)).not.toContain("buyerIdentity");
  });
  it.each(["public", "private"])(
    "uses the Storefront SDK when a real %s fixture token is supplied",
    async mode => {
      const key =
        mode === "public"
          ? "SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN"
          : "SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN";
      const fake = vi.fn(async () => response({ nodes: [] }));
      await new ShopifyStorefront(
        readShopifyConfig(env({ [key]: "fixture-storefront-token" })),
        asFetch(fake)
      ).catalog();
      const [, init] = fake.mock.calls[0] as unknown as [string, RequestInit];
      expect(
        new Headers(init.headers).get(
          mode === "public"
            ? "x-shopify-storefront-access-token"
            : "shopify-storefront-private-token"
        )
      ).toBe("fixture-storefront-token");
      expect(String(init.body)).not.toContain("fixture-storefront-token");
    }
  );
  it("uses the canonical managed Storefront token ahead of the self-hosted public alias", async () => {
    const config = readShopifyConfig(
      env({
        SHOPIFY_STOREFRONT_ACCESS_TOKEN: "fixture-managed-token",
        SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN: "fixture-older-alias",
      })
    );
    expect(config.publicAccessToken).toBe("fixture-managed-token");
    expect(
      getShopifyConfiguration(
        env({ SHOPIFY_STOREFRONT_ACCESS_TOKEN: "fixture-managed-token" })
      ).accessMode
    ).toBe("public-token");
    const fake = vi.fn(async () => response({ nodes: [] }));
    await new ShopifyStorefront(config, asFetch(fake)).catalog();
    const [, init] = fake.mock.calls[0] as unknown as [string, RequestInit];
    expect(
      new Headers(init.headers).get("x-shopify-storefront-access-token")
    ).toBe("fixture-managed-token");
  });
  it("classifies the verified locked Online Store channel without exposing arbitrary diagnostics", async () => {
    const fake = vi.fn(
      async () =>
        new globalThis.Response(
          JSON.stringify({
            errors: [
              {
                message: "Online Store channel is locked.",
                extensions: { code: "BAD_REQUEST" },
              },
            ],
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
    );
    await expect(
      new ShopifyStorefront(readShopifyConfig(env()), asFetch(fake)).catalog()
    ).rejects.toMatchObject({
      code: "SHOPIFY_CHANNEL_LOCKED",
      message:
        "The Shopify Online Store channel is locked. This Storefront source cannot currently retrieve services or operate this guest cart.",
    });
    expect(fake).toHaveBeenCalledOnce();
  });
  it("does not reuse Admin keys as Storefront tokens", () => {
    expect(
      readShopifyConfig(
        env({ SHOPIFY_ADMIN_ACCESS_TOKEN: "fixture-admin-not-used" })
      ).privateAccessToken
    ).toBeUndefined();
  });
  it.each([400, 429, 503])(
    "does not retry cart mutations on HTTP %s",
    async status => {
      const fake = vi.fn(async () => response(null, status));
      await expect(
        new ShopifyStorefront(readShopifyConfig(env()), asFetch(fake)).mutate(
          "create",
          { lines: [{ merchandiseId: VARIANT, quantity: 1 }] }
        )
      ).rejects.toMatchObject({ code: "SHOPIFY_UNAVAILABLE" });
      expect(fake).toHaveBeenCalledOnce();
    }
  );
  it("handles GraphQL errors with partial data without exposing upstream messages", async () => {
    const fake = vi.fn(
      async () =>
        new globalThis.Response(
          JSON.stringify({
            data: { cart: cart() },
            errors: [{ message: CART_ID }],
          }),
          { headers: { "Content-Type": "application/json" } }
        )
    );
    await expect(
      new ShopifyStorefront(readShopifyConfig(env()), asFetch(fake)).cart(
        CART_ID
      )
    ).rejects.toMatchObject({ code: "SHOPIFY_UNAVAILABLE" });
  });
  it("bounds transport duration even if a fixture ignores AbortSignal", async () => {
    const fake = vi.fn(() => new Promise<globalThis.Response>(() => undefined));
    await expect(
      new ShopifyStorefront(
        readShopifyConfig(env()),
        asFetch(fake),
        10
      ).catalog()
    ).rejects.toMatchObject({ code: "SHOPIFY_UNAVAILABLE" });
    expect(fake).toHaveBeenCalledOnce();
  });
  it("rejects oversized responses and silent API-version fallbacks", async () => {
    for (const headers of [
      { "Content-Length": "1048577" },
      { "x-shopify-api-version": "2026-07" },
    ] as Record<string, string>[]) {
      const fake = vi.fn(
        async () =>
          new globalThis.Response(JSON.stringify({ data: { nodes: [] } }), {
            headers: { "Content-Type": "application/json", ...headers },
          })
      );
      await expect(
        new ShopifyStorefront(readShopifyConfig(env()), asFetch(fake)).catalog()
      ).rejects.toMatchObject({ code: "SHOPIFY_UNAVAILABLE" });
    }
  });
  it("rejects unallowlisted, unavailable, partial, duplicate and subscription carts", () => {
    const cases = [
      (value: ReturnType<typeof cart>) => {
        value.lines.nodes[0].merchandise.product.id =
          "gid://shopify/Product/999999";
      },
      (value: ReturnType<typeof cart>) => {
        value.lines.nodes[0].merchandise.availableForSale = false;
      },
      (value: ReturnType<typeof cart>) => {
        value.lines.nodes[0].merchandise.product.availableForSale = false;
      },
      (value: ReturnType<typeof cart>) => {
        value.lines.pageInfo.hasNextPage = true;
      },
      (value: ReturnType<typeof cart>) => {
        value.lines.nodes[0].quantity = 21;
        value.totalQuantity = 21;
      },
      (value: ReturnType<typeof cart>) => {
        value.lines.nodes.push(value.lines.nodes[0]);
        value.totalQuantity = 2;
      },
      (value: ReturnType<typeof cart>) => {
        (value.lines.nodes[0] as any).sellingPlanAllocation = {
          sellingPlan: { id: "gid://shopify/SellingPlan/1" },
        };
      },
      (value: ReturnType<typeof cart>) => {
        value.totalQuantity = 0;
      },
    ];
    for (const modify of cases) {
      const value = cart();
      modify(value);
      expect(() => validatePrivateCart(value)).toThrow();
    }
    expect(() =>
      validatePrivateCart(
        cart(),
        CART_ID.replace("opaque-changing-token", "other-cart")
      )
    ).toThrow();
  });
  it("projects public cart JSON without cart ID, checkout link or buyer details", () => {
    const publicCart = publicShopifyCart(
      validatePrivateCart(cart()),
      fixtureSession()
    );
    expectPrivateExcluded(publicCart);
    expect(publicCart.lines[0].id).toMatch(/^sl_/);
    expect(Object.keys(publicCart).sort()).toEqual([
      "lines",
      "subtotalAmount",
      "totalAmount",
      "totalQuantity",
      "warnings",
    ]);
  });
  it("omits untrusted catalogue image URLs", async () => {
    const value = product();
    value.featuredImage.url = "https://evil.test/image";
    const fake = vi.fn(async () => response({ nodes: [value] }));
    expect(
      (
        await new ShopifyStorefront(
          readShopifyConfig(env()),
          asFetch(fake)
        ).catalog()
      )[0].image
    ).toBeNull();
  });
  it.each([
    CHECKOUT,
    `https://${DOMAIN}/checkouts/cn/fixture-token?key=fixture-key`,
    `https://${DOMAIN}/cart/c/fixture-token`,
  ])("accepts only expected current HTTPS hosted paths %s", url => {
    expect(validateShopifyCheckoutUrl(url, DOMAIN)).toBe(url);
  });
  it.each([
    `http://${DOMAIN}/cart/c/token`,
    `https://${DOMAIN}.evil.test/cart/c/token`,
    `https://${DOMAIN}@evil.test/cart/c/token`,
    `https://user:pass@${DOMAIN}/cart/c/token`,
    `https://${DOMAIN}:443/cart/c/token`,
    `https://${DOMAIN}:444/cart/c/token`,
    `https://${DOMAIN}/cart/c/token#evil`,
    `https://${DOMAIN}/cart/c/token?redirect=https%3A%2F%2Fevil.test`,
    `https://${DOMAIN}/cart/c/token?key=a&key=b`,
    `https://${DOMAIN}/products/product`,
    `https://${DOMAIN}/checkout`,
    `https://${DOMAIN}/checkouts/legacy`,
    `https://${DOMAIN}/cart/c/token/../../products`,
    `https://${DOMAIN}/cart/c/%2Ftoken`,
    `https://${DOMAIN}\\@evil.test/cart/c/token`,
    `https://${DOMAIN}/cart/c/token?key=a%0Ab`,
  ])("rejects unsafe checkout URL %s", url => {
    expect(() => validateShopifyCheckoutUrl(url, DOMAIN)).toThrow();
  });
});

describe("Express Shopify routes (isolated fake Shopify network)", () => {
  it("returns the exact public catalogue contract and caches bounded fixed queries", async () => {
    const h = await harness();
    const a = await h.request("catalog"),
      b = await h.request("catalog");
    expect(a.status).toBe(200);
    expect(a.json.status).toBe("connected");
    expect(a.json.cartEnabled).toBe(true);
    expect(a.json.checkoutEnabled).toBe(false);
    expect(Object.keys(a.json).sort()).toEqual(
      [
        "status",
        "storeDomain",
        "updatedAt",
        "products",
        "cartEnabled",
        "checkoutEnabled",
        "message",
      ].sort()
    );
    expect(a.json).toEqual(b.json);
    expect(h.fakeFetch).toHaveBeenCalledOnce();
    expect(a.headers.get("cache-control")).toContain("no-store");
    expectPrivateExcluded(a.json);
  });
  it("returns honest empty published catalogue without inventing owner services", async () => {
    const h = await harness();
    h.setProduct(null);
    const result = await h.request("catalog");
    expect(result.json.products).toEqual([]);
    expect(result.json.message).toContain("no allowlisted services");
  });
  it("keeps catalogue and carts disabled on remote HTTP400 without fabricating stock", async () => {
    const h = await harness();
    h.setHttpError();
    const catalog = await h.request("catalog");
    expect(catalog.json).toMatchObject({
      status: "unavailable",
      cartEnabled: false,
      checkoutEnabled: false,
      products: [],
    });
    const current = await h.request("cart");
    expect(current.status).toBe(503);
    expect(current.json).toMatchObject({
      cart: null,
      cartEnabled: false,
      checkoutEnabled: false,
    });
    const add = await h.request("cart", "POST", {
      action: "add",
      merchandiseId: VARIANT,
      quantity: 1,
    });
    expect(add.status).toBe(503);
  });
  it("disables cart without dedicated key or trusted origins while preserving catalogue reading", async () => {
    for (const settings of [
      { SHOPIFY_CART_COOKIE_SECRET: "" },
      { SHOPIFY_CART_ALLOWED_ORIGINS: "" },
    ]) {
      const h = await harness(settings);
      const catalogue = await h.request("catalog");
      expect(catalogue.json.products).toHaveLength(1);
      expect(catalogue.json.cartEnabled).toBe(false);
      const current = await h.request("cart");
      expect(current.json.cart).toBeNull();
      expect(current.json.cartEnabled).toBe(false);
      expect(h.fakeFetch).toHaveBeenCalledOnce();
    }
  });
  it("honors the explicit disabled-source switch without networking", async () => {
    const h = await harness({ SHOPIFY_STOREFRONT_ENABLED: "false" });
    expect((await h.request("catalog")).json.status).toBe("disabled");
    expect(h.fakeFetch).not.toHaveBeenCalled();
  });
  it("creates a fixture guest cart and puts the complete private ID only in encrypted HttpOnly cookie", async () => {
    const h = await harness();
    const result = await h.request("cart", "POST", {
      action: "add",
      merchandiseId: VARIANT,
      quantity: 1,
    });
    expect(result.status).toBe(200);
    expect(result.json.cart.totalQuantity).toBe(1);
    expectPrivateExcluded(result.json);
    const cookie = result.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Secure");
    expect(cookie).not.toContain("fixture-private-cart-key");
    expect(result.json.message).toContain(
      "Account orders and Signal Points are not linked"
    );
    expect(h.fakeFetch).toHaveBeenCalledTimes(3); // catalogue, server-validated variant, one mutation
  });
  it("returns the exact cart contract and never fetches checkoutUrl on a GET cart", async () => {
    const h = await harness();
    const result = await h.request("cart", "GET", undefined, {
      Cookie: h.cookie,
    });
    expect(result.status).toBe(200);
    expectPrivateExcluded(result.json);
    expect(Object.keys(result.json).sort()).toEqual(
      ["cart", "cartEnabled", "checkoutEnabled", "message"].sort()
    );
    const query = JSON.parse(
      String((h.fakeFetch.mock.calls[1][1] as RequestInit).body)
    ).query;
    expect(query).not.toContain("checkoutUrl");
    expect(query).not.toContain("buyerIdentity");
  });
  it.each([0, 21, -1, 1.5, "1", null])(
    "rejects invalid quantity %s before Shopify calls",
    async quantity => {
      const h = await harness();
      const result = await h.request("cart", "POST", {
        action: "add",
        merchandiseId: VARIANT,
        quantity,
      });
      expect(result.status).toBe(400);
      expect(h.fakeFetch).not.toHaveBeenCalled();
    }
  );
  it("rejects raw line IDs, buyer details, browser cart IDs and client GraphQL", async () => {
    const h = await harness();
    for (const body of [
      { action: "update", lineId: RAW_LINE, quantity: 1 },
      { action: "add", merchandiseId: VARIANT, quantity: 1, cartId: CART_ID },
      { action: "clear", buyerIdentity: { email: "buyer@example.test" } },
      { query: "mutation Evil" },
    ]) {
      expect((await h.request("cart", "POST", body)).status).toBe(400);
    }
    expect(h.fakeFetch).not.toHaveBeenCalled();
  });
  it("rejects missing/null/untrusted Origin before network activity on both POST routes", async () => {
    const h = await harness();
    for (const origin of ["", "null", "https://evil.test"])
      for (const path of ["cart", "checkout"]) {
        const result = await h.request(
          path,
          "POST",
          path === "cart" ? { action: "clear" } : {},
          { Origin: origin }
        );
        expect(result.status).toBe(403);
      }
    expect(h.fakeFetch).not.toHaveBeenCalled();
  });
  it("rejects a line handle owned by another cart without mutating Shopify", async () => {
    const h = await harness();
    const other = fixtureSession().lineHandle(
      CART_ID.replace("opaque-changing-token", "other"),
      RAW_LINE
    );
    const result = await h.request(
      "cart",
      "POST",
      { action: "remove", lineId: other },
      { Cookie: h.cookie }
    );
    expect(result.status).toBe(400);
    expect(h.fakeFetch).toHaveBeenCalledTimes(2);
  });
  it.each(["update", "remove"])(
    "%s uses the fetched owned line ID rather than trusting browser identifiers",
    async action => {
      const h = await harness();
      const lineId = fixtureSession().lineHandle(CART_ID, RAW_LINE);
      const result = await h.request(
        "cart",
        "POST",
        { action, lineId, ...(action === "update" ? { quantity: 2 } : {}) },
        { Cookie: h.cookie }
      );
      expect(result.status).toBe(200);
      const body = JSON.parse(
        String((h.fakeFetch.mock.calls[2][1] as RequestInit).body)
      );
      expect(body.variables.cartId).toBe(CART_ID);
      expect(
        action === "update"
          ? body.variables.lines[0].id
          : body.variables.lineIds[0]
      ).toBe(RAW_LINE);
      expectPrivateExcluded(result.json);
    }
  );
  it("preserves the actual nonempty cart and cookie when the static remove fixture leaves lines", async () => {
    const h = await harness();
    const result = await h.request(
      "cart",
      "POST",
      { action: "clear" },
      { Cookie: h.cookie }
    );
    expect(result.status).toBe(200);
    expect(result.json.cart.totalQuantity).toBe(1);
    expect(result.json.cart.lines).toHaveLength(1);
    expect(result.json.message).toContain("Some services remain");
    expect(result.json.message).not.toContain("has been cleared");
    expect(result.json.cart.warnings).toEqual([
      expect.stringContaining("Refresh and review"),
    ]);
    expect(result.headers.get("set-cookie")).toBeNull();
    expectPrivateExcluded(result.json);
    const body = JSON.parse(
      String((h.fakeFetch.mock.calls[2][1] as RequestInit).body)
    );
    expect(body.variables.lineIds).toEqual([RAW_LINE]);
  });
  it("rejects research and unavailable variants without cartCreate or cartLinesAdd", async () => {
    const h = await harness();
    const value = variant();
    value.product.id = "gid://shopify/Product/999999";
    h.setVariant(value);
    const result = await h.request("cart", "POST", {
      action: "add",
      merchandiseId: VARIANT,
      quantity: 1,
    });
    expect(result.status).toBe(409);
    expect(h.fakeFetch).toHaveBeenCalledTimes(2);
  });
  it("rejects additive quantity overflow before mutation", async () => {
    const h = await harness();
    const value = cart();
    value.totalQuantity = 20;
    value.lines.nodes[0].quantity = 20;
    h.setCart(value);
    const result = await h.request(
      "cart",
      "POST",
      { action: "add", merchandiseId: VARIANT, quantity: 1 },
      { Cookie: h.cookie }
    );
    expect(result.status).toBe(400);
    expect(h.fakeFetch).toHaveBeenCalledTimes(3);
  });
  it("clears expired or invalid cart sessions with clean empty state and no implicit payment", async () => {
    const h = await harness();
    h.setCart(null);
    const result = await h.request("cart", "GET", undefined, {
      Cookie: h.cookie,
    });
    expect(result.status).toBe(200);
    expect(result.json.cart).toBeNull();
    expect(result.json.message).toContain("expired");
    expect(result.headers.get("set-cookie")).toContain("Expires=");
    const update = await h.request(
      "cart",
      "POST",
      {
        action: "update",
        lineId: fixtureSession().lineHandle(CART_ID, RAW_LINE),
        quantity: 2,
      },
      { Cookie: h.cookie }
    );
    expect(update.status).toBe(409);
    expect(update.json.cart).toBeNull();
  });
  it("clears fetched carts containing nonallowlisted lines before serving any details", async () => {
    const h = await harness();
    const value = cart();
    value.lines.nodes[0].merchandise.product.id =
      "gid://shopify/Product/999999";
    h.setCart(value);
    const result = await h.request("cart", "GET", undefined, {
      Cookie: h.cookie,
    });
    expect(result.status).toBe(409);
    expect(result.json.cart).toBeNull();
    expect(result.headers.get("set-cookie")).toContain("Expires=");
  });
  it("handles upstream userErrors and warnings without reflecting keys or PII", async () => {
    const h = await harness();
    h.setWarnings();
    const warning = await h.request("cart", "POST", {
      action: "add",
      merchandiseId: VARIANT,
      quantity: 1,
    });
    expect(warning.status).toBe(200);
    expect(warning.json.cart.warnings).toEqual([
      "Shopify adjusted this cart. Review quantities and estimated totals before checkout.",
    ]);
    expectPrivateExcluded(warning.json);
    h.setUserErrors();
    const error = await h.request("cart", "POST", {
      action: "add",
      merchandiseId: VARIANT,
      quantity: 1,
    });
    expect(error.status).toBe(409);
    expectPrivateExcluded(error.json);
  });
  it("keeps checkout closed without explicit launch approval and ignores browser claims", async () => {
    const h = await harness();
    expect(
      (await h.request("checkout", "POST", {}, { Cookie: h.cookie })).status
    ).toBe(403);
    expect(
      (
        await h.request(
          "checkout",
          "POST",
          { paid: true, cartId: CART_ID },
          { Cookie: h.cookie }
        )
      ).status
    ).toBe(400);
    expect(h.fakeFetch).toHaveBeenCalledOnce();
  });
  it("refreshes eligible lines and releases the guarded checkout link ONLY on explicit POST", async () => {
    const h = await harness({
      SHOPIFY_CHECKOUT_ENABLED: "true",
      SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS: PRODUCT,
    });
    const before = await h.request("cart", "GET", undefined, {
      Cookie: h.cookie,
    });
    expectPrivateExcluded(before.json);
    expect(before.json.checkoutEnabled).toBe(true);
    const checkout = await h.request(
      "checkout",
      "POST",
      {},
      { Cookie: h.cookie }
    );
    expect(checkout.status).toBe(200);
    expect(checkout.json).toEqual({ url: CHECKOUT });
    const query = JSON.parse(
      String((h.fakeFetch.mock.calls[2][1] as RequestInit).body)
    ).query;
    expect(query).toContain("ShopifyFreshCheckout");
    expect(query).toContain("checkoutUrl");
    expect(query).toContain("availableForSale");
    expect(query).not.toContain("buyerIdentity");
  });
  it("requires approved IDs to cover every refreshed line", async () => {
    const h = await harness({
      SHOPIFY_CHECKOUT_ENABLED: "true",
      SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS: PRODUCT,
    });
    const value = cart();
    value.lines.nodes[0].merchandise.product.id = OTHER_PRODUCT;
    h.setCart(value);
    const checkout = await h.request(
      "checkout",
      "POST",
      {},
      { Cookie: h.cookie }
    );
    expect(checkout.status).toBe(403);
    expect(checkout.json.url).toBeUndefined();
    expect(
      (await h.request("cart", "GET", undefined, { Cookie: h.cookie })).json
        .checkoutEnabled
    ).toBe(false);
  });
  it("fails checkout closed when current cart becomes unavailable or checkout domain is evil", async () => {
    const h = await harness({
      SHOPIFY_CHECKOUT_ENABLED: "true",
      SHOPIFY_APPROVED_SERVICE_PRODUCT_IDS: PRODUCT,
    });
    const unavailable = cart();
    unavailable.lines.nodes[0].merchandise.availableForSale = false;
    h.setCart(unavailable);
    expect(
      (await h.request("checkout", "POST", {}, { Cookie: h.cookie })).status
    ).toBe(409);
    const evil = cart();
    evil.checkoutUrl = "https://evil.test/cart/c/token";
    h.setCart(evil);
    const checkout = await h.request(
      "checkout",
      "POST",
      {},
      { Cookie: h.cookie }
    );
    expect(checkout.status).toBe(502);
    expect(checkout.json.url).toBeUndefined();
    expectPrivateExcluded(checkout.json);
  });
  it("limits repeated mutation requests without auto-retries or database writes", async () => {
    const h = await harness();
    for (let i = 0; i < 20; i++)
      expect(
        (await h.request("cart", "POST", { action: "clear" })).status
      ).toBe(200);
    const limited = await h.request("cart", "POST", { action: "clear" });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(h.fakeFetch).toHaveBeenCalledOnce();
  });
});
