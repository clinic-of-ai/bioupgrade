# Bioupgrade — recovered source update

This updates the uploaded `bioupgradenew.zip` without regenerating its design. The owner subsequently delegated choosing a new managed deployment, which now holds the revised source. Logo, mint/forest palette, Geist fonts and hero reference are preserved. The protected account remains, and the 8 November extension adds27variant detail pages, `/research`, `/meta`, `/community` and `/documentation`.

**Current scope:** applied source in a new managed project, with server/database, managed OAuth/storage settings, container/routing and host diagnostics. Its empty database was initialized from a separate fresh baseline with no fake accounts/orders/points or historical import. The original website/database/Stripe/history/hero ownership remain untouched. Shopify Storefront is still channel-locked and managed store selection/cart credentials/launch gates remain pending. A listener, source build or new schema is not a completed live checkout or successful publication; see MANAGED_DEPLOYMENT_STATUS.md for operation-specific evidence.

## Run the recovered code

Use Node 22 and the pinned pnpm 10.18.1 toolchain. Lifecycle-script permissions and dependency patches are in `pnpm-workspace.yaml`.

```sh
corepack enable
corepack prepare pnpm@10.18.1 --activate
pnpm install --frozen-lockfile
pnpm check
pnpm check:tests
pnpm test
pnpm build
pnpm dev
```

The development server listens on port 3000 and does not silently choose another port. `pnpm start` runs the production build from `dist/index.js`, serving `dist/public` and the same APIs. The optional Dockerfile contains a self-contained build and runtime; it has not been deployed or container-tested here.

`GET /api/health` checks the listener and reports configured services. `GET /api/ready` returns 503 when required configuration is missing; it does not perform external connectivity verification. Public pages remain inspectable without credentials. Account endpoints, storage and login fail closed or report unavailable; no simulated Preview identity, in-memory account or invented points balance is used.

## What changed

The catalogue syntax error is repaired. Missing core authentication, tRPC/context, cookies, storage proxy and runtime source has been restored using the original compiled export and documented Manus contracts. Real JWT verification requires signature, expiry and matching project identity. OAuth login uses a server-issued browser-bound nonce, one-time callback consumption and a fixed `/account` return. Missing service configuration produces a useful unavailable state, not a broken URL constructor.

The shop now leads with the27current owner-list variants, exact prices, topic/family/brand discovery, labelled imagery and `/shop/<id>` detail records. The23attachment entries and4legacy concepts are retained in separate groups, not merged over current prices. Sixteen compound-family briefs and21source-linked primary papers connect the catalogue to a searchable academic library and a substantive dated Meta editorial. Unknown blend/fragment identities, component-only evidence and negative results remain explicit. Quantities are pack labels, not administration instructions. No research checkout or research-purchase/referral points are enabled. Consented interest can be stored, viewed and withdrawn against an authenticated account; this does not send email, reserve stock or approve procurement.

Public pages now have readable initial server HTML, shared route metadata and actual404responses. Account data are never server-rendered. Canonicals/sitemap require an explicitly configured final HTTPS origin. The community’s temporary question draft is inside the existing development collector’s no-record boundary. See `ACADEMIC_CATALOGUE_UPDATE.md` for source/evidence/image distinctions and the remaining owner documentation inputs.

Account history shows server-owned orders, an auditable points ledger, tier progress, actual baseline benefits, referral codes and statuses. Additional discounts/events are marked not live. Referral attribution is explicit, single-use and cannot be self-applied; an incoming code can be retained for ten minutes across sign-in but is never automatically applied. Its proposed rules are 250 points after a qualifying first eligible purchase within 30 days, a 14-day hold and a four-referral rolling-30-day cap. Paid events and compensating reversals are server-controlled; reading/purchase/referral missions cannot be self-claimed by the client. See `drizzle/0003_APPLY.md` for the implementation's exact definitions and constraints.

The initial recovery phase selected Stripe. The owner's10November request now selects a design-preserving Shopify adapter for existing store services, without changing any Shopify Admin products/settings or replacing the frontend. New legacy Stripe checkout is blocked when Shopify is selected; its existing history/reconciliation remains. The separate Shopify guest cart is not automatically linked to source accounts, points or referrals. Monthly membership remains launch-disabled; scoped 'From €' educational offers remain quote-only. Crypto checkout is not enabled. Cal.com is separate and its payments do not automatically earn account points.

Fake-success URL toasts, dead footer buttons, unverified member quotes, analytics-placeholder requests, viewport zoom restrictions and redundant responsive display overrides were removed. Secondary pages are lazy-loaded; existing brand assets and self-hosted fonts remain.

## Apply this to the original website

Attach the original editable website or source repository before merging this update into its saved history. Preserve its configured services, existing data and original asset ownership. Do not create a second payment account or a replacement site just to apply these files.

