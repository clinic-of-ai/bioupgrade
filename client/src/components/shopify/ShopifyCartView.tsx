import { useEffect, useId, useState, type FormEvent } from "react";
import { ArrowUpRight, ExternalLink, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShopifyMoney } from "@/lib/shopify";
import type {
  ShopifyCartLine,
  ShopifyCartMutation,
  ShopifyCartResult,
} from "@shared/shopify";

export type ShopifyCartViewProps = {
  result: ShopifyCartResult | null;
  loading: boolean;
  pending: string | null;
  error: string | null;
  notice: string | null;
  onRefresh: () => void;
  onMutation: (mutation: ShopifyCartMutation) => void;
  onCheckout: () => void;
};

function CartLine({
  line,
  disabled,
  onMutation,
}: {
  line: ShopifyCartLine;
  disabled: boolean;
  onMutation: (mutation: ShopifyCartMutation) => void;
}) {
  const quantityId = useId();
  const errorId = useId();
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [quantityError, setQuantityError] = useState<string | null>(null);
  useEffect(() => {
    setQuantity(String(line.quantity));
    setQuantityError(null);
  }, [line.quantity]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = Number(quantity);
    if (!Number.isSafeInteger(next) || next < 1 || next > 20) {
      setQuantityError(
        "Enter a whole quantity from 1 to 20, or use Remove. This is the guest-cart request limit, not a stock count."
      );
      return;
    }
    if (!disabled && next !== line.quantity)
      onMutation({ action: "update", lineId: line.id, quantity: next });
  };
  return (
    <li className="rounded-2xl border border-border bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mono text-[10px] tracking-[0.15em] text-accent">
            EXISTING SHOPIFY SERVICE
          </p>
          <h2 className="mt-3 break-words text-2xl leading-snug">
            {line.title}
          </h2>
          {line.variantTitle && line.variantTitle !== "Default Title" && (
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {line.variantTitle}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Unit price from Shopify:{" "}
            <span className="mono">{formatShopifyMoney(line.price)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Line estimate</p>
          <p className="mono mt-2 text-xl">
            {formatShopifyMoney(line.totalAmount)}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor={quantityId}
              className="mb-2 block text-xs text-muted-foreground"
            >
              Quantity for {line.title}
            </label>
            <Input
              id={quantityId}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              step={1}
              required
              value={quantity}
              onChange={event => {
                setQuantity(event.target.value);
                setQuantityError(null);
              }}
              disabled={disabled}
              aria-invalid={Boolean(quantityError)}
              aria-describedby={quantityError ? errorId : undefined}
              className="h-11 w-24 bg-background"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={disabled || Number(quantity) === line.quantity}
            className="min-h-11"
            aria-label={`Update quantity for ${line.title}`}
          >
            Update
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          onClick={() => onMutation({ action: "remove", lineId: line.id })}
          className="min-h-11 text-muted-foreground"
          aria-label={`Remove ${line.title} from cart`}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Remove
        </Button>
      </div>
      {quantityError && (
        <p id={errorId} role="alert" className="mt-3 text-xs text-destructive">
          {quantityError}
        </p>
      )}
    </li>
  );
}

export default function ShopifyCartView({
  result,
  loading,
  pending,
  error,
  notice,
  onRefresh,
  onMutation,
  onCheckout,
}: ShopifyCartViewProps) {
  const cart = result?.cart;
  const hasLines = Boolean(cart?.lines.length);
  const disabled =
    loading || Boolean(pending) || Boolean(error) || !result?.cartEnabled;
  const canCheckout = !disabled && Boolean(result?.checkoutEnabled) && hasLines;
  return (
    <div aria-busy={loading || Boolean(pending)}>
      <div className="mt-8 rounded-xl border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">
          Guest cart · service mapping pending
        </p>
        <p className="mt-2">
          Only allowed existing Shopify services belong in this cart. They are
          separate from the educational offers and the 27 owner-listed research
          variants. A cart does not confirm service scope, reserve a calendar
          slot or make a payment.
        </p>
      </div>
      {loading && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground"
        >
          Loading your guest cart from Shopify… No browser-stored cart or cached
          total is used.
        </p>
      )}
      {pending && (
        <p role="status" className="mt-6 text-sm text-accent">
          {pending === "checkout"
            ? "Refreshing the cart and preparing guarded Shopify checkout…"
            : "Updating the guest cart in Shopify…"}
        </p>
      )}
      {error && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5">
          <p role="alert" className="text-sm leading-relaxed text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={loading || Boolean(pending)}
            onClick={onRefresh}
            className="mt-4 min-h-11"
          >
            Refresh guest cart
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="mt-6 text-sm leading-relaxed text-accent">
          {notice}
        </p>
      )}
      {!loading && !error && !result?.cartEnabled && (
        <div className="mt-6 rounded-xl border border-border bg-white p-6">
          <h2 className="text-2xl">Guest cart unavailable</h2>
          <p
            role="status"
            className="mt-3 text-sm leading-relaxed text-muted-foreground"
          >
            {result?.message ||
              "The Shopify cart is not enabled or cannot currently be confirmed. No checkout is available."}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(pending)}
            onClick={onRefresh}
            className="mt-5 min-h-11"
          >
            Check cart availability
          </Button>
        </div>
      )}
      {!loading && !error && result?.cartEnabled && !hasLines && (
        <section className="mt-8 rounded-2xl border border-border bg-white px-6 py-12 text-center md:py-16">
          <ShoppingBag
            className="mx-auto h-7 w-7 text-accent"
            aria-hidden="true"
          />
          <h2 className="mt-5 text-3xl">Your guest cart is empty.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Browse the separate live Shopify service panel. Educational project
            scopes stay quote-only; research materials cannot be added.
          </p>
          <Link
            href="/shop"
            className="btn-primary mt-6 inline-flex min-h-12 items-center gap-3 px-6 text-sm"
          >
            Explore existing services{" "}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      )}
      {!loading && cart && hasLines && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-label="Guest cart services" className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="mono text-xs text-muted-foreground">
                {cart.totalQuantity}{" "}
                {cart.totalQuantity === 1 ? "service unit" : "service units"} ·
                Shopify-provided quantity
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onMutation({ action: "clear" })}
                className="min-h-11"
              >
                Clear cart
              </Button>
            </div>
            <ul className="space-y-4">
              {cart.lines.map(line => (
                <CartLine
                  key={line.id}
                  line={line}
                  disabled={disabled}
                  onMutation={onMutation}
                />
              ))}
            </ul>
            {cart.warnings.length > 0 && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-border bg-secondary/40 p-5"
              >
                <p className="text-sm font-medium">Shopify cart notices</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">
                  {cart.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <aside className="self-start rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-24">
            <p className="mono text-[10px] tracking-[0.18em] text-accent">
              SHOPIFY ESTIMATE
            </p>
            <h2 className="mt-4 text-2xl">Before checkout.</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal estimate</dt>
                <dd className="mono">
                  {formatShopifyMoney(cart.subtotalAmount)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
                <dt>Total estimate</dt>
                <dd className="mono text-xl">
                  {formatShopifyMoney(cart.totalAmount)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              These amounts are supplied by Shopify, not calculated in your
              browser. Final taxes, discounts and any other charges are
              confirmed at hosted checkout.
            </p>
            <Button
              type="button"
              disabled={!canCheckout}
              onClick={onCheckout}
              className="mt-6 min-h-12 w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              {pending === "checkout"
                ? "Preparing checkout…"
                : !result?.checkoutEnabled
                  ? "Hosted checkout not enabled"
                  : "Open Shopify checkout"}
            </Button>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {result?.checkoutEnabled
                ? "Opens the verified Shopify store’s HTTPS checkout in a new tab. A browser return does not confirm payment."
                : "Checkout is closed pending backend launch gates and explicit approval of the existing service IDs. Catalogue connectivity is not merchant approval or a full-store launch."}
            </p>
            <Button
              type="button"
              variant="ghost"
              disabled={loading || Boolean(pending)}
              onClick={onRefresh}
              className="mt-3 min-h-11 w-full"
            >
              Refresh estimates & availability
            </Button>
          </aside>
        </div>
      )}
      <div className="mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          Shopify account linkage, paid-event reconciliation and Signal Points
          integration are pending. No points are awarded from this cart or a
          browser checkout return. Existing account records remain separate.
        </p>
        <p className="mt-3">
          The guest cart session is managed by a server-owned secure cookie. No
          cart ID or secret key is stored in localStorage.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-accent hover:underline"
        >
          Review educational scopes{" "}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
