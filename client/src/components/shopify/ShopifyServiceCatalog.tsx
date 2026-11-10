import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  createShopifyCartFlow,
  formatShopifyMoney,
  getShopifyCatalog,
  isExistingShopifyService,
  shopifyErrorMessage,
} from "@/lib/shopify";
import type {
  ShopifyCatalogResult,
  ShopifyProduct,
  ShopifyVariant,
} from "@shared/shopify";
import { EXISTING_SHOPIFY_SERVICES } from "@shared/shopify";

export type ShopifyCatalogViewProps = {
  result: ShopifyCatalogResult | null;
  loading: boolean;
  error: string | null;
  pendingVariantId?: string | null;
  notice?: string | null;
  heading?: string;
  onRetry: () => void;
  onAdd: (variant: ShopifyVariant) => void;
};

function ServiceCard({
  product,
  cartEnabled,
  pending,
  onAdd,
}: {
  product: ShopifyProduct;
  cartEnabled: boolean;
  pending: string | null;
  onAdd: (variant: ShopifyVariant) => void;
}) {
  const selectId = useId();
  const [variantId, setVariantId] = useState(
    product.variants.find(variant => variant.availableForSale)?.id ??
      product.variants[0]?.id ??
      ""
  );
  const variant =
    product.variants.find(item => item.id === variantId) ?? product.variants[0];
  const available =
    product.availableForSale && Boolean(variant?.availableForSale);
  const canAdd = cartEnabled && available && Boolean(variant) && !pending;
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-5 md:p-6">
      <p className="mono text-[10px] tracking-[0.15em] text-accent">
        EXISTING STORE SERVICE
      </p>
      <h3 className="mt-4 break-words text-2xl leading-snug">
        {product.title}
      </h3>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Separate Shopify product. Educational scope mapping is pending; this
        name does not establish equivalence to an offer above or in the research
        catalogue.
      </p>
      {product.variants.length > 1 && (
        <div className="mt-5">
          <label
            htmlFor={selectId}
            className="mb-2 block text-xs text-muted-foreground"
          >
            Store option
          </label>
          <select
            id={selectId}
            value={variant?.id ?? ""}
            onChange={event => setVariantId(event.target.value)}
            disabled={Boolean(pending)}
            className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-60"
          >
            {product.variants.map(item => (
              <option key={item.id} value={item.id}>
                {item.title}
                {item.availableForSale ? "" : " · unavailable"}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-auto pt-6">
        <p className="mono text-xl">
          {variant ? formatShopifyMoney(variant.price) : "Price unavailable"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {available
            ? "Available for sale in Shopify · not a stock count"
            : "Unavailable for sale in Shopify"}
        </p>
        <Button
          type="button"
          className="mt-5 min-h-12 w-full"
          disabled={!canAdd}
          aria-label={`Add ${product.title} to guest cart`}
          onClick={() => {
            if (canAdd && variant) onAdd(variant);
          }}
        >
          <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
          {pending === variant?.id
            ? "Updating cart…"
            : !available
              ? "Service unavailable"
              : !cartEnabled
                ? "Guest cart not enabled"
                : "Add to guest cart"}
        </Button>
      </div>
    </article>
  );
}

/** Public presentation only; it never fetches account information or a cart during SSR. */
export function ShopifyCatalogView({
  result,
  loading,
  error,
  pendingVariantId = null,
  notice = null,
  heading = "Existing Shopify services",
  onRetry,
  onAdd,
}: ShopifyCatalogViewProps) {
  const headingId = useId();
  const connected = result?.status === "connected" && !loading && !error;
  const products = connected
    ? result.products.filter(isExistingShopifyService)
    : [];
  return (
    <section
      aria-labelledby={headingId}
      aria-busy={loading || Boolean(pendingVariantId)}
      className="mt-12 border-t border-border pt-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <p className="mono text-xs tracking-[0.18em] text-accent">
            SEPARATE SERVICE CATALOGUE · SHOPIFY
          </p>
          <h2
            id={headingId}
            className="mt-4 text-[clamp(1.8rem,4vw,2.75rem)] leading-tight"
          >
            {heading}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            These are the existing store’s consultation products, not the 27
            owner-listed research variants or the four educational scopes.
            Names, prices and scope are not merged. No research-material
            checkout is available here.
          </p>
        </div>
        <Link
          href="/cart"
          className="btn-ghost inline-flex min-h-12 items-center gap-3 px-5 text-sm"
        >
          Guest cart <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mono rounded-full border border-border bg-white px-3 py-1.5 text-[10px] tracking-[0.08em]">
            {loading
              ? "CHECKING LIVE API"
              : error
                ? "API UNCONFIRMED"
                : connected
                  ? "LIVE API CATALOGUE"
                  : "CATALOGUE UNAVAILABLE"}
          </span>
          <p className="text-sm font-medium">
            Service mapping pending · full-store launch not confirmed
          </p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          A live API badge indicates catalogue connectivity only—not merchant
          approval, validated service claims or permission to launch. Store
          descriptions are not reproduced while the service scopes are under
          review.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {connected && result.checkoutEnabled
            ? "Hosted checkout is available only for services explicitly allowed by the backend. Adding a service does not confirm scope, book a calendar slot or make a payment."
            : "Hosted checkout remains closed unless the backend launch and service-approval gates are enabled. Adding a service is not a booking, reservation or payment."}
        </p>
      </div>
      {loading && (
        <p role="status" className="mt-6 text-sm text-muted-foreground">
          Loading the existing Shopify service catalogue… No cached prices are
          shown.
        </p>
      )}
      {error && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={Boolean(pendingVariantId)}
            className="mt-4 min-h-11"
          >
            Retry catalogue
          </Button>
        </div>
      )}
      {!loading && !error && !connected && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5">
          <p
            role="status"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {result?.message ||
              "The Shopify catalogue is not connected. No store prices or availability can be confirmed."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="mt-4 min-h-11"
          >
            Refresh catalogue
          </Button>
        </div>
      )}
      {connected && !products.length && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-border bg-white p-5 text-sm text-muted-foreground"
        >
          No allowed existing service products were returned by the live
          catalogue. Nothing can be added.
        </p>
      )}
      {!loading && products.length === 0 && (
        <div className="mt-6">
          <p className="mono text-[10px] tracking-[0.15em] text-muted-foreground">
            EXISTING STORE REFERENCES · NOT LIVE AVAILABILITY
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXISTING_SHOPIFY_SERVICES.map(service => (
              <li
                key={service.id}
                className="rounded-xl border border-border bg-white/70 p-5"
              >
                <h3 className="break-words text-lg leading-snug">
                  {service.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Existing store reference only. Live price and availability are
                  unconfirmed; scope mapping is pending.
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {products.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map(product => (
            <ServiceCard
              key={product.id}
              product={product}
              cartEnabled={Boolean(result?.cartEnabled)}
              pending={pendingVariantId}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
      {notice && (
        <p role="status" className="mt-5 text-sm leading-relaxed text-accent">
          {notice}
        </p>
      )}
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Guest Shopify cart only. Account linkage and Signal Points integration
        are pending. No points are awarded from this cart or a browser checkout
        return.
      </p>
    </section>
  );
}

export default function ShopifyServiceCatalog({
  heading,
}: {
  heading?: string;
}) {
  const [result, setResult] = useState<ShopifyCatalogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const cartFlow = useRef(createShopifyCartFlow());
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getShopifyCatalog(controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch(failure => {
        if (!controller.signal.aborted) {
          setResult(null);
          setError(shopifyErrorMessage(failure));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);
  const add = async (variant: ShopifyVariant) => {
    if (
      busy.current ||
      loading ||
      error ||
      sessionError ||
      cartFlow.current.isBlocked() ||
      result?.status !== "connected" ||
      !result.cartEnabled ||
      !variant.availableForSale
    )
      return;
    busy.current = true;
    setPending(variant.id);
    setNotice(null);
    try {
      const response = await cartFlow.current.mutate({
        action: "add",
        merchandiseId: variant.id,
        quantity: 1,
      });
      if (!mounted.current) return;
      if (!response.cartEnabled || !response.cart?.lines.length) {
        setResult(previous =>
          previous
            ? {
                ...previous,
                cartEnabled: response.cartEnabled,
                checkoutEnabled: response.checkoutEnabled,
              }
            : null
        );
        setNotice(
          response.message ||
            "The guest cart is not available. No payment has been requested."
        );
      } else {
        setNotice(
          "Guest cart refreshed. Review its quantities and Shopify estimates before continuing. No payment has been made."
        );
        window.dispatchEvent(new Event("shopify-cart-updated"));
      }
    } catch (failure) {
      if (mounted.current) {
        setResult(null);
        setError(shopifyErrorMessage(failure));
        if (cartFlow.current.isBlocked())
          setSessionError(
            `${shopifyErrorMessage(failure)} Secure cookie session continuity is unconfirmed. Check cookies and service availability, then reload before adding again.`
          );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  };
  return (
    <ShopifyCatalogView
      result={result}
      loading={loading}
      error={sessionError || error}
      notice={notice}
      pendingVariantId={pending}
      heading={heading}
      onRetry={() => {
        setNotice(null);
        setRefresh(value => value + 1);
      }}
      onAdd={add}
    />
  );
}
