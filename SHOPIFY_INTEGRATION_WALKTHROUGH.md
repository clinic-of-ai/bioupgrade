# Bioupgrade: design-preserving Shopify integration

**10 November2026.** This document explains the applied source changes, current content architecture and the remaining launch steps. It is not a claim that a permanent deployment or live Shopify payment has completed.

## What is chosen—and what stays unchanged

The current choice is **the existing custom Bioupgrade frontend with Shopify behind it**, not a Shopify theme replacement. React19, Wouter, Vite, Express, the mint/forest/Geist visual system, the hero/logo, research library, Meta, community, consultation qualification and protected account are retained. Shopify supplies its published service products, variants, availability, prices, cart calculations and a hosted checkout when the launch gates are satisfied.

The earlier design-preserving analysis is reproduced separately as `SHOPIFY_VS_CURRENT_BIOUPGRADE_2026-11-10.md`. It compared retaining custom Stripe, using a Shopify theme and using Shopify headlessly. Its observations describe the pre-implementation audit; this walkthrough describes the subsequently applied source. The initial Stripe choice is a historical phase, not the active checkout selection after the owner’s10November instruction.

The supplied store is `6v43dx-ck.myshopify.com`. The prior authorised read-only Admin inspection verified that store and found four active Consultation records. That is **not** a catalogue of the27compound variants, and Admin access is not a Storefront launch or a website Resource binding.

## The integration path

```text
Custom Bioupgrade pages and visual system
  → same-origin /api/shopify catalogue and cart routes
  → official Shopify clients + Storefront API
  → server-authoritative variants, availability and cart costs
  → guarded, freshly retrieved hosted checkout URL
  → Shopify checkout, after owner launch approval

Separate retained account/Signal ledger
  → legacy verified orders and rewards
  → no new Shopify order linkage until verified events and durable ownership are implemented
```

This is an existing React/Wouter/Express codebase, not a Hydrogen/React Router scaffold. It uses the documented Storefront/Cart API route rather than replacing the app with Hydrogen just to fit a template. The official `@shopify/graphql-client` supports the documented tokenless operations. The official `@shopify/storefront-api-client` is used when a genuine Storefront token is supplied; a fake token is not created to satisfy SDK initialisation. Both installed clients are pinned in the delivered package/lockfile.

Only Storefront APIs are used by the application. Admin keys are not embedded, and there is no raw Admin HTTP fallback. The Admin connector remains appropriate for authorised store administration, not as a browser client credential.

## Inventory and existing service identities

The new custom-styled Shopify catalogue is separate from the owner research catalogue. It obtains current product/variant identity, price/currency and `availableForSale` from the Storefront response. It does not invent quantities or treat a marketing label as batch verification. Only available variants from the explicit existing service allowlist can enter this cart. Research variants remain out of checkout.

| Existing Shopify reference | Product ID |
|---|---|
| Bio-Strategy Session | `gid://shopify/Product/10996820869458` |
| The Growth Protocol | `gid://shopify/Product/10996822245714` |
| The Performance Blueprint | `gid://shopify/Product/10996822278482` |
| Elite Concierge Protocol | `gid://shopify/Product/10996822311250` |

These titles/IDs came from the owner-store audit. They are not silently mapped to the educational offers below. A similar name is insufficient to establish equal scope, price, delivery terms or eligibility. The current public Storefront probe returned no variants, so live prices are **not** fabricated from the audit references.

Before activating checkout, the owner must confirm which exact existing service products/variants are ready to sell and the scope/terms they represent. A new research product or similarly named service is not automatically admitted by the allowlist. Creating27Shopify product records, changing existing merchant products or publishing compounds was not performed.

## Cart: what the source implements

The new `/cart` surface uses same-origin requests and server-owned state. Catalogue/cart results intentionally omit the full private Shopify cart ID/key and checkout URL. The full cart capability is held in an authenticated-encrypted, HttpOnly session cookie, not browser localStorage or shareable links. Cart-session material is not committed or packaged.

| Application operation | Purpose |
|---|---|
| `GET /api/shopify/catalog` | Fetch controlled public product/variant data and real availability/connection state |
| `GET /api/shopify/cart` | Read this visitor’s sanitised cart, or an honest empty/unavailable state |
| `POST /api/shopify/cart` | Explicit add, quantity update, owned-line remove or clear |
| `POST /api/shopify/checkout` | Refresh and validate the cart, then return a guarded hosted checkout URL only when launch gates pass |

