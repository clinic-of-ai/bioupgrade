import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import type {
  ShopifyCartResult,
  ShopifyCatalogResult,
} from "../shared/shopify";
import {
  EXISTING_SHOPIFY_SERVICES,
  SHOPIFY_REFERENCE_DOMAIN,
} from "../shared/shopify";
import {
  createShopifyCartFlow,
  createShopifyCheckoutUrl,
  formatShopifyMoney,
  getShopifyCatalog,
  getShopifyCart,
  guardShopifyCheckoutUrl,
  mutateShopifyCart,
} from "../client/src/lib/shopify";
import { ShopifyCatalogView } from "../client/src/components/shopify/ShopifyServiceCatalog";
import ShopifyCartView from "../client/src/components/shopify/ShopifyCartView";

vi.mock("../client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    rewards: {
      me: {
        useQuery: () => ({ data: undefined, isError: false, isLoading: false }),
      },
    },
    checkout: {
      createSession: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
    interest: {
      join: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
import Cart from "../client/src/pages/Cart";
import Products from "../client/src/pages/Products";
import Shop from "../client/src/pages/Shop";

const service = EXISTING_SHOPIFY_SERVICES[0];
const variantId = "gid://shopify/ProductVariant/123456789";
const catalog: ShopifyCatalogResult = {
  status: "connected",
  storeDomain: SHOPIFY_REFERENCE_DOMAIN,
  updatedAt: null,
  cartEnabled: true,
  checkoutEnabled: false,
  message: "Guest cart only.",
  products: [
    {
      id: service.id,
      title: service.title,
      handle: "fixture-service",
      productType: "Consultation",
      description:
        "Unreviewed store marketing must not become a validated clinical promise.",
      availableForSale: true,
      image: null,
      variants: [
        {
          id: variantId,
          title: "Default Title",
          availableForSale: true,
          price: { amount: "321.09", currencyCode: "USD" },
        },
      ],
    },
  ],
};
const cartResult: ShopifyCartResult = {
  cartEnabled: true,
  checkoutEnabled: false,
  message: "Guest cart only.",
  cart: {
    totalQuantity: 2,
    lines: [
      {
        id: "sl_fixture_line",
        quantity: 2,
        title: service.title,
        variantTitle: "Default Title",
        merchandiseId: variantId,
        productId: service.id,
        price: { amount: "123.45", currencyCode: "EUR" },
        totalAmount: { amount: "180.10", currencyCode: "EUR" },
      },
    ],
    subtotalAmount: { amount: "180.10", currencyCode: "EUR" },
    totalAmount: { amount: "198.88", currencyCode: "EUR" },
    warnings: ["Service availability must be refreshed before checkout."],
  },
};
const wrap = (
  child: ReturnType<typeof createElement>,
  path = "/cart",
  search = ""
) =>
  renderToStaticMarkup(
    createElement(Router, { ssrPath: path, ssrSearch: search, children: child })
  );
const catalogMarkup = (
  overrides: Partial<Parameters<typeof ShopifyCatalogView>[0]> = {}
) =>
  wrap(
    createElement(ShopifyCatalogView, {
      result: catalog,
      loading: false,
      error: null,
      onRetry: vi.fn(),
      onAdd: vi.fn(),
      ...overrides,
    })
  );
const cartMarkup = (
  overrides: Partial<Parameters<typeof ShopifyCartView>[0]> = {}
) =>
  wrap(
    createElement(ShopifyCartView, {
      result: cartResult,
      loading: false,
      pending: null,
      error: null,
      notice: null,
      onRefresh: vi.fn(),
      onMutation: vi.fn(),
      onCheckout: vi.fn(),
      ...overrides,
    })
  );
const checkoutButton = (html: string) =>
  html.match(
    /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?(?:Open Shopify checkout|Hosted checkout not enabled|Preparing checkout…)(?:(?!<\/button>)[\s\S])*?<\/button>/
  )?.[0];
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Shopify service catalogue presentation", () => {
  it("uses only live API prices without mapping the service to a source educational offer", () => {
    const html = catalogMarkup();
    expect(html).toContain("321.09");
    expect(html).toContain("LIVE API CATALOGUE");
    expect(html).toContain("Service mapping pending");
    expect(html).toContain("not merchant approval");
    expect(html).not.toContain("€200");
    expect(html).not.toContain(catalog.products[0].description);
  });
  it("shows names as references only when the API is unavailable, even if a stale product is supplied", () => {
    const html = catalogMarkup({
      result: {
        ...catalog,
        status: "unavailable",
        cartEnabled: false,
        message: "Storefront HTTP 400. No live data.",
      },
    });
    expect(html).toContain("Storefront HTTP 400. No live data.");
    expect(html).toContain("EXISTING STORE REFERENCES");
    expect(html).toContain("Live price and availability are unconfirmed");
    expect(html).not.toContain("321.09");
    expect(html).not.toContain("LIVE API CATALOGUE");
    expect(html).not.toContain("Add to guest cart");
  });
  it("does not promote cached prices while loading or after an error", () => {
    for (const overrides of [{ loading: true }, { error: "API unavailable" }]) {
      const html = catalogMarkup(overrides);
      expect(html).not.toContain("321.09");
      expect(html).not.toContain("LIVE API CATALOGUE");
    }
  });
  it("excludes unrecognised products rather than treating a research item as a service", () => {
    const html = catalogMarkup({
      result: {
        ...catalog,
        products: [
          {
            ...catalog.products[0],
            id: "gid://shopify/Product/999",
            title: "Unapproved research item",
          },
        ],
      },
    });
    expect(html).not.toContain("Unapproved research item");
    expect(html).toContain("No allowed existing service products");
  });
  it("disables add for unavailable products or closed guest-cart access", () => {
    const unavailable = catalogMarkup({
      result: {
        ...catalog,
        products: [{ ...catalog.products[0], availableForSale: false }],
      },
    });
    expect(unavailable).toMatch(
      /<button[^>]*disabled=""[^>]*aria-label="Add Bio-Strategy Session to guest cart"/
    );
    expect(unavailable).toContain("Unavailable for sale in Shopify");
    const closed = catalogMarkup({
      result: { ...catalog, cartEnabled: false },
    });
    expect(closed).toContain("Guest cart not enabled");
    expect(closed).toMatch(
      /<button[^>]*disabled=""[^>]*aria-label="Add Bio-Strategy Session to guest cart"/
    );
  });
});

