import express from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXISTING_SHOPIFY_SERVICES,
  SHOPIFY_REFERENCE_DOMAIN,
  type ShopifyCartMutation,
  type ShopifyCartResult,
} from "../shared/shopify";
import { registerShopifyRoutes } from "./shopify-routes";
import { ShopifyCartSession } from "./shopify-cart-session";
import {
  createShopifyCartFlow,
  ShopifyRequestError,
} from "../client/src/lib/shopify";

// Transport is entirely stateful fixtures. The only HTTP is an isolated loopback
// Express server. These jars model persistence, not acceptance of browser cookie policy.
const httpFetch = globalThis.fetch;
const ORIGIN = "https://fixture-app.example.test";
const SECRET = "fixture-only-cart-regression-key-0123456789-not-production";
const VARIANT = "gid://shopify/ProductVariant/111111";
const OTHER_VARIANT = "gid://shopify/ProductVariant/222222";
const PRIVATE_ID =
  "gid://shopify/Cart/fixture-seeded?key=fixture-only-private-seeded";
const RAW_LINE = "gid://shopify/CartLine/fixture-seeded-line";
const settings = {
  SHOPIFY_CART_COOKIE_SECRET: SECRET,
  SHOPIFY_CART_ALLOWED_ORIGINS: ORIGIN,
};
const session = () =>
  new ShopifyCartSession(settings, SHOPIFY_REFERENCE_DOMAIN);
const money = (quantity: number) => ({
  amount: (quantity * 10).toFixed(2),
  currencyCode: "EUR",
});
const variant = (id = VARIANT) => ({
  __typename: "ProductVariant" as const,
  id,
  title: "Fixture option",
  availableForSale: true,
  price: money(1),
  product: {
    id: EXISTING_SHOPIFY_SERVICES[0].id,
    title: "Fixture existing service",
    availableForSale: true,
  },
});
const line = (id = RAW_LINE, quantity = 1, merchandiseId = VARIANT) => ({
  __typename: "CartLine" as const,
  id,
  quantity,
  merchandise: variant(merchandiseId),
  cost: { totalAmount: money(quantity) },
  sellingPlanAllocation: null,
});
const sourceCart = (nodes = [line()], id = PRIVATE_ID) => {
  const quantity = nodes.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id,
    totalQuantity: quantity,
    buyerIdentity: { email: "fixture-private-buyer@example.test" },
    cost: { subtotalAmount: money(quantity), totalAmount: money(quantity) },
    lines: { pageInfo: { hasNextPage: false }, nodes },
  };
};
type FixtureCart = ReturnType<typeof sourceCart>;
type Operation = "create" | "add" | "update" | "remove";
const servers = new Set<Server>();
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  servers.clear();
});

