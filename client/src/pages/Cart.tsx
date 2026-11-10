import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopifyCartView from "@/components/shopify/ShopifyCartView";
import {
  createShopifyCartFlow,
  createShopifyCheckoutUrl,
  getShopifyCart,
  shopifyErrorMessage,
} from "@/lib/shopify";
import { getCommerceProvider } from "@shared/commerce-provider";
import type { ShopifyCartMutation, ShopifyCartResult } from "@shared/shopify";

function GuestShopifyCart() {
  const [result, setResult] = useState<ShopifyCartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
  // Deliberately browser-only: no guest cart or private account request during SSR.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getShopifyCart(controller.signal)
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

  const changeCart = async (mutation: ShopifyCartMutation) => {
    if (
      busy.current ||
      loading ||
      error ||
      sessionError ||
      !result?.cartEnabled
    )
      return;
    busy.current = true;
    setPending(mutation.action);
    setError(null);
    setNotice(null);
    try {
      const data = await cartFlow.current.mutate(mutation);
      if (!mounted.current) return;
      setResult(data);
      setNotice(
        data.cartEnabled && mutation.action !== "clear"
          ? "Cart refreshed from Shopify. No payment has been requested."
          : data.message
      );
      window.dispatchEvent(new Event("shopify-cart-updated"));
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

  const openCheckout = async () => {
    if (
      busy.current ||
      loading ||
      error ||
      sessionError ||
      !result?.cartEnabled ||
      !result.checkoutEnabled ||
      !result.cart?.lines.length
    )
      return;
    // Open synchronously on the user gesture; sever the opener before awaiting the API.
    const checkoutTab = window.open("about:blank", "_blank");
    if (!checkoutTab) {
      setError(
        "Allow a new tab to open hosted Shopify checkout, then refresh your cart to continue."
      );
      return;
    }
    checkoutTab.opener = null;
    busy.current = true;
    setPending("checkout");
    setNotice(null);
    try {
      const url = await createShopifyCheckoutUrl();
      if (!mounted.current || checkoutTab.closed) {
        checkoutTab.close();
        return;
      }
      checkoutTab.location.replace(url);
      setNotice(
        "Hosted Shopify checkout opened in a new tab. This is not proof of payment; account linkage and points remain pending."
      );
    } catch (failure) {
      checkoutTab.close();
      if (mounted.current) {
        setResult(null);
        setError(shopifyErrorMessage(failure));
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  };

  return (
    <ShopifyCartView
      result={result}
      loading={loading}
      pending={pending}
      error={sessionError || error}
      notice={notice}
      onRefresh={() => {
        if (!busy.current) {
          setNotice(null);
          setRefresh(value => value + 1);
        }
      }}
      onMutation={changeCart}
      onCheckout={openCheckout}
    />
  );
}

export default function Cart() {
  const shopifySelected =
    getCommerceProvider(import.meta.env.VITE_COMMERCE_PROVIDER) === "shopify";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container pb-24 pt-28 md:pt-36">
        <Link
          href="/shop"
          className="mono inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> BACK TO THE
          CATALOGUE
        </Link>
        <header className="mt-8 border-b border-border pb-8">
          <p className="mono text-xs tracking-[0.2em] text-accent">
            BIOUPGRADE · GUEST SHOPIFY CART
          </p>
          <h1 className="mt-5 text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02]">
            Review first.
            <br />
            <span className="text-accent">Commit deliberately.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Live service quantities and estimates, kept separate from the
            evidence. Hosted checkout is a distinct step—not a booking or a paid
            account record.
          </p>
        </header>
        {shopifySelected ? (
          <GuestShopifyCart />
        ) : (
          <section className="mt-8 rounded-2xl border border-border bg-white p-6">
            <h2 className="text-2xl">Shopify is not the selected provider.</h2>
            <p
              role="status"
              className="mt-4 text-sm leading-relaxed text-muted-foreground"
            >
              The guest Shopify cart is inactive. No Shopify cart or checkout
              request is made on this page. Existing Stripe account history
              remains separate.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex min-h-11 items-center text-sm text-accent underline"
            >
              Review educational offers
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