describe("Shopify guest cart presentation", () => {
  it("renders authoritative line and total estimates, accessible quantity edits and server warnings", () => {
    const html = cartMarkup();
    expect(html).toContain("€123.45");
    expect(html).toContain("€180.10");
    expect(html).toContain("€198.88");
    expect(html).toContain("Subtotal estimate");
    expect(html).toContain("Total estimate");
    expect(html).toContain("not calculated in your browser");
    expect(html).toContain("Quantity for Bio-Strategy Session");
    expect(html).toMatch(/type="number"[^>]*min="1"[^>]*max="20"[^>]*step="1"/);
    expect(html).toContain("Remove Bio-Strategy Session from cart");
    expect(html).toContain("Clear cart");
    expect(html).toContain(cartResult.cart!.warnings[0]);
    expect(html).not.toContain("sl_fixture_line");
  });
  it("keeps checkout disabled until the backend permits it", () => {
    expect(checkoutButton(cartMarkup())).toContain('disabled=""');
    expect(
      checkoutButton(
        cartMarkup({ result: { ...cartResult, checkoutEnabled: true } })
      )
    ).not.toContain('disabled=""');
  });
  it("disables checkout while pending, on errors and when guest-cart access is unavailable", () => {
    const enabled = { ...cartResult, checkoutEnabled: true };
    for (const overrides of [
      { pending: "update" },
      { error: "Refresh required" },
      { result: { ...enabled, cartEnabled: false } },
    ]) {
      expect(
        checkoutButton(cartMarkup({ result: enabled, ...overrides }))
      ).toContain('disabled=""');
    }
  });
  it("does not provide checkout on an empty cart", () => {
    const html = cartMarkup({
      result: { ...cartResult, checkoutEnabled: true, cart: null },
    });
    expect(html).toContain("Your guest cart is empty");
    expect(html).not.toContain("Open Shopify checkout");
  });
  it("states pending account linkage and refuses cart or browser-return rewards", () => {
    const html = cartMarkup();
    expect(html).toContain("paid-event reconciliation");
    expect(html).toContain(
      "No points are awarded from this cart or a browser checkout return"
    );
    expect(html).toContain("Existing account records remain separate");
    expect(html).toContain("service mapping pending");
  });
  it("renders unavailable and loading states without fabricating a zero balance or total", () => {
    const unavailable = cartMarkup({
      result: {
        cart: null,
        cartEnabled: false,
        checkoutEnabled: false,
        message: "Guest cart is unavailable.",
      },
    });
    expect(unavailable).toContain("Guest cart unavailable");
    expect(unavailable).not.toContain("€0.00");
    expect(cartMarkup({ result: null, loading: true })).toContain(
      "Loading your guest cart from Shopify"
    );
  });
});