The server rejects malformed or missing origins, invalid quantities, foreign lines/variants, disallowed products and unavailable merchandise. Mutations are not automatically retried. It handles Storefront HTTP/GraphQL errors, mutation `userErrors`, warnings and missing/expired carts rather than displaying a success toast for a failed operation. Shopify’s supplied money fields—not client prices or arithmetic—are authoritative estimates. Final tax, discounts and checkout pricing can differ from the earlier cart estimate.

The bounded review's three cart-state fixes are applied: clear succeeds only when the returned cart is actually empty and otherwise preserves remaining state/warnings; quantity update checks same-variant sibling totals before writing; initial create/add performs a same-origin read-back and blocks repeated blind creates if secure-cookie continuity cannot be confirmed. Recovery uses public opaque line handles/quantities, not private cart IDs. Stateful fixtures test these cases; they are not a live browser-persistence certificate.

For public embedded HTTPS, cookies use HttpOnly, Secure and SameSite=None. Explicit localhostHTTP testing uses the separate local policy. Attribute tests do not prove every browser accepts third-party cookies; the real embedded cart sequence must be tested at staging after a working Storefront channel is available.

Checkout is refreshed at the point of handoff. The returned URL must be HTTPS on the verified store host and an expected Shopify checkout path, with no credential-bearing authority or fragment. Browser navigation is not payment verification, and the integration does not submit card details or place a test order.

## The actual live blocker

At **07:50UTC on10November2026**, the official client’s read-only tokenless request to the2026-10 Storefront endpoint returned HTTP400 with:

```text
Online Store channel is locked.
```

The evidence is preserved in `public-storefront-check.json` and can be reproduced with the read-only `scripts/check-shopify-public-catalogue.mjs`. No cart or order was created by that probe. The response is not interpreted as proof of unlawful products, missing stock or an incorrect API token. It is a concrete channel-availability blocker.

Resolve this in Shopify Admin through the owner’s chosen plan/channel and approved launch settings. Confirm channel publication, store access/password and the products’ publication to the intended channel. Do not blindly remove a password gate or buy a subscription to make a test pass. An owner-enabled Headless storefront and genuine scoped token is another supported route; set credentials through the bound project’s proper connection workflow, never in frontend variables or chat.

Until resolved, catalogue/cart UI must show the real unavailable/closed state. Fixture tests can validate implementation semantics, but cannot prove a live add/update/reload/remove/checkout sequence against a locked channel.

## Production connection and deployment order

The owner delegated the target choice. A new managed Bioupgrade project is now bound at `/home/ubuntu/bioupgrade`; the revised custom source is transferred without replacing the old website or store. Server/database, container health, server-first routing and TypeScript diagnostics are configured. The new database was verified empty and initialized from a separate nine-table fresh baseline plus a schema-version record. No fake users/orders/points or historical records were imported. A new managed deployment preserves code/design, not original account history or portrait/hero storage ownership automatically.

After a verified binding, use the current managed Shopify integration contract and select the existing `6v43dx-ck` store. Respect the platform’s per-project Shopify/Stripe exclusivity: do not retain duplicate managed commerce integrations or create a new merchant account. Existing source Stripe records/reconciliation remain historical; new Stripe checkout requests are blocked when Shopify is selected.

Configure the exact published origins, Storefront access where required, a strong private cart-cookie key, explicit service allowlists and checkout launch gates according to `.env.example` and the current backend configuration. `COMMERCE_PROVIDER` and the rebuilt public `VITE_COMMERCE_PROVIDER` must agree. Secrets remain server-side; public build variables are not secret storage. Start with checkout disabled, resolve the channel lock, verify current service variants and approve scope mappings before enabling hosted checkout.

This new project receives its own managed OAuth/database/storage configuration. The new database is not the original one; do not shadow its managed DSN or replay the uploaded historical migration chain. Original histories require an authorised audited export/import and verified identity mapping. The original hero/portrait reference is preserved but its file was not supplied and is not automatically owned by new project storage. Verify actual account ownership and asset access, then test cart add/update/reload/remove/empty/error paths inside the intended staging embed. Payment and order-event tests require the owner-authorised flow, not an unapproved live charge.