async function fixtureHarness(seed?: FixtureCart) {
  const carts = new Map<string, FixtureCart>();
  if (seed) carts.set(seed.id, structuredClone(seed));
  const writes: Operation[] = [];
  let lineSequence = 0;
  let createSequence = 0;
  let partialRemove = false;
  let rejectRemove = false;
  let warnings = false;
  let failReadback = false;
  let failNextRead = false;
  let invalidUpdateResponse = false;
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify({ data }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  const transport = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const { query, variables } = JSON.parse(String(init?.body)) as {
      query: string;
      variables: {
        id?: string;
        cartId?: string;
        lines?: { id?: string; merchandiseId?: string; quantity: number }[];
        lineIds?: string[];
      };
    };
    if (query.startsWith("query ShopifyExistingServices"))
      return json({
        nodes: [
          {
            __typename: "Product",
            ...variant().product,
            handle: "fixture-existing-service",
            productType: "Consultation",
            description: "Fixture only; no service mapping claimed.",
            featuredImage: null,
            variants: {
              nodes: [VARIANT, OTHER_VARIANT].map(id => ({
                id,
                title: "Fixture option",
                availableForSale: true,
                price: money(1),
              })),
            },
          },
        ],
      });
    if (query.startsWith("query ShopifyAvailableVariant"))
      return json({ node: variant(variables.id) });
    if (query.startsWith("query ShopifyGuestCart")) {
      if (failNextRead) {
        failNextRead = false;
        return json(null, 503);
      }
      return json({ cart: carts.get(variables.id!) ?? null });
    }
    const operation: Operation = query.includes("cartCreate(")
      ? "create"
      : query.includes("cartLinesAdd(")
        ? "add"
        : query.includes("cartLinesUpdate(")
          ? "update"
          : "remove";
    writes.push(operation);
    const key = {
      create: "cartCreate",
      add: "cartLinesAdd",
      update: "cartLinesUpdate",
      remove: "cartLinesRemove",
    }[operation];
    let current =
      operation === "create"
        ? sourceCart(
            [],
            `gid://shopify/Cart/fixture-created-${++createSequence}?key=fixture-only-private-${createSequence}`
          )
        : structuredClone(carts.get(variables.cartId!)!);
    const rejected = operation === "remove" && rejectRemove;
    if (!rejected) {
      let nodes = current.lines.nodes;
      if (operation === "create" || operation === "add") {
        for (const incoming of variables.lines!) {
          const existing = nodes.find(
            item => item.merchandise.id === incoming.merchandiseId
          );
          if (existing) existing.quantity += incoming.quantity;
          else
            nodes.push(
              line(
                `gid://shopify/CartLine/fixture-${++lineSequence}`,
                incoming.quantity,
                incoming.merchandiseId
              )
            );
        }
      } else if (operation === "update") {
        for (const incoming of variables.lines!) {
          const owned = nodes.find(item => item.id === incoming.id)!;
          owned.quantity = incoming.quantity + (invalidUpdateResponse ? 1 : 0);
        }
      } else {
        nodes = nodes.filter(item => !variables.lineIds!.includes(item.id));
        // Simulate an authoritative partial removal, including a still-owned valid line.
        if (partialRemove && !nodes.length && current.lines.nodes.length)
          nodes = [current.lines.nodes.at(-1)!];
      }
      current = sourceCart(
        nodes.map(item => ({
          ...item,
          cost: { totalAmount: money(item.quantity) },
        })),
        current.id
      );
      carts.set(current.id, structuredClone(current));
      if (failReadback) failNextRead = true;
    }
    return json({
      [key]: {
        cart: current,
        userErrors: rejected ? [{ code: "INVALID", message: current.id }] : [],
        warnings: warnings ? [{ code: "ADJUSTED", message: current.id }] : [],
      },
    });
  });
  const app = express();
  app.use(express.json({ limit: "2kb" }));
  registerShopifyRoutes(app, {
    env: () => settings,
    fetchApi: transport as unknown as typeof fetch,
    timeoutMs: 1000,
  });
  const server = app.listen(0, "127.0.0.1");
  servers.add(server);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No fixture server.");
  const base = `http://127.0.0.1:${address.port}`;
  const send = (path: string, init: RequestInit = {}, cookie?: string) => {
    const headers = new Headers(init.headers);
    if (init.method === "POST") {
      headers.set("Origin", ORIGIN);
      if (!headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");
    }
    if (cookie) headers.set("Cookie", cookie);
    return httpFetch(`${base}${path}`, { ...init, headers });
  };
  return {
    writes,
    transport,
    carts,
    setPartialRemove: () => {
      partialRemove = true;
    },
    setRejectRemove: () => {
      rejectRemove = true;
    },
    setWarnings: () => {
      warnings = true;
    },
    setFailReadback: () => {
      failReadback = true;
    },
    setInvalidUpdateResponse: () => {
      invalidUpdateResponse = true;
    },
    request: async (
      mutation?: ShopifyCartMutation,
      cookie = seed
        ? `__Host-bioupgrade_shopify_cart=${session().seal(seed.id)}`
        : undefined
    ) => {
      const response = await send(
        "/api/shopify/cart",
        mutation ? { method: "POST", body: JSON.stringify(mutation) } : {},
        cookie
      );
      return {
        status: response.status,
        headers: response.headers,
        json: (await response.json()) as ShopifyCartResult,
      };
    },
    jar: (persist: boolean) => {
      let cookie: string | undefined;
      const fetch = vi.fn(async (path: string, init: RequestInit) => {
        expect(path).toBe("/api/shopify/cart");
        expect(init.credentials).toBe("same-origin");
        expect(init.cache).toBe("no-store");
        const response = await send(path, init, cookie);
        const setCookie = response.headers.get("set-cookie");
        if (persist && setCookie) {
          cookie = setCookie.includes("Expires=Thu, 01 Jan 1970")
            ? undefined
            : setCookie.split(";", 1)[0];
        }
        return response;
      });
      return { fetch, cookie: () => cookie };
    },
  };
}
function privateExcluded(value: unknown) {
  const body = JSON.stringify(value);
  for (const secret of [
    "gid://shopify/Cart/",
    "gid://shopify/CartLine/",
    "fixture-only-private",
    "fixture-private-buyer",
    "buyerIdentity",
    "checkoutUrl",
  ])
    expect(body).not.toContain(secret);
}