describe("same-origin Shopify request helpers", () => {
  it("fetches catalogue and guest cart using cookies and no-store without cart IDs in requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog)))
      .mockResolvedValueOnce(new Response(JSON.stringify(cartResult)));
    vi.stubGlobal("fetch", fetchMock);
    await getShopifyCatalog();
    await getShopifyCart();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/shopify/catalog");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/shopify/cart");
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.credentials).toBe("same-origin");
      expect(options.cache).toBe("no-store");
      expect(options.body).toBeUndefined();
    }
  });
  it("posts only the declared mutation fields, never prices, totals, email or cart keys", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(cartResult)));
    vi.stubGlobal("fetch", fetchMock);
    const mutation = {
      action: "add" as const,
      merchandiseId: variantId,
      quantity: 1,
    };
    await mutateShopifyCart(mutation);
    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/shopify/cart");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    expect(JSON.parse(options.body)).toEqual(mutation);
  });
  it("fails closed on malformed critical flags or unrecognised cart products", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...catalog, checkoutEnabled: "true" }))
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...cartResult,
            cart: {
              ...cartResult.cart,
              lines: [
                {
                  ...cartResult.cart!.lines[0],
                  productId: "gid://shopify/Product/999",
                },
              ],
            },
          })
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(getShopifyCatalog()).rejects.toThrow("could not be confirmed");
    await expect(getShopifyCart()).rejects.toThrow("could not be confirmed");
  });
  it("exposes a controlled non-2xx message instead of a fake empty cart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Checkout is closed pending explicit approval.",
          }),
          { status: 503 }
        )
      )
    );
    await expect(getShopifyCart()).rejects.toThrow(
      "closed pending explicit approval"
    );
  });
  it("posts checkout without prices and returns only the guarded URL for navigation", async () => {
    const url = `https://${SHOPIFY_REFERENCE_DOMAIN}/cart/c/fixture-token?locale=en`;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ url })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await createShopifyCheckoutUrl()).toBe(url);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/shopify/checkout");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({});
    expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
  });
});