Only after tests and the owner’s requested release should the intended canonical checkpoint be saved and the current supported Publish action used. A local build, session URL, successful configuration write or Shopify Admin connection is not a permanent publish receipt. Report the permanent URL only when the publish job confirms success.

## Consultation products in the custom frontend

`shared/products.ts` owns the four educational IDs, EUR price labels and checkout flags. `shared/consulting-profiles.json` and `shared/consulting.ts` add best-fit audience, prework, proposed written outputs, qualification and exclusions. They do not create medical or personalised compound-use services.

| Educational offer | Current scope and price | Purchase boundary |
|---|---|---|
| `research-strategy-session` | Research Strategy Session;60minutes;€200; one paper/question and an educational question map | The only fixed-price source offer; provider/service mapping and launch availability still matter |
| `evidence-briefing` | Evidence Briefing; from€850; bounded citation-linked source synthesis | Quote-only: agree final scope, capability, outputs, timing and price |
| `ai-workflow-sprint` | AI Workflow Sprint; from€2,800; one permitted document workflow, PoC/evaluation and human-review handoff | Quote-only |
| `bioscience-ai-workshop` | Applied AI in Bioscience; from€1,200; half-day team source/AI exercise | Quote-only |

`/products?product=<id>` and `/book?product=<id>` keep the selected educational scope through navigation. The local fit worksheet can be copied/downloaded for a conversation; it is not a hidden submission or booking. Its input and rendered draft carry replay-exclusion markup. Calendar scheduling and payment remain separate; buying does not reserve a slot.

The separate Shopify service panel does not overwrite these source scopes or prices. A€200educational strategy session is not automatically equated to a Shopify Bio-Strategy Session with different merchant terms. Agree explicit mappings before combining the customer journeys.

## Research paper and molecular catalogue structure

`shared/research-data.json` stores16verified family/blend briefs. `shared/research.ts` exposes typed brief/paper fields, family names, lookups and a deduplicated21-primary-paper view. Each paper carries title, authors, year, journal, DOI, PMID, original URL, study type, finding, limitation and its relationship to the named compound, a component only or a related entity. That relationship prevents a component paper from being sold as proof of a blend.

`/research` presents searchable/filterable reading cards with primary links, findings and limits. `/meta` supplies the editorial precision-molecular perspective; `/community` adds visitor-operated source/question copy/share actions rather than automatic posting. `/shop/:productId` joins a current owner variant to its family brief and labelled image provenance. Undefined blends stay identity-unresolved and are not given guessed citations.

`shared/marketplace.ts` retains the27current owner-listed variants, exact owner EUR prices, brands/strengths and source history. The attachment-derived reference list remains separate where prices or identities differ. Literature is not a supplied-lot COA, a stock count or a procurement approval. No FDA ranking is used, and non-human-use labels do not by themselves authorise a sales path.

The public renderer supplies useful research, Meta, community, documentation, service and variant HTML before JavaScript, with escaped titles/descriptions and controlled canonical metadata. `/account` and `/cart` are noindex and do not SSR visitor records/cart contents. Public responses never contain cached points, arbitrary order IDs, private buyer details or a full Shopify cart capability.

## Accounts and Signal Points: retained, not falsely migrated

The existing protected account, durable legacy order snapshots, net-paid/refund-aware points, referral hold/cap and reversal logic remain. No new Shopify order is credited from a cart, checkout URL, email match or browser return. The account displays that Shopify linkage is pending.

Completing that bridge requires authenticated customer linkage, signature-verified Shopify paid/refund/cancellation events, idempotent durable order/provider mappings and net-product-payment reconciliation. Customer email alone is not ownership evidence. Until that source is implemented, configured and tested, the separate guest Shopify checkout must not be marketed as automatically earning or syncing Signal Points.

## Verification and limits

The final release evidence is appended to `VERIFICATION.md` after source types, test-source types, isolated tests, production build, local HTTP checks and a bounded integration review. The previous128-test record is historical; do not treat it as the final count after new Shopify tests. Live inventory/cart/settlement, permanent publication and new Shopify reward linkage remain distinct launch gates, not outcomes inferred from a passing build.

Official references: [Storefront architecture/authentication](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api), [Cart management and secret ID](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage), [Storefront client](https://www.npmjs.com/package/@shopify/storefront-api-client), [official GraphQL client](https://www.npmjs.com/package/@shopify/graphql-client). API/client contracts should be rechecked when this process is reused.