describe("F1 stateful clear outcomes", () => {
  it("expires the cookie only after the provider actually returns zero lines and quantity", async () => {
    const h = await fixtureHarness(
      sourceCart([line(), line(`${RAW_LINE}-sibling`, 2)])
    );
    const result = await h.request({ action: "clear" });
    expect(result.status).toBe(200);
    expect(result.json.cart).toBeNull();
    expect(result.json.message).toContain("has been cleared");
    expect(result.headers.get("set-cookie")).toContain(
      "Expires=Thu, 01 Jan 1970"
    );
    expect(h.carts.get(PRIVATE_ID)?.totalQuantity).toBe(0);
    expect(h.carts.get(PRIVATE_ID)?.lines.nodes).toEqual([]);
    expect(h.writes).toEqual(["remove"]);
    privateExcluded(result.json);
  });
  it("keeps cookie ownership and returned lines/warnings for an authoritative partial clear", async () => {
    const h = await fixtureHarness(
      sourceCart([line(), line(`${RAW_LINE}-sibling`, 2)])
    );
    h.setPartialRemove();
    h.setWarnings();
    const result = await h.request({ action: "clear" });
    expect(result.status).toBe(200);
    expect(result.json.cart?.totalQuantity).toBe(2);
    expect(result.json.cart?.lines).toHaveLength(1);
    expect(result.json.cart?.lines[0].quantity).toBe(2);
    expect(result.json.cart?.warnings).toEqual([
      "Shopify adjusted this cart. Review quantities and estimated totals before checkout.",
      expect.stringContaining("Refresh and review"),
    ]);
    expect(result.json.message).toContain("was not retried");
    expect(result.json.message).not.toContain("has been cleared");
    expect(result.headers.get("set-cookie")).toBeNull();
    expect(h.carts.get(PRIVATE_ID)?.totalQuantity).toBe(2);
    const read = await h.request();
    expect(read.json.cart?.lines).toEqual(result.json.cart?.lines);
    expect(h.writes).toEqual(["remove"]);
    privateExcluded(result.json);
  });
  it("preserves a valid cookie and unchanged provider cart on remove userErrors, with no retry", async () => {
    const h = await fixtureHarness(sourceCart());
    h.setRejectRemove();
    const result = await h.request({ action: "clear" });
    expect(result.status).toBe(409);
    expect(result.json.cart).toBeNull();
    expect(result.json.message).toContain("could not apply");
    expect(result.json.message).not.toContain("has been cleared");
    expect(result.headers.get("set-cookie")).toBeNull();
    expect(h.carts.get(PRIVATE_ID)?.totalQuantity).toBe(1);
    expect((await h.request()).json.cart?.totalQuantity).toBe(1);
    expect(h.writes).toEqual(["remove"]);
    privateExcluded(result.json);
  });
});

describe("F3 pre-write aggregate update limits", () => {
  it("allows a same-variant split-line replacement at aggregate 20", async () => {
    const h = await fixtureHarness(
      sourceCart([line(), line(`${RAW_LINE}-sibling`)])
    );
    const result = await h.request({
      action: "update",
      lineId: session().lineHandle(PRIVATE_ID, RAW_LINE),
      quantity: 19,
    });
    expect(result.status).toBe(200);
    expect(result.json.cart?.totalQuantity).toBe(20);
    expect(result.json.cart?.lines.map(item => item.quantity)).toEqual([19, 1]);
    expect(h.carts.get(PRIVATE_ID)?.totalQuantity).toBe(20);
    expect(h.writes).toEqual(["update"]);
    expect(result.headers.get("set-cookie")).not.toContain(
      "Expires=Thu, 01 Jan 1970"
    );
    privateExcluded(result.json);
  });
  it("rejects aggregate 21 without mutation or cookie reset and leaves the cart recoverable", async () => {
    const h = await fixtureHarness(
      sourceCart([line(), line(`${RAW_LINE}-sibling`)])
    );
    const result = await h.request({
      action: "update",
      lineId: session().lineHandle(PRIVATE_ID, RAW_LINE),
      quantity: 20,
    });
    expect(result.status).toBe(400);
    expect(result.json.message).toContain("at most 20 units");
    expect(result.headers.get("set-cookie")).toBeNull();
    expect(h.writes).toEqual([]);
    expect(h.carts.get(PRIVATE_ID)?.totalQuantity).toBe(2);
    expect((await h.request()).json.cart?.totalQuantity).toBe(2);
  });
  it("allows a normal single-line update to 20", async () => {
    const h = await fixtureHarness(sourceCart());
    const result = await h.request({
      action: "update",
      lineId: session().lineHandle(PRIVATE_ID, RAW_LINE),
      quantity: 20,
    });
    expect(result.status).toBe(200);
    expect(result.json.cart?.totalQuantity).toBe(20);
    expect(h.writes).toEqual(["update"]);
  });
  it("retains post-response validation if an upstream update still returns aggregate overflow", async () => {
    const h = await fixtureHarness(
      sourceCart([line(), line(`${RAW_LINE}-sibling`)])
    );
    h.setInvalidUpdateResponse();
    const result = await h.request({
      action: "update",
      lineId: session().lineHandle(PRIVATE_ID, RAW_LINE),
      quantity: 19,
    });
    expect(result.status).toBe(409);
    expect(result.json.cart).toBeNull();
    expect(result.headers.get("set-cookie")).toContain(
      "Expires=Thu, 01 Jan 1970"
    );
    expect(h.writes).toEqual(["update"]);
    privateExcluded(result.json);
  });
});