describe("confirmed client cart flow", () => {
  const add = { action: "add" as const, merchandiseId: variantId, quantity: 1 };
  it("returns readback totals and flags, preserving controlled mutation warnings", async () => {
    const changed = structuredClone(cartResult);
    const actual = structuredClone(cartResult);
    actual.checkoutEnabled = true;
    actual.cart!.totalAmount.amount = "200.01";
    actual.cart!.warnings = ["Readback warning."];
    const mutate = vi.fn().mockResolvedValue(changed);
    const read = vi.fn().mockResolvedValue(actual);
    const flow = createShopifyCartFlow({ mutate, read });
    const result = await flow.mutate(add);
    expect(result.checkoutEnabled).toBe(true);
    expect(result.cart?.totalAmount).toEqual(actual.cart!.totalAmount);
    expect(result.cart?.warnings).toEqual([
      ...changed.cart!.warnings,
      "Readback warning.",
    ]);
    expect(mutate).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledOnce();
    expect(flow.isBlocked()).toBe(false);
  });
  it("does not resolve persistent success until the independent read finishes", async () => {
    let completeRead!: (value: ShopifyCartResult) => void;
    const read = vi.fn(
      () =>
        new Promise<ShopifyCartResult>(resolve => {
          completeRead = resolve;
        })
    );
    const flow = createShopifyCartFlow({
      mutate: vi.fn().mockResolvedValue(cartResult),
      read,
    });
    let resolved = false;
    const pending = flow.mutate(add).then(value => {
      resolved = true;
      return value;
    });
    await vi.waitFor(() => expect(read).toHaveBeenCalledOnce());
    expect(resolved).toBe(false);
    expect(flow.isBlocked()).toBe(true);
    completeRead(cartResult);
    await pending;
    expect(resolved).toBe(true);
    expect(flow.isBlocked()).toBe(false);
  });
  it.each([
    "missing",
    "other-handle",
    "quantity",
    "merchandise",
    "product",
    "total",
    "extra-line",
    "disabled",
  ])(
    "blocks another add when readback has %s rather than the created cart",
    async kind => {
      const actual = structuredClone(cartResult);
      if (kind === "missing") actual.cart = null;
      else if (kind === "other-handle")
        actual.cart!.lines[0].id = "sl_other_cart_bound_handle";
      else if (kind === "quantity") actual.cart!.lines[0].quantity = 1;
      else if (kind === "merchandise")
        actual.cart!.lines[0].merchandiseId =
          "gid://shopify/ProductVariant/999";
      else if (kind === "product")
        actual.cart!.lines[0].productId = EXISTING_SHOPIFY_SERVICES[1].id;
      else if (kind === "total") actual.cart!.totalQuantity = 1;
      else if (kind === "extra-line")
        actual.cart!.lines.push({
          ...actual.cart!.lines[0],
          id: "sl_extra_handle",
        });
      else actual.cartEnabled = false;
      const mutate = vi.fn().mockResolvedValue(cartResult);
      const read = vi.fn().mockResolvedValue(actual);
      const flow = createShopifyCartFlow({ mutate, read });
      await expect(flow.mutate(add)).rejects.toThrow(
        "secure guest-cart cookie session"
      );
      await expect(flow.mutate(add)).rejects.toThrow("Enable cookies");
      expect(flow.isBlocked()).toBe(true);
      expect(mutate).toHaveBeenCalledOnce();
      expect(read).toHaveBeenCalledOnce();
    }
  );
  it("preserves a mutation API error without an automatic read or retry", async () => {
    const failure = new Error("Controlled API mutation error.");
    const mutate = vi.fn().mockRejectedValue(failure);
    const read = vi.fn();
    const flow = createShopifyCartFlow({ mutate, read });
    await expect(flow.mutate(add)).rejects.toBe(failure);
    expect(mutate).toHaveBeenCalledOnce();
    expect(read).not.toHaveBeenCalled();
  });
  it("does not add continuity reads to non-add mutations", async () => {
    const mutate = vi.fn().mockResolvedValue(cartResult);
    const read = vi.fn();
    const flow = createShopifyCartFlow({ mutate, read });
    await expect(flow.mutate({ action: "clear" })).resolves.toEqual(cartResult);
    expect(mutate).toHaveBeenCalledOnce();
    expect(read).not.toHaveBeenCalled();
  });
});

