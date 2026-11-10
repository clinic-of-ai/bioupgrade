import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const surface = "rounded-[18px] border border-accent/20 bg-white/55";
export const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
export const label = "mono text-[11px] tracking-[0.16em] text-muted-foreground";
type AccountOrder = {
  id: string | number;
  productTitle: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: Date | string;
  fulfilledAt?: Date | string | null;
  stripeSessionId?: string | null;
};

export function dateLabel(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function moneyLabel(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function statusLabel(status: string) {
  const known: Record<string, string> = {
    created: "Checkout created",
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    canceled: "Cancelled",
    cancelled: "Cancelled",
    refunded: "Refunded",
    disputed: "Disputed",
    partially_refunded: "Partially refunded",
    attributed: "Attributed",
    qualified: "Qualified · on hold",
    released: "Reward released",
    rewarded: "Reward released",
    earned: "Reward released",
    revoked: "Reward reversed",
    reversed: "Reversed",
    capped: "Monthly cap reached",
    expired: "Expired",
  };
  return known[status] ?? status.replace(/[_-]/g, " ");
}

export function Status({ value }: { value: string }) {
  const positive = ["paid", "released", "rewarded", "earned"].includes(value);
  const caution = ["failed", "disputed", "reversed", "revoked"].includes(value);
  return (
    <span
      className={`mono inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] ${positive ? "border-accent/25 bg-accent/10 text-foreground" : caution ? "border-destructive/25 bg-destructive/5 text-destructive" : "border-foreground/15 bg-foreground/5 text-foreground"}`}
    >
      {statusLabel(value)}
    </span>
  );
}

export function Panel({
  id,
  title,
  eyebrow,
  children,
  action,
}: {
  id: string;
  title: string;
  eyebrow: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={surface}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-accent/15 p-6 md:p-8">
        <div>
          <p className={label}>{eyebrow}</p>
          <h2 id={id} className="mt-3 text-[28px] leading-tight">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="p-6 md:p-8">
      <p className="font-medium">{title}</p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

export function CheckoutNotice({
  state,
  order,
  expired,
  refreshing,
  onRefresh,
}: {
  state: string | null;
  order?: AccountOrder;
  expired: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (state !== "processing" && state !== "cancelled" && state !== "success")
    return null;
  const verifiedPaid = order?.status === "paid";
  let title = "Payment verification pending; this page is not proof of payment";
  let detail =
    "Only a server-verified payment for the returned order can confirm its status. Check the order history below or refresh this page's account data.";
  if (state === "cancelled") {
    title = "Checkout was closed";
    detail =
      "A closed checkout does not guarantee that no charge occurred. Check your order status and payment provider before trying again.";
  } else if (verifiedPaid) {
    title = `Order ${order.id} is recorded as paid`;
    detail =
      "This status comes from your account's server record, not the checkout URL. It does not confirm delivery or membership access; refunds and disputes remain separate.";
  } else if (
    order &&
    [
      "failed",
      "canceled",
      "cancelled",
      "refunded",
      "disputed",
      "partially_refunded",
    ].includes(order.status)
  ) {
    title = `Returned order: ${statusLabel(order.status)}`;
    detail =
      "The status below is the current server record for this specific order. A URL parameter does not establish payment or fulfilment.";
  } else if (expired && state === "processing") {
    detail =
      "Automatic checks have paused after one minute. Payment remains unconfirmed here; use Refresh status to check again. Do not retry a purchase solely because verification is delayed.";
  }
  return (
    <section
      aria-label="Checkout return status"
      aria-live="polite"
      className="mt-8 rounded-[14px] border border-accent/30 bg-accent/5 p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="font-medium">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
          className="min-h-11 border-accent/25 bg-white/55"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          {refreshing ? "Checking…" : "Refresh status"}
        </Button>
      </div>
    </section>
  );
}
