import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopifyServiceCatalog from "@/components/shopify/ShopifyServiceCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  MARKETPLACE_PRODUCTS,
  SALE_STATUS_LABELS,
  isMarketplacePurchasable,
} from "@shared/marketplace";
import { getProductImage } from "@shared/product-images";
import { getFamilyName, getResearchBrief } from "@shared/research";
import { getTier } from "@shared/rewards";
import { getCommerceProvider } from "@shared/commerce-provider";

const PAGE_SIZE = 12;
export default function Shop() {
  const shopifySelected =
    getCommerceProvider(import.meta.env.VITE_COMMERCE_PROVIDER) === "shopify";
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const linkedProduct = params.get("product");
  const linkedFamily = params.get("family") ?? "all";
  const { isAuthenticated, user } = useAuth();
  const rewards = trpc.rewards.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const checkout = trpc.checkout.createSession.useMutation();
  const interest = trpc.interest.join.useMutation();
  const [selectedId, setSelectedId] = useState(
    linkedProduct ?? MARKETPLACE_PRODUCTS[0].id
  );
  const [group, setGroup] = useState<
    "current" | "archive" | "tools" | "legacy"
  >("current");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState(linkedFamily);
  const [topic, setTopic] = useState("all");
  const [brand, setBrand] = useState("all");
  const [page, setPage] = useState(1);
  const [consent, setConsent] = useState(false);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  useEffect(() => {
    const product = MARKETPLACE_PRODUCTS.find(
      item => item.id === linkedProduct
    );
    if (product) {
      setSelectedId(product.id);
      setGroup(
        product.source === "prior-list"
          ? "current"
          : product.source === "supplier-image"
            ? "archive"
            : product.kind === "field-kit" || product.kind === "membership"
              ? "tools"
              : "legacy"
      );
      setQuery("");
      setTopic("all");
      setBrand("all");
      setFamily("all");
      setPage(1);
    }
  }, [linkedProduct]);
  useEffect(() => {
    setFamily(linkedFamily);
    if (linkedFamily !== "all") setGroup("current");
  }, [linkedFamily]);
  useEffect(() => {
    setPage(1);
  }, [group, query, family, topic, brand]);
  useEffect(() => {
    setConsent(false);
    setSavedFor(null);
  }, [isAuthenticated, user?.id]);
  const filtered = useMemo(
    () =>
      MARKETPLACE_PRODUCTS.filter(item => {
        const tool = item.kind === "field-kit" || item.kind === "membership";
        const inGroup =
          group === "current"
            ? item.source === "prior-list"
            : group === "archive"
              ? item.source === "supplier-image"
              : group === "tools"
                ? tool
                : item.source === "concept" && !tool;
        return (
          inGroup &&
          (family === "all" || item.familyId === family) &&
          (topic === "all" || item.topic === topic) &&
          (brand === "all" || item.manufacturerLabel === brand) &&
          `${item.title} ${item.quantityLabel ?? ""} ${item.description} ${item.topic ?? ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        );
      }),
    [group, query, family, topic, brand]
  );
  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0];
  useEffect(() => {
    setConsent(false);
  }, [selected?.id]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const points =
    isAuthenticated && !rewards.isError
      ? rewards.data?.account.pointsBalance
      : undefined;
  const topics = [
    ...new Set(
      MARKETPLACE_PRODUCTS.filter(p => p.source === "prior-list")
        .map(p => p.topic)
        .filter((t): t is string => Boolean(t))
    ),
  ];
  const families = [
    ...new Set(
      MARKETPLACE_PRODUCTS.filter(p => p.source === "prior-list")
        .map(p => p.familyId)
        .filter((t): t is string => Boolean(t))
    ),
  ];
  const clearFilters = () => {
    setQuery("");
    setFamily("all");
    setTopic("all");
    setBrand("all");
  };
  const selectGroup = (next: typeof group) => {
    setGroup(next);
    clearFilters();
  };
  const saveInterest = () => {
    if (!selected) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!consent) return;
    interest.mutate(
      { productId: selected.id, consent: true },
      {
        onSuccess: () => {
          setSavedFor(selected.id);
          toast.success("Interest saved", {
            description: "No order, reservation or approval has been created.",
          });
        },
        onError: error =>
          toast.error("Interest could not be saved", {
            description: error.message,
          }),
      }
    );
  };
  const buy = () => {
    if (shopifySelected || !selected || !isMarketplacePurchasable(selected))
      return;
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
        catalog: "marketplace",
        email: user?.email ?? undefined,
      },
      {
        onSuccess: ({ url }) => {
          checkoutTab.location.replace(url);
          toast.info("Secure checkout opened in a new tab.");
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
      <Nav />
      <main className="container pb-24 pt-28 md:pt-36">
        <Link
          href="/"
          className="mono inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> BACK TO BIOUPGRADE
        </Link>
        <header className="mt-8 grid gap-8 border-b border-border pb-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="mono text-xs tracking-[0.2em] text-accent">
              THE BIOUPGRADE SHOP · RESEARCH CATALOGUE
            </p>
            <h1 className="mt-5 text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02]">
              The molecular frontier.
              <br />
              <span className="text-accent">Read it precisely.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Explore the supplied compounds through molecular questions,
              source-linked papers and clearly stated specifications. The 27
              current-list variants sit alongside—not on top of—the evidence.
            </p>
          </div>
          <div className="space-y-4">
            <Link
              href="/research"
              className="btn-primary inline-flex min-h-12 items-center gap-3 px-5 text-sm"
            >
              <BookOpen className="h-4 w-4" /> See the evidence
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Research materials are not for human or animal use. Listed prices
              and brand labels are owner-provided; batch documents, stock and
              the eligible procurement route remain to be verified.
            </p>
          </div>
        </header>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-label="Product catalogue" className="min-w-0">
            <div
              className="flex flex-wrap gap-2"
              aria-label="Catalogue sections"
            >
              {(
                [
                  ["current", "Current catalogue"],
                  ["archive", "Attachment archive"],
                  ["tools", "Learning concepts"],
                  ["legacy", "Legacy review links"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={group === value}
                  onClick={() => selectGroup(value)}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${group === value ? "border-foreground bg-foreground text-white" : "border-border bg-white hover:border-accent"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {group !== "current" && (
              <div className="mt-5 rounded-xl border border-border bg-white/70 p-5 text-sm leading-relaxed text-muted-foreground">
                {group === "archive"
                  ? "These are the attachment’s original prices and labels, not the current 27-item list. Conflicting values remain visible and are never silently merged."
                  : group === "tools"
                    ? "These legacy learning concepts are retained for saved-interest continuity. They are not confirmed stock, an active membership or an available order."
                    : "Existing review links remain available for saved-account continuity; they are not a new procurement or approval service."}
              </div>
            )}
            <div className="mt-6 space-y-3">
              <label className="relative block">
                <span className="sr-only">Search catalogue</span>
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search compound, quantity or research question"
                  className="h-11 bg-white pl-10"
                />
              </label>
              {group === "current" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Research topic
                    </span>
                    <select
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
                    >
                      <option value="all">All topics</option>
                      {topics.map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Compound family
                    </span>
                    <select
                      value={family}
                      onChange={e => setFamily(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
                    >
                      <option value="all">All families</option>
                      {families.map(f => (
                        <option key={f} value={f}>
                          {getFamilyName(f)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Brand label
                    </span>
                    <select
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
                    >
                      <option value="all">All labels</option>
                      <option>ZPHC</option>
                      <option>EVOPEP</option>
                      <option value="Not provided">Not provided</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
            <p
              className="mono mt-5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"} ·
              listed prices in EUR · no research-material checkout
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {visible.map(item => {
                const image =
                  item.image ?? getProductImage(item.id, item.familyId);
                const brief = getResearchBrief(item.familyId);
                return (
                  <article
                    key={item.id}
                    className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-colors ${selected?.id === item.id ? "border-accent" : "border-border hover:border-accent/60"}`}
                  >
                    <Link
                      href={`/shop/${item.id}`}
                      className="block bg-[#f5f8f4] p-5"
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className={`aspect-[4/3] w-full ${image.type === "illustrative laboratory" ? "object-cover" : "object-contain"}`}
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="mono text-[10px] tracking-[0.1em] text-accent">
                          {item.topic ?? item.eyebrow}
                        </p>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] text-foreground/65">
                          {SALE_STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <h2 className="mt-4 break-words text-[21px] leading-snug">
                        <Link
                          href={`/shop/${item.id}`}
                          className="hover:text-accent"
                        >
                          {item.title}
                        </Link>
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      {brief && (
                        <p className="mono mt-4 text-[10px] text-muted-foreground">
                          {brief.papers.length} linked{" "}
                          {brief.papers.length === 1 ? "paper" : "papers"} ·{" "}
                          {brief.evidenceLevel}
                        </p>
                      )}
                      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                        {image.caption}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 mt-5">
                        <span className="mono text-lg">{item.priceLabel}</span>
                        <Link
                          href={`/shop/${item.id}`}
                          className="inline-flex min-h-11 items-center gap-2 text-sm text-accent"
                        >
                          Details <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <button
                        type="button"
                        aria-pressed={selected?.id === item.id}
                        onClick={() => {
                          setSelectedId(item.id);
                          const panel =
                            document.getElementById("product-interest");
                          if (panel)
                            window.scrollTo({
                              top:
                                window.scrollY +
                                panel.getBoundingClientRect().top -
                                96,
                              behavior: window.matchMedia(
                                "(prefers-reduced-motion: reduce)"
                              ).matches
                                ? "auto"
                                : "smooth",
                            });
                        }}
                        className="mt-2 min-h-11 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:border-accent hover:text-accent"
                      >
                        Select for account interest
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {!filtered.length && (
              <div className="mt-5 rounded-xl border border-border bg-white p-8 text-center">
                <p>No matching catalogue entries.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 min-h-11 text-sm text-accent underline"
                >
                  Clear filters
                </button>
              </div>
            )}
            {pages > 1 && (
              <nav
                className="mt-6 flex items-center justify-between"
                aria-label="Catalogue pagination"
              >
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="mono text-xs text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  Next
                </Button>
              </nav>
            )}
            <p className="mt-7 text-xs leading-relaxed text-muted-foreground">
              A paper concerns a named research entity, not a supplied batch.
              Brand labels and price lists are not analytical certificates.
              Evidence labels describe study design and identity limits—not
              product authorisation.{" "}
              <Link href="/documentation" className="text-accent underline">
                Read our documentation standard.
              </Link>
            </p>
          </section>
          <aside className="self-start space-y-5 lg:sticky lg:top-24">
            <section className="rounded-2xl bg-foreground p-6 text-white">
              <p className="mono text-[10px] tracking-[0.2em] text-secondary">
                YOUR SIGNAL
              </p>
              <p className="mt-4 text-4xl">
                {points !== undefined ? points.toLocaleString() : "—"}
              </p>
              <p className="mt-3 text-sm text-white/80">
                {!isAuthenticated
                  ? "Sign in to see your record."
                  : rewards.isError
                    ? "Points service unavailable."
                    : rewards.isLoading
                      ? "Loading your record…"
                      : points !== undefined
                        ? getTier(points).label
                        : "No account data available."}
              </p>
              <Link
                href="/account"
                className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm text-secondary hover:text-white"
              >
                Open account <ArrowUpRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-white/65">
                Research-material purchases do not earn purchase or referral
                points. Tiers do not establish procurement eligibility.
              </p>
            </section>
            {selected && (
              <section
                id="product-interest"
                className="scroll-mt-24 rounded-2xl border border-border bg-white p-6"
              >
                <p className="mono text-[10px] tracking-[0.18em] text-accent">
                  SELECTED ENTRY
                </p>
                <h2 className="mt-4 break-words text-2xl leading-snug">
                  {selected.title}
                </h2>
                <p className="mono mt-3 text-xs text-muted-foreground">
                  {selected.quantityLabel
                    ? `Listed quantity: ${selected.quantityLabel}`
                    : selected.eyebrow}
                </p>
                <p className="mono mt-5 text-lg">{selected.priceLabel}</p>
                <Link
                  href={`/shop/${selected.id}`}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-accent"
                >
                  Specifications & papers <ArrowUpRight className="h-4 w-4" />
                </Link>
                <div className="mt-4 flex gap-2 border-y border-border py-4 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p>{selected.complianceNote}</p>
                </div>
                {!shopifySelected && isMarketplacePurchasable(selected) ? (
                  <Button
                    className="mt-5 min-h-12 w-full"
                    onClick={buy}
                    disabled={checkout.isPending}
                  >
                    <WalletCards className="mr-2 h-4 w-4" />
                    {checkout.isPending ? "Preparing…" : "Open Stripe checkout"}
                  </Button>
                ) : (
                  <>
                    <p className="mt-5 text-sm font-medium">
                      Specifications before procurement
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Save this interest to your account; it is not an order,
                      reservation, buyer approval or email subscription. No
                      automated notifications are enabled.
                    </p>
                    {isAuthenticated && (
                      <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={e => setConsent(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>
                          I agree to store this product interest with my account
                          for availability review.
                        </span>
                      </label>
                    )}
                    <Button
                      onClick={saveInterest}
                      disabled={
                        interest.isPending || (isAuthenticated && !consent)
                      }
                      variant="outline"
                      className="mt-4 min-h-11 w-full"
                    >
                      {interest.isPending
                        ? "Saving…"
                        : !isAuthenticated
                          ? "Sign in to save interest"
                          : savedFor === selected.id
                            ? "Interest saved · update"
                            : "Save interest"}
                    </Button>
                    {savedFor === selected.id && (
                      <p role="status" className="mt-3 text-xs text-accent">
                        Saved. No payment has been requested.
                      </p>
                    )}
                  </>
                )}
              </section>
            )}
            <section className="rounded-2xl border border-border bg-secondary/40 p-6">
              <p className="mono text-[10px] tracking-[0.16em] text-accent">
                READ WITH A HUMAN
              </p>
              <h2 className="mt-3 text-xl">A sharper research question.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Educational consultations help unpack methods, endpoints and
                uncertainty. They do not prescribe compounds or authorise human
                use.
              </p>
              <Link
                href="/book"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-accent"
              >
                Discuss the evidence <ArrowUpRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>
        {shopifySelected && <ShopifyServiceCatalog />}
      </main>
      <Footer />
    </div>
  );
}