describe("money formatting and checkout URL guard", () => {
  it("formats API money in its actual currency and rejects non-finite amounts", () => {
    expect(formatShopifyMoney({ amount: "200.00", currencyCode: "EUR" })).toBe(
      "€200.00"
    );
    expect(
      formatShopifyMoney({ amount: "321.09", currencyCode: "USD" })
    ).toContain("321.09");
    expect(formatShopifyMoney({ amount: "NaN", currencyCode: "EUR" })).toBe(
      "Amount unavailable"
    );
  });
  it.each(["/cart/c/fixture-token", "/checkouts/cn/fixture-token/"])(
    "allows the exact verified HTTPS host and supported path %s",
    path => {
      const url = `https://${SHOPIFY_REFERENCE_DOMAIN}${path}`;
      expect(guardShopifyCheckoutUrl(url)).toBe(url);
    }
  );
  it.each([
    `http://${SHOPIFY_REFERENCE_DOMAIN}/cart/c/token`,
    `https://${SHOPIFY_REFERENCE_DOMAIN}.evil.example/cart/c/token`,
    `https://evil.example/cart/c/token`,
    `https://name:pass@${SHOPIFY_REFERENCE_DOMAIN}/cart/c/token`,
    `https://${SHOPIFY_REFERENCE_DOMAIN}:444/cart/c/token`,
    `https://${SHOPIFY_REFERENCE_DOMAIN}/cart/c/token#paid`,
    `https://${SHOPIFY_REFERENCE_DOMAIN}/products/service`,
    `https://${SHOPIFY_REFERENCE_DOMAIN}/checkouts/anything/token`,
    `https://${SHOPIFY_REFERENCE_DOMAIN}/cart/c/token/extra`,
    "javascript:alert(1)",
  ])("rejects an unguarded checkout URL %s", url => {
    expect(() => guardShopifyCheckoutUrl(url)).toThrow();
  });
});

describe("provider-preserving page integration", () => {
  it("does not fetch a guest cart or account data during SSR", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const html = wrap(createElement(Cart));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(html).toContain("Loading your guest cart from Shopify");
    expect(html).not.toContain("checkoutUrl");
    expect(html).not.toContain("fixture-token");
  });
  it("keeps all four educational offers, quote-only scope controls and no active legacy Stripe button with Shopify selected", () => {
    const html = wrap(createElement(Products), "/products");
    for (const label of [
      "Research Strategy Session",
      "Evidence Briefing",
      "AI Workflow Sprint",
      "Applied AI in Bioscience",
      "€200",
      "From €850",
      "From €2,800",
      "From €1,200",
    ])
      expect(html).toContain(label);
    expect(html).toContain("Shopify selected · service mapping pending");
    expect(html).toContain("Existing Shopify services");
    expect(html).not.toContain("Open Stripe checkout");
    expect(html).not.toContain('id="checkout-email"');
    const quoteHtml = wrap(
      createElement(Products),
      "/products",
      "?product=evidence-briefing"
    );
    expect(quoteHtml).toContain("No project checkout is enabled");
    expect(quoteHtml).toContain("Discuss this project scope");
  });
  it("preserves research detail, paper-library and interest flows alongside the separate Shopify service panel", () => {
    const html = wrap(createElement(Shop), "/shop");
    expect(html).toContain("27");
    expect(html).toContain("Explore the paper library");
    expect(html).toContain("Specifications &amp; papers");
    expect(html).toContain("Sign in to save interest");
    expect(html).toContain("Existing Shopify services");
    expect(html).not.toContain("Open Stripe checkout");
  });
  it("can preserve the legacy Stripe UI only in its configured provider branch", () => {
    vi.stubEnv("VITE_COMMERCE_PROVIDER", "stripe");
    const html = wrap(createElement(Products), "/products");
    expect(html).toContain("Separate account-linked payment");
    expect(html).not.toContain("Existing Shopify services");
    expect(wrap(createElement(Cart))).toContain(
      "Shopify is not the selected provider"
    );
  });
});
