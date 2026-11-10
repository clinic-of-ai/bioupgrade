import { useState } from "react";
import { ArrowLeft, ArrowUpRight, CreditCard, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ShopifyServiceCatalog from "@/components/shopify/ShopifyServiceCatalog";
import ConsultingFit, {
  consultingSummary,
  resolveConsultingOffer,
} from "@/components/consulting/ConsultingFit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProduct, PRODUCTS } from "@shared/products";
import { trpc } from "@/lib/trpc";
import { getCommerceProvider } from "@shared/commerce-provider";

const cardConfigured = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Products() {
  const shopifySelected =
    getCommerceProvider(import.meta.env.VITE_COMMERCE_PROVIDER) === "shopify";
  const [params, setParams] = useSearchParams();
  const requestedId = params.get("product");
  // The URL is the single source of selection, including back/forward navigation.
  const selected = resolveConsultingOffer(requestedId);
  const unknownOffer = requestedId !== null && !getProduct(requestedId);
  const [email, setEmail] = useState("");
  const checkout = trpc.checkout.createSession.useMutation();
  const { isAuthenticated, user } = useAuth();
  const startCardCheckout = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shopifySelected || !selected.checkoutEnabled || !cardConfigured) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const checkoutTab = window.open("about:blank", "_blank");
    if (!checkoutTab) {
      toast.error("Allow a new tab to open secure checkout.");
      return;
    }
    checkoutTab.opener = null;
    checkout.mutate(
      {
        productId: selected.id,
        catalog: "services",
        email: email.trim() || user?.email || undefined,
      },
      {
        onSuccess: ({ url }) => {
          checkoutTab.location.replace(url);
          toast.info("Secure Stripe checkout opened in a new tab.");
        },
        onError: error => {
          checkoutTab.close();
          toast.error("Checkout unavailable", { description: error.message });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav slim />
      <main className="container pt-28 pb-24 md:pt-36">
        <Link
          href="/#products"
          className="mono inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.18em] text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> BACK TO THE
          OFFER
        </Link>
        {(params.has("paid") || params.has("cancelled")) && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-border bg-white p-5 text-sm text-muted-foreground"
          >
            {shopifySelected
              ? "A checkout return is not proof of payment. Shopify account linkage and paid-event integration are pending; no points are awarded from a cart or browser return. Existing account records remain separate. "
              : "A checkout return is not proof of payment. Your account shows only server-verified orders. "}
            <Link href="/account" className="text-accent underline">
              View your record
            </Link>
            .
          </div>
        )}
        {unknownOffer && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-muted-foreground"
          >
            This offer link is not recognised. Showing the Research Strategy
            Session entry point; choose a different scope below if needed.
          </p>
        )}
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="mono text-xs tracking-[0.2em] text-accent">
                EDUCATIONAL SERVICES
              </p>
              <h1 className="mt-5 max-w-3xl text-[clamp(2.4rem,6vw,4.75rem)] leading-[1.02]">
                Start with a <span className="text-accent">question.</span>
                <br />
                Keep the evidence in view.
              </h1>
              <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
                For readers, communicators and research teams who need to
                understand a source—not a personal treatment or performance
                plan. Start with one question and one paper in the €200,
                60-minute session. Choose wider work only when the source set,
                workflow or team objective calls for it.
              </p>
            </Reveal>
            <div
              role="group"
              aria-label="Choose an educational service"
              className="mt-10 grid gap-3 sm:grid-cols-2"
            >
              {PRODUCTS.map(product => (
                <button
                  key={product.id}
                  type="button"
                  aria-pressed={selected.id === product.id}
                  onClick={() =>
                    setParams(previous => {
                      const next = new URLSearchParams(previous);
                      next.set("product", product.id);
                      return next;
                    })
                  }
                  className={`min-h-12 rounded-xl border p-5 text-left transition-colors motion-reduce:transition-none hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected.id === product.id ? "border-accent bg-secondary/50" : "border-border bg-white"}`}
                >
                  <p className="mono text-[10px] tracking-[0.15em] text-accent">
                    {product.eyebrow}
                  </p>
                  <h2 className="mt-4 text-xl leading-snug">{product.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {consultingSummary(product.id)}
                  </p>
                  <p className="mono mt-5 text-sm">{product.priceLabel}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {product.id === "research-strategy-session"
                      ? "Entry point · scope and availability to confirm"
                      : "Scope, timing and final quote required"}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              One paper → session. A bounded source set → briefing. One owned
              document workflow → sprint. One shared team case → workshop. There
              is no required upgrade or subscription.
            </p>
            <ConsultingFit key={selected.id} productId={selected.id} />
          </div>
          <aside className="self-start rounded-2xl border border-border bg-white p-6 md:p-8">
            <p className="mono text-[10px] tracking-[0.2em] text-accent">
              SELECTED SCOPE
            </p>
            <h2 className="mt-4 text-[28px] leading-snug">{selected.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {consultingSummary(selected.id)}
            </p>
            <p className="mono mt-6 text-2xl">{selected.priceLabel}</p>
            <p className="mono mt-3 text-xs leading-relaxed text-muted-foreground">
              {selected.eyebrow}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {selected.id === "research-strategy-session"
                ? "Confirm educational fit, source access, written-output format and terms before a booking or payment commitment. Payment and calendar scheduling are separate."
                : "The starting price is indicative, not a delivery promise or charged estimate. Timing is agreed in scope. Confirm feasibility and agree the final scope, format and quote before paying."}
            </p>
            <Link
              href={`/book?product=${selected.id}`}
              className="btn-primary mt-6 flex min-h-12 items-center justify-center px-5 text-sm"
            >
              {selected.checkoutEnabled
                ? "Prepare question & review scheduling"
                : "Discuss this project scope"}
              <ArrowUpRight
                className="ml-2 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </Link>
            {!selected.checkoutEnabled ? (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-base">Before any project commitment</h3>
                <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                  <li>
                    Agree the question, audience, source or data permissions and
                    explicit exclusions.
                  </li>
                  <li>
                    Confirm delivery capability, written outputs, acceptance
                    criteria and revision boundaries.
                  </li>
                  <li>
                    Agree timing, any tool or external costs, the final quote
                    and payment terms.
                  </li>
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  No project checkout is enabled. The scope page is not a quote
                  submission or a project reservation; no charge is made for
                  reviewing or drafting a scope here.
                </p>
              </div>
            ) : shopifySelected ? (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-base">
                  Shopify selected · service mapping pending
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This €200 educational scope is preserved, but it has not been
                  mapped to an existing Shopify product. The separate store
                  services below have their own IDs, names, live prices and
                  scope; they are not substitute bookings for this offer.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  No payment button is enabled for this unmapped educational
                  offer. Confirm fit, scope and terms through the
                  question-preparation route above. No price or checkout has
                  been inferred from the Shopify store.
                </p>
              </div>
            ) : (
              <form
                onSubmit={startCardCheckout}
                className="mt-6 border-t border-border pt-5"
              >
                <h3 className="mb-4 text-base">
                  Separate account-linked payment
                </h3>
                <label
                  className="block text-xs text-muted-foreground"
                  htmlFor="checkout-email"
                >
                  Receipt email (optional; defaults to your account)
                </label>
                <Input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={user?.email ?? "you@company.com"}
                  className="mt-2 h-11 bg-background"
                />
                <Button
                  type="submit"
                  disabled={checkout.isPending || !cardConfigured}
                  className="mt-4 min-h-12 w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                  {checkout.isPending
                    ? "Preparing checkout…"
                    : !cardConfigured
                      ? "Card checkout not connected"
                      : !isAuthenticated
                        ? "Sign in to continue"
                        : "Open Stripe checkout"}
                </Button>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {cardConfigured
                    ? "Payment is verified on the server before appearing in your account. A purchase does not reserve a calendar slot."
                    : "Payment credentials are not connected in this recovered environment. No card details can be collected here."}
                </p>
              </form>
            )}
            <div className="mt-6 space-y-3 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              <p className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                {shopifySelected
                  ? "Shopify is the selected provider for the separate existing-store service flow. Merchant approval and full-store launch are not implied. Legacy Stripe payment buttons are inactive; crypto checkout is not integrated."
                  : "Stripe is the chosen payment route for approved offers. Crypto checkout is not integrated or enabled."}
              </p>
              <p className="flex gap-2">
                <ArrowUpRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                Educational and workflow services only. Not medical advice,
                diagnosis, treatment or personalised human-use protocols.
              </p>
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center text-accent hover:underline"
              >
                {shopifySelected
                  ? "View your existing account record →"
                  : "View your orders & Signal Points →"}
              </Link>
              {shopifySelected && (
                <p>
                  Guest Shopify cart only. Account linkage and Signal Points
                  integration are pending; no points are awarded from a cart or
                  browser checkout return.
                </p>
              )}
            </div>
          </aside>
        </div>
        {shopifySelected && <ShopifyServiceCatalog />}
      </main>
      <Footer />
    </div>
  );
}