The ZIP omitted `drizzle/meta` migration journal/snapshots. **Do not run the old `drizzle-kit generate && migrate` flow against existing data.** `pnpm db:push` has been replaced with an explicit safety stop that performs no database operation. The new additive SQL in `drizzle/0003_durable_commerce.sql` is an apply-once artifact, not a migration that has already run. Restore a backup and rehearse on a separate staging copy, inspect actual schemas/engines, pause writers, apply only after operator approval, and verify balances/history. Read `drizzle/0003_APPLY.md` first. MySQL DDL auto-commits, so partial failures require an audited remaining-statement apply; blindly rerunning the whole file is unsafe.

Existing historical balances/events and unqualified legacy referral rows are preserved. Historical guest purchases cannot be linked by matching email alone, and historical orders are not fabricated from old points events.

For the original managed website, reconnect server/database/OAuth/storage through owner-controlled configuration. Select the existing store through the bound project's Shopify integration flow; Shopify/Stripe are mutually exclusive managed integrations. Do not paste private keys or manually replace managed Storefront values. Retained historical Stripe reconciliation is not permission for a duplicate active managed checkout. Build-time public values require rebuild. Configure explicit origins and verify the actual selected provider's staging cart/checkout and any separately implemented account event linkage before go-live.

The approved hero file `/manus-storage/planhat-reference-hero_ee4ad5e3.webp` was not supplied. Its reference is preserved, but new managed storage does not automatically own the original asset; the observed new request returns403rather than the old unconfigured503. Supply/authorise transfer of that actual asset. No replacement portrait was generated. The existing durable logo URL is retained.

## Operational limits before launch

The recovered OAuth nonce store is process-local. Use one application instance or a documented atomic shared store/sticky-session design before multi-instance routing; another instance fails closed, so configuration errors must not be worked around by weakening state checks.

The current managed Stripe integration delivers six fixed events. Refund/dispute callbacks are not presumed available. Current known order/payment/charge snapshots are reconciled during authenticated account/rewards reads, including referred orders before release. This is not an unattended refund monitor: if accounts are not read, reconciliation is deferred. Network failure returns unavailable rather than releasing unverified rewards. For scale or immediate revocation, implement an owner-approved background reconciliation/event-subscription design before launch. No scheduler was created in this task.

The code records only the initial membership checkout if that product is later activated; no payment was made here. Renewal order tracking, subscriber entitlements, content access, shipping/stock fulfilment, customer email campaigns, refund request tooling and an admin operations dashboard are not implemented by this source update. `fulfilledAt` in the recovered schema is internal payment processing, not a shipment or delivery claim. UI wording must retain that distinction. The correctness-first ledger currently uses a database-wide transaction lock and bounded history; it is not a high-throughput commerce system.

Owner approval is still required for product identity/classification, supplier provenance, batch documentation, destination restrictions, permitted claims, merchant/payment eligibility and fulfilment. An image, COA, disclaimer or membership gate does not grant permission to sell. Define privacy/retention/withdrawal processes before contacting interest-list users. Membership billing/content/cancellation terms and actual tier benefits must be approved before launch.

See the historical `COMMERCE_DECISION.md` for the initial Stripe assessment and `SHOPIFY_VS_CURRENT_BIOUPGRADE_2026-11-10.md` for the full later design-preserving comparison. `SHOPIFY_INTEGRATION_WALKTHROUGH.md` explains the newly applied source, four separate existing merchant service IDs, current educational/paper architecture, server-owned cart and remaining launch gates. The real Storefront probe returned HTTP400: “Online Store channel is locked.” No live inventory/cart/payment is claimed. Local evidence is recorded in `VERIFICATION.md` after final checks.

For exact original-project environment values, the owner-controlled live Stripe key pair and republish, runtime storage presigns and connectivity verification, read `PRODUCTION_CONNECTIONS.md`. It is a guide—not proof those services are connected. The historical production deployment runbook remains the operator’s reference for separate migration/release approval.

## Consulting and external community extension

The latest `/products` and `/book?product=<id>` journey adds educational fit, prework, proposed written outputs and quote boundaries without changing the four prices or checkout flags. A local worksheet provides explicit copy/download, not submitted intake. The community page/footer and paper cards connect source-led reading with owner-confirmed Instagram/Discord destinations and manual sharing; third-party previews are click-to-load. No potentially unrelated social account, invented Discord invite, automatic post or follow/share reward is configured.

Read `BUSINESS_AND_COMMUNITY_UPDATE.md`, `COMPETITOR_OPTIONS.md` and `CONSULTING_MODEL.md` for selected changes and remaining feature options. `COMMUNITY_CONNECTIONS.md` documents the public settings, verified-destination requirements and difference between external links/public previews and a future authenticated bot/API integration. Missing owner destinations, staff/intake capability and original live services remain pending.