describe("F2 fixture jar continuity and stateful CRUD", () => {
  it("creates → reads → adds → reads, then updates/removes/clears the actual cart using one persisting jar", async () => {
    const h = await fixtureHarness();
    const jar = h.jar(true);
    vi.stubGlobal("fetch", jar.fetch);
    const flow = createShopifyCartFlow();
    let result = await flow.mutate({
      action: "add",
      merchandiseId: VARIANT,
      quantity: 1,
    });
    expect(result.cart?.totalQuantity).toBe(1);
    expect(
      jar.fetch.mock.calls.map(([, init]) => init.method ?? "GET")
    ).toEqual(["POST", "GET"]);
    expect(jar.cookie()).toBeTruthy();
    expect(jar.cookie()).not.toContain("fixture-only-private");
    result = await flow.mutate({
      action: "add",
      merchandiseId: VARIANT,
      quantity: 2,
    });
    expect(result.cart?.totalQuantity).toBe(3);
    result = await flow.mutate({
      action: "add",
      merchandiseId: OTHER_VARIANT,
      quantity: 1,
    });
    expect(result.cart?.lines).toHaveLength(2);
    const first = result.cart!.lines.find(
      item => item.merchandiseId === VARIANT
    )!;
    const second = result.cart!.lines.find(
      item => item.merchandiseId === OTHER_VARIANT
    )!;
    result = await flow.mutate({
      action: "update",
      lineId: first.id,
      quantity: 4,
    });
    expect(result.cart?.totalQuantity).toBe(5);
    result = await flow.mutate({ action: "remove", lineId: second.id });
    expect(result.cart?.totalQuantity).toBe(4);
    expect(result.cart?.lines).toHaveLength(1);
    privateExcluded(result);
    result = await flow.mutate({ action: "clear" });
    expect(result.cart).toBeNull();
    expect(jar.cookie()).toBeUndefined();
    expect([...h.carts.values()][0].totalQuantity).toBe(0);
    expect(h.carts.size).toBe(1);
    expect(h.writes).toEqual([
      "create",
      "add",
      "add",
      "update",
      "remove",
      "remove",
    ]);
    expect(flow.isBlocked()).toBe(false);
  });
  it("reports secure-cookie session failure and prevents another blind create with a non-persisting jar", async () => {
    const h = await fixtureHarness();
    const jar = h.jar(false);
    vi.stubGlobal("fetch", jar.fetch);
    const flow = createShopifyCartFlow();
    const mutation = {
      action: "add" as const,
      merchandiseId: VARIANT,
      quantity: 1,
    };
    await expect(flow.mutate(mutation)).rejects.toThrow(
      "secure guest-cart cookie session"
    );
    expect(flow.isBlocked()).toBe(true);
    expect(jar.cookie()).toBeUndefined();
    expect(
      jar.fetch.mock.calls.map(([, init]) => init.method ?? "GET")
    ).toEqual(["POST", "GET"]);
    await expect(flow.mutate(mutation)).rejects.toThrow("Enable cookies");
    expect(jar.fetch).toHaveBeenCalledTimes(2);
    expect(h.writes).toEqual(["create"]);
    expect(h.carts.size).toBe(1);
    expect([...h.carts.values()][0].totalQuantity).toBe(1);
  });
  it("propagates the readback API error and blocks further adds without retrying an ambiguous successful create", async () => {
    const h = await fixtureHarness();
    h.setFailReadback();
    const jar = h.jar(true);
    vi.stubGlobal("fetch", jar.fetch);
    const flow = createShopifyCartFlow();
    const mutation = {
      action: "add" as const,
      merchandiseId: VARIANT,
      quantity: 1,
    };
    await expect(flow.mutate(mutation)).rejects.toMatchObject({
      name: "ShopifyRequestError",
      status: 503,
      message:
        "The Shopify store is temporarily unavailable. No payment has been recorded here.",
    });
    expect(flow.isBlocked()).toBe(true);
    await expect(flow.mutate(mutation)).rejects.toBeInstanceOf(
      ShopifyRequestError
    );
    expect(jar.fetch).toHaveBeenCalledTimes(2);
    expect(h.writes).toEqual(["create"]);
    expect(jar.cookie()).toBeTruthy();
    expect([...h.carts.values()][0].totalQuantity).toBe(1);
  });
});
