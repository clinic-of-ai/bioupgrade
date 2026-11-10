import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  pendingReferral,
  rememberReferral,
  forgetReferral,
} from "@/lib/pending-referral";
import { getCommerceProvider } from "@shared/commerce-provider";
import * as rewardRules from "@shared/rewards";
import InterestPanel from "@/components/account/InterestPanel";

import {
  surface,
  focus,
  label,
  dateLabel,
  moneyLabel,
  Status,
  Panel,
  EmptyState,
  CheckoutNotice,
} from "@/components/account/AccountPanels";

const POLL_INTERVAL_MS = 5_000;
const POLL_WINDOW_MS = 60_000;

type Benefit = { label: string; available: boolean };
// Keep the baseline honest while the shared benefit helper is being restored.
const getBenefits = (
  rewardRules as typeof rewardRules & {
    getTierBenefits?: (tierId: string) => Benefit[];
  }
).getTierBenefits;

export default function Account() {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    logout,
  } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const checkoutState = params.get("checkout");
  const returnedOrderId = params.get("order") ?? params.get("orderId");
  const initialReferral = params.get("ref") ?? pendingReferral();
  const [referralCode, setReferralCode] = useState(initialReferral);
  const [referralMessage, setReferralMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [copyMessage, setCopyMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [pollExpired, setPollExpired] = useState(false);
  const [pollStartedAt, setPollStartedAt] = useState(() => Date.now());

  useEffect(() => {
    setReferralCode(initialReferral);
    setReferralMessage(null);
  }, [initialReferral]);

  useEffect(() => {
    setPollStartedAt(Date.now());
    setPollExpired(false);
    if (checkoutState !== "processing" || !isAuthenticated) return;
    const timeout = window.setTimeout(
      () => setPollExpired(true),
      POLL_WINDOW_MS
    );
    return () => window.clearTimeout(timeout);
  }, [checkoutState, returnedOrderId, isAuthenticated]);

  const account = trpc.account.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchIntervalInBackground: false,
    refetchInterval: query => {
      if (
        !isAuthenticated ||
        checkoutState !== "processing" ||
        !returnedOrderId ||
        pollExpired ||
        Date.now() - pollStartedAt >= POLL_WINDOW_MS ||
        query.state.error
      )
        return false;
      const ownedOrder = query.state.data?.orders.find(
        order => String(order.id) === returnedOrderId
      );
      if (ownedOrder && !["created", "pending"].includes(ownedOrder.status))
        return false;
      return POLL_INTERVAL_MS;
    },
  });
  const utils = trpc.useUtils();
  const applyCode = trpc.referrals.applyCode.useMutation({
    onSuccess: () => {
      forgetReferral();
      setReferralMessage({
        text: "Referral code applied. Any reward remains subject to the qualifying purchase, hold period and cap.",
        error: false,
      });
      void utils.account.me.invalidate();
    },
    onError: error =>
      setReferralMessage({
        text:
          error.message || "The code could not be applied. Please try again.",
        error: true,
      }),
  });

  // Never render cached account data after logout or present stale data as current after an error.
  const data = isAuthenticated && !account.isError ? account.data : undefined;
  const returnedOrder = returnedOrderId
    ? data?.orders.find(order => String(order.id) === returnedOrderId)
    : undefined;
  const points = data?.account.pointsBalance;
  const tier = points === undefined ? null : rewardRules.getTier(points);
  const nextTier =
    points === undefined ? null : rewardRules.getNextTier(points);
  const progress =
    points === undefined
      ? 0
      : Math.max(0, Math.min(100, rewardRules.getTierProgress(points)));
  const benefits = tier
    ? (getBenefits?.(tier.id) ?? [
        { label: "Account history", available: true },
        { label: "Additional tier benefits not launched", available: false },
      ])
    : [];
  const referralLink =
    data?.referral.code && typeof window !== "undefined"
      ? `${window.location.origin}/account?ref=${encodeURIComponent(data.referral.code)}`
      : "";

  const login = async () => {
    setSessionMessage(null);
    try {
      rememberReferral(initialReferral);
      if (!(await startLogin()))
        setSessionMessage(
          "Sign-in is currently unavailable. No account has been connected here."
        );
    } catch {
      setSessionMessage(
        "Sign-in is currently unavailable. Please try again later; no account has been created or connected here."
      );
    }
  };
  const signOut = async () => {
    setSigningOut(true);
    setSessionMessage(null);
    try {
      await logout();
      forgetReferral();
    } catch {
      setSessionMessage("Sign-out could not be confirmed. Please retry.");
    } finally {
      setSigningOut(false);
    }
  };
  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(referralLink);
      setCopyMessage({ text: "Referral link copied.", error: false });
    } catch {
      setCopyMessage({
        text: "Copy is unavailable in this browser. Select the link above and copy it manually.",
        error: true,
      });
    }
  };
  const submitReferral = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = referralCode.trim();
    if (!code || applyCode.isPending) return;
    setReferralMessage(null);
    applyCode.mutate({ code });
  };

  const loadingData = isAuthenticated && !account.isError && !data;
  const unavailable = isAuthenticated && account.isError;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav slim />
      <main className="container pb-24 pt-28 md:pt-36">
        <Link
          href="/shop"
          className={`mono inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground ${focus}`}
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> BACK TO SHOP
        </Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-6 border-b border-accent/20 pb-8 md:mt-8 md:pb-10">
          <div>
            <p className={`${label} text-accent`}>YOUR BIOUPGRADE ACCOUNT</p>
            <h1 className="mt-4 text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.02]">
              Your signal.
              <br />
              <span className="text-accent">On record.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Points, orders and referrals — a clear history of your
              participation, with no shortcuts around product eligibility.
            </p>
          </div>
          {isAuthenticated && (
            <div className="space-y-3 text-sm">
              <p>Signed in{user?.name ? ` as ${user.name}` : ""}</p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 border-accent/25 bg-white/40"
                onClick={signOut}
                disabled={signingOut}
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          )}
        </header>
        {getCommerceProvider(import.meta.env.VITE_COMMERCE_PROVIDER) ===
          "shopify" && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-border bg-white p-5 text-sm leading-relaxed text-muted-foreground"
          >
            Existing account and Signal Points records are preserved. New
            Shopify orders are not yet linked to this ledger; carts and checkout
            returns do not award points. Verified order events and customer
            linkage are required before that integration is activated.
          </p>
        )}
        {sessionMessage && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {sessionMessage}
          </p>
        )}

        {authLoading ? (
          <section
            aria-busy="true"
            aria-live="polite"
            className={`${surface} mt-8 p-8`}
          >
            <p className="flex items-center gap-3">
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              Checking your sign-in…
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Account records are not loaded until your session is verified.
            </p>
          </section>
        ) : authError && !isAuthenticated ? (
          <section className={`${surface} mt-8 p-8`} role="alert">
            <h2 className="text-[28px]">Sign-in status unavailable</h2>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              We could not verify your session. No points or order totals can be
              shown reliably right now.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 min-h-11"
              onClick={() => window.location.reload()}
            >
              Retry session check
            </Button>
          </section>
        ) : !isAuthenticated ? (
          <>
            {checkoutState && (
              <div
                role="status"
                className="mt-8 rounded-[14px] border border-accent/25 p-5 text-sm leading-relaxed text-muted-foreground"
              >
                {checkoutState === "cancelled"
                  ? "Checkout was closed. This does not guarantee that no charge occurred; sign in to check your own order records."
                  : "Payment verification pending; this page is not proof of payment. Sign in to check the relevant order in your account."}
              </div>
            )}
            <section
              className={`${surface} mt-8 grid gap-8 p-6 md:grid-cols-[1.2fr_1fr] md:p-10`}
            >
              <div>
                <p className={label}>A PRIVATE, AUTHENTICATED RECORD</p>
                <h2 className="mt-4 text-[32px]">
                  Keep your upgrades
                  <br />
                  in one place.
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Sign in to view your actual Signal Points balance, tier
                  progress, payment statuses and referral history. No sample
                  account or estimated balance is shown.
                </p>
                <Button
                  type="button"
                  className="mt-6 min-h-12 rounded-[10px] bg-accent px-6 text-white hover:bg-accent/90"
                  onClick={login}
                >
                  Sign in to your account
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Button>
                {initialReferral && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    A referral code is in this link. Sign in and explicitly
                    apply it below; opening this page does not attribute a
                    referral.
                  </p>
                )}
              </div>
              <div className="border-t border-accent/20 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <p className={label}>HOW SIGNAL POINTS WORK</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Earn 1 base point per net eligible euro of verified
                  ordinary-commerce purchases, excluding tax and shipping.
                  Points have no cash value.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  They do not change product safety, medical status or
                  eligibility. Refunds and disputes can reverse purchase and
                  referral rewards.
                </p>
                <Link
                  href="/shop"
                  className={`mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-foreground underline underline-offset-4 ${focus}`}
                >
                  Explore the shop
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </>
        ) : (
          <>
            <CheckoutNotice
              state={checkoutState}
              order={returnedOrder}
              expired={pollExpired}
              refreshing={account.isFetching}
              onRefresh={() => {
                void account.refetch();
              }}
            />
            {unavailable ? (
              <section role="alert" className={`${surface} mt-8 p-6 md:p-8`}>
                <p className={label}>ACCOUNT DATA UNAVAILABLE</p>
                <h2 className="mt-4 text-[28px]">
                  We cannot load your records.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  The account service could not return your data. This is not a
                  zero balance or an empty order history. Your payment status
                  also remains unconfirmed here.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={account.isFetching}
                  onClick={() => {
                    void account.refetch();
                  }}
                  className="mt-6 min-h-11"
                >
                  <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  {account.isFetching ? "Retrying…" : "Retry account data"}
                </Button>
              </section>
            ) : loadingData ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2" aria-busy="true">
                <section className={`${surface} p-8`} aria-live="polite">
                  <p className="flex items-center gap-3">
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 motion-safe:animate-spin"
                    />
                    Loading points and tier…
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Waiting for your account balance.
                  </p>
                </section>
                <section className={`${surface} p-8`}>
                  <p role="status">Loading orders…</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Payment and fulfilment history is being retrieved.
                  </p>
                </section>
                <section className={`${surface} p-8`}>
                  <p role="status">Loading points ledger…</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Waiting for your recorded rewards events.
                  </p>
                </section>
                <section className={`${surface} p-8`}>
                  <p role="status">Loading referrals…</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Waiting for your code and referral records.
                  </p>
                </section>
              </div>
            ) : data && tier && points !== undefined ? (
              <div className="mt-8 space-y-6 md:space-y-8">
                <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                  <section
                    aria-labelledby="signal-balance"
                    className="rounded-[18px] border border-foreground/15 bg-foreground p-6 text-white md:p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p
                        id="signal-balance"
                        className="mono text-[11px] tracking-[0.16em] text-white/75"
                      >
                        AVAILABLE SIGNAL POINTS
                      </p>
                      <span className="mono rounded-full border border-white/25 px-3 py-1 text-[11px]">
                        {tier.label}
                      </span>
                    </div>
                    <p className="mono mt-7 text-[clamp(3rem,7vw,5rem)] leading-none tabular-nums">
                      {points.toLocaleString()}
                    </p>
                    <div className="mt-7 flex flex-wrap justify-between gap-2 text-sm text-white/80">
                      <span>
                        {nextTier
                          ? `${Math.max(0, nextTier.minPoints - points).toLocaleString()} points to ${nextTier.label}`
                          : "Highest published tier reached"}
                      </span>
                      <span className="mono text-xs">{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label="Progress within your current Signal tier"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      aria-valuetext={
                        nextTier
                          ? `${progress}% toward ${nextTier.label}`
                          : "Highest published tier"
                      }
                      className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20"
                    >
                      <div
                        className="h-full rounded-full bg-[#9ee8ad]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-6 border-t border-white/20 pt-5 text-xs leading-relaxed text-white/75">
                      Lifetime points recorded:{" "}
                      <span className="mono">
                        {data.account.lifetimePoints.toLocaleString()}
                      </span>
                      . Current tier follows your available balance and may
                      change after reversals.
                    </p>
                  </section>
                  <section
                    aria-labelledby="tier-benefits"
                    className={`${surface} p-6 md:p-8`}
                  >
                    <p className={label}>YOUR CURRENT TIER</p>
                    <h2 id="tier-benefits" className="mt-4 text-[32px]">
                      {tier.label}, clearly defined.
                    </h2>
                    <ul className="mt-6 divide-y divide-accent/15">
                      {benefits.map(benefit => (
                        <li
                          key={benefit.label}
                          className="flex items-start justify-between gap-4 py-3 text-sm"
                        >
                          <span className="flex gap-2">
                            {benefit.available && (
                              <Check
                                aria-hidden="true"
                                className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                              />
                            )}
                            {benefit.label}
                          </span>
                          <span className="mono shrink-0 text-[10px] text-muted-foreground">
                            {benefit.available ? "AVAILABLE" : "NOT LIVE"}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                      1 base point per net eligible euro, excluding tax and
                      shipping. Points have no cash value and do not alter
                      product eligibility or medical status. Purchase rewards
                      may reverse after refunds or disputes.
                    </p>
                  </section>
                </div>

                <Panel
                  id="account-orders"
                  title="Your orders"
                  eyebrow="01 / PAYMENT RECORD"
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={account.isFetching}
                      onClick={() => {
                        void account.refetch();
                      }}
                      className="min-h-11 border-accent/25"
                    >
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      {account.isFetching ? "Refreshing…" : "Refresh records"}
                    </Button>
                  }
                >
                  {data.orders.length === 0 ? (
                    <EmptyState title="No orders recorded yet.">
                      Verified account-linked orders will appear here. A
                      checkout URL alone does not create a paid order.
                    </EmptyState>
                  ) : (
                    <div
                      role="region"
                      aria-label="Order history, horizontally scrollable"
                      tabIndex={0}
                      className={`overflow-x-auto ${focus}`}
                    >
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <caption className="sr-only">
                          Your account-linked orders and current server-recorded
                          payment status
                        </caption>
                        <thead className="mono border-b border-accent/15 text-[10px] tracking-[0.1em] text-muted-foreground">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 font-normal md:pl-8"
                            >
                              ORDER / PRODUCT
                            </th>
                            <th scope="col" className="px-4 py-4 font-normal">
                              DATE
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-4 text-right font-normal"
                            >
                              AMOUNT
                            </th>
                            <th scope="col" className="px-4 py-4 font-normal">
                              STATUS
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 font-normal md:pr-8"
                            >
                              PAYMENT RECORDED
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/15">
                          {data.orders.map(order => (
                            <tr key={order.id}>
                              <th
                                scope="row"
                                className="max-w-[280px] px-6 py-5 font-normal md:pl-8"
                              >
                                <span className="block break-words font-medium">
                                  {order.productTitle}
                                </span>
                                <span className="mono mt-1 block text-[10px] text-muted-foreground">
                                  #{order.id}
                                </span>
                              </th>
                              <td className="whitespace-nowrap px-4 py-5 text-muted-foreground">
                                {dateLabel(order.createdAt)}
                              </td>
                              <td className="mono whitespace-nowrap px-4 py-5 text-right text-xs tabular-nums">
                                {moneyLabel(order.amountCents, order.currency)}
                              </td>
                              <td className="px-4 py-5">
                                <Status value={order.status} />
                              </td>
                              <td className="whitespace-nowrap px-6 py-5 text-xs text-muted-foreground md:pr-8">
                                {order.fulfilledAt
                                  ? dateLabel(order.fulfilledAt)
                                  : "Not recorded"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="border-t border-accent/15 px-6 py-4 text-xs leading-relaxed text-muted-foreground md:px-8">
                    Pending means payment is not confirmed. The processing date
                    records internal payment handling, not shipment, delivery or
                    membership access. Refunds and disputes retain their own
                    statuses.
                  </p>
                </Panel>

                <InterestPanel />
                <Panel
                  id="account-ledger"
                  title="The points ledger"
                  eyebrow="02 / RECORDED ACTIVITY"
                >
                  {data.events.length === 0 ? (
                    <EmptyState title="No points events yet.">
                      Earned points and any reward reversals will be listed
                      separately, with their dates and recorded notes.
                    </EmptyState>
                  ) : (
                    <div
                      role="region"
                      aria-label="Points ledger, horizontally scrollable"
                      tabIndex={0}
                      className={`overflow-x-auto ${focus}`}
                    >
                      <table className="w-full min-w-[600px] text-left text-sm">
                        <caption className="sr-only">
                          Recorded Signal Points credits and debits
                        </caption>
                        <thead className="mono border-b border-accent/15 text-[10px] tracking-[0.1em] text-muted-foreground">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 font-normal md:pl-8"
                            >
                              ACTIVITY / NOTE
                            </th>
                            <th scope="col" className="px-4 py-4 font-normal">
                              DATE
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-right font-normal md:pr-8"
                            >
                              POINTS
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/15">
                          {data.events.map(event => (
                            <tr key={event.id}>
                              <th
                                scope="row"
                                className="max-w-xl px-6 py-5 font-normal md:pl-8"
                              >
                                <span className="block capitalize">
                                  {event.eventType.replace(/[_-]/g, " ")}
                                </span>
                                <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">
                                  {event.note || "No additional note recorded."}
                                </span>
                                {event.referenceId && (
                                  <span className="mono mt-2 block break-all text-[10px] text-muted-foreground">
                                    Reference: {event.referenceId}
                                  </span>
                                )}
                              </th>
                              <td className="whitespace-nowrap px-4 py-5 text-muted-foreground">
                                {dateLabel(event.createdAt)}
                              </td>
                              <td
                                className={`mono whitespace-nowrap px-6 py-5 text-right tabular-nums md:pr-8 ${event.points < 0 ? "text-destructive" : "text-foreground"}`}
                              >
                                {event.points > 0 ? "+" : ""}
                                {event.points.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                <Panel
                  id="account-referrals"
                  title="Share the signal"
                  eyebrow="03 / REFERRALS, WITH BOUNDARIES"
                >
                  <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-2">
                    <div>
                      <label
                        htmlFor="account-referral-link"
                        className="block text-sm font-medium"
                      >
                        Your referral link
                      </label>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Your code:{" "}
                        <span className="mono break-all text-foreground">
                          {data.referral.code}
                        </span>
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="account-referral-link"
                          readOnly
                          value={referralLink}
                          onFocus={event => event.currentTarget.select()}
                          className="h-11 min-w-0 border-accent/25 bg-background text-xs"
                          aria-describedby="referral-copy-message"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={copyReferral}
                          disabled={!referralLink}
                          className="min-h-11 shrink-0 border-accent/25"
                        >
                          <Copy aria-hidden="true" className="h-4 w-4" />
                          Copy link
                        </Button>
                      </div>
                      <p
                        id="referral-copy-message"
                        aria-live="polite"
                        className={`mt-2 min-h-5 text-xs ${copyMessage?.error ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {copyMessage?.text ??
                          "Opening a referral link does not apply a code automatically."}
                      </p>
                    </div>
                    <form
                      onSubmit={submitReferral}
                      aria-busy={applyCode.isPending}
                    >
                      <label
                        htmlFor="account-referral-code"
                        className="block text-sm font-medium"
                      >
                        Have a referral code?
                      </label>
                      <p
                        id="referral-code-help"
                        className="mt-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        Apply it explicitly. Attribution is single-use; your own
                        code cannot be used.
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="account-referral-code"
                          name="referralCode"
                          value={referralCode}
                          onChange={event => {
                            setReferralCode(event.target.value);
                            setReferralMessage(null);
                          }}
                          disabled={applyCode.isPending}
                          required
                          minLength={8}
                          maxLength={32}
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="Referral code"
                          aria-describedby="referral-code-help referral-apply-message"
                          aria-invalid={referralMessage?.error || undefined}
                          className="h-11 min-w-0 border-accent/25 bg-background mono text-sm"
                        />
                        <Button
                          type="submit"
                          disabled={applyCode.isPending || !referralCode.trim()}
                          className="min-h-11 shrink-0 rounded-[10px] bg-accent text-white hover:bg-accent/90"
                        >
                          {applyCode.isPending ? "Applying…" : "Apply code"}
                        </Button>
                      </div>
                      <p
                        id="referral-apply-message"
                        aria-live="polite"
                        role={referralMessage?.error ? "alert" : "status"}
                        className={`mt-2 min-h-5 text-xs leading-relaxed ${referralMessage?.error ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {referralMessage?.text}
                      </p>
                    </form>
                  </div>
                  <div className="border-y border-accent/15 bg-accent/5 px-6 py-5 text-xs leading-relaxed text-muted-foreground md:px-8">
                    <p>
                      <strong className="font-medium text-foreground">
                        {data.referral.rules.rewardPoints.toLocaleString()}{" "}
                        points per qualifying referral.
                      </strong>{" "}
                      The referred account must make its first qualifying
                      eligible ordinary-commerce purchase within 30 days of
                      attribution. Research products do not qualify.
                    </p>
                    <p className="mt-2">
                      Rewards remain pending for {data.referral.rules.holdDays}{" "}
                      days after qualification, with a maximum of{" "}
                      {data.referral.rules.maxPerMonth} rewarded referrals per
                      month. Refunds and disputes can cancel or reverse rewards.
                      Pending points are not an available balance.
                    </p>
                  </div>
                  {data.referral.records.length === 0 ? (
                    <EmptyState title="No referral activity recorded.">
                      Referral statuses appear here without identifying the
                      person referred. Share your link only with people who want
                      it.
                    </EmptyState>
                  ) : (
                    <div
                      role="region"
                      aria-label="Referral activity, horizontally scrollable"
                      tabIndex={0}
                      className={`overflow-x-auto ${focus}`}
                    >
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <caption className="sr-only">
                          Referral records without referred people's identifying
                          information
                        </caption>
                        <thead className="mono border-b border-accent/15 text-[10px] tracking-[0.1em] text-muted-foreground">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 font-normal md:pl-8"
                            >
                              RECORD
                            </th>
                            <th scope="col" className="px-4 py-4 font-normal">
                              CREATED
                            </th>
                            <th scope="col" className="px-4 py-4 font-normal">
                              STATUS
                            </th>
                            <th scope="col" className="px-4 py-4 font-normal">
                              QUALIFIED / RELEASE
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-right font-normal md:pr-8"
                            >
                              RECORDED POINTS
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/15">
                          {data.referral.records.map(record => (
                            <tr key={record.id}>
                              <th
                                scope="row"
                                className="mono px-6 py-5 text-xs font-normal md:pl-8"
                              >
                                #{record.id}
                              </th>
                              <td className="whitespace-nowrap px-4 py-5 text-xs text-muted-foreground">
                                {dateLabel(record.createdAt)}
                              </td>
                              <td className="px-4 py-5">
                                <Status value={record.status} />
                              </td>
                              <td className="px-4 py-5 text-xs text-muted-foreground">
                                <p>
                                  {record.qualifiedAt
                                    ? dateLabel(record.qualifiedAt)
                                    : "Not qualified"}
                                </p>
                                {record.releaseAt && (
                                  <p className="mt-1">
                                    Release date: {dateLabel(record.releaseAt)}
                                  </p>
                                )}
                              </td>
                              <td className="mono px-6 py-5 text-right text-xs tabular-nums md:pr-8">
                                {record.rewardPoints == null
                                  ? "—"
                                  : record.rewardPoints.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                <Panel
                  id="account-missions"
                  title="Ways to participate"
                  eyebrow="04 / SERVER-VERIFIED REWARDS"
                >
                  <div className="grid divide-y divide-accent/15 md:grid-cols-3 md:divide-x md:divide-y-0">
                    {data.missions.map(mission => (
                      <article key={mission.id} className="p-6 md:p-8">
                        <p className="mono text-xs text-muted-foreground">
                          {mission.points} POINTS · SUBJECT TO RULES
                        </p>
                        <h3 className="mt-4 text-[22px] leading-tight">
                          {mission.label}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {mission.description}
                        </p>
                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                          {mission.id === "first-purchase"
                            ? "Awarded only if a qualifying purchase is verified by the server. No client-side completion claim."
                            : mission.id === "bring-a-researcher"
                              ? "Uses the referral qualification, hold and cap rules above. Opening or sharing a link is not a completed referral."
                              : "No claim action is available here. Reading or clicking alone does not award points."}
                        </p>
                      </article>
                    ))}
                  </div>
                  <p className="border-t border-accent/15 px-6 py-4 text-xs leading-relaxed text-muted-foreground md:px-8">
                    These descriptions do not establish completion or a pending
                    award. Only recorded server-side events in your ledger count
                    toward the balance.
                  </p>
                </Panel>
              </div>
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
