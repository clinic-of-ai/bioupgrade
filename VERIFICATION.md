# Verification record

Date: 4 November 2026. Scope: recovered source from `bioupgradenew.zip`, local application, isolated fixtures and one read-only implementation review. No production services were changed.

| Check | Result |
| --- | --- |
| `pnpm check` | Passed: application TypeScript |
| `pnpm check:tests` | Passed: application and test sources using the real project aliases |
| `pnpm test` | Passed: **97 tests across 13 files** |
| `pnpm build` | Passed: Vite client and bundled Express/tRPC server |
| Targeted formatting | Changed code formatted with project Prettier |
| Route manifest | All five page routes match App.tsx; static JSON endpoint is served |
| Migration safety command | `pnpm db:push` exits 1 with explicit precautions and performs no database operation |
| Production metadata | No unresolved analytics placeholders; viewport zoom allowed |
| Preserved logo | Original durable URL returned HTTP 200 |

The final full check/test/build command exited 0. The frontend initial JavaScript chunk is approximately 450.65 kB before compression; account, shop, products and booking load as separate chunks. This avoids the earlier greater-than-500-kB main-chunk warning. The Manus runtime still injects a large HTML support script; no Lighthouse performance score or browser visual acceptance is claimed.

## HTTP smoke checks

The real development entrypoint was started on 0.0.0.0:3000 without live credentials. Expected results were asserted, including JSON content types for API/storage errors.

| Endpoint | Observed |
| --- | --- |
| `/api/health` | 200; listener up, configuration false, connectivity not verified |
| `/api/ready` | 503; required services/origin not configured |
| `/api/trpc/auth.me` | 200; null logged-out identity |
| `/api/trpc/account.me` | 503; configuration unavailable, no account data |
| Unknown `/api/*` | JSON 404, not SPA HTML |
| `/account`, `/shop` | HTML 200 |
| `/manus-routes.json` | JSON 200; five actual routes |
| Original `/manus-storage/planhat-reference-hero_ee4ad5e3.webp` | JSON 503; original storage not connected |

Core recovery also exercised local source-production routing and fixed-port listener failure in isolated tests. This is not a published checkpoint or a live original-website smoke test.

## Review and regressions

One read-only implementation review traced auth, product gates, immutable order ownership, event deduplication, refund/dispute compensation, referral clocks/caps, consent capture and UI states. It found no confirmed P0/P1 and two P2 defects, both repaired: shop points must not display cached balances after authentication loss or failed reconciliation; readiness must reject missing/malformed trusted checkout origins just as checkout does. Three static-rendering balance regressions and four origin-readiness regressions pass. User-owned interest list/withdrawal and ten-minute referral-intent preservation are also tested.

## What these tests do not prove

Commerce tests mock Drizzle/MySQL transport and emulate transactions in memory. They exercise the application code, but do not establish real InnoDB locking, unique-index behavior, DDL execution or migration success. Stripe transport and OAuth/storage provider calls are mocked in isolated tests; raw Stripe signature verification and JWT cryptography are exercised locally with test keys. No real payment, live OAuth exchange, remote storage compatibility or production database persistence has been verified.

No browser screenshots, Lighthouse audit, mobile-device acceptance, shipment, renewal order history, membership entitlements, email campaign or unattended refund monitor is represented as complete. Reconciliation runs on authenticated reads and fails closed on unavailable payment snapshots; multi-instance OAuth needs a shared atomic state design or sticky routing. Deep discounts can still qualify for fixed non-cash bonuses; any economically valuable reward benefit needs owner-approved promotion/fraud rules.

Before live deployment, attach the original editable website/repository, restore its services and exact hero asset, rehearse the additive migration on an authorised staging copy with backup, confirm actual webhook subscriptions and delivery, verify real authentication/settlement/refund paths, and approve product/merchant eligibility. See README.md, COMMERCE_DECISION.md and drizzle/0003_APPLY.md.

## 8 November 2026 — academic/catalogue extension

The latest application/type-source checks both passed. Full isolated suite: **111tests across14files**, including the prior97 and14newacademic/catalogue/initial-HTML/review-regression assertions. Final Vite/esbuild production build passed with the React automatic JSX runtime; compiled server parse check passed. The14newtests check27prices and catalogue/source separation,16family links,21paper metadata/limitations, unknown/composition/component boundaries, negative/correction context, local image/provenance existence, readable initial HTML, exact detail content, private-account SSR exclusion, real404/noindex metadata, canonical-origin controls/escaping, the question-builder replay-exclusion markup and query-view default parsing. These are isolated application/data assertions, not independent reproduction of paper results or scientific validation of supplied batches.

One bounded read-only extension review found a development-Preview recording mismatch for the temporary community question and a research-view browser-history default mismatch. Both were repaired and have focused regressions. The collector’s existing `.manus-no-record` ancestor is present around the question input/draft; no real private text was transmitted to test it. Client route metadata now uses the same shared contract as the server. No executable cross-viewport browser/visual acceptance was requested or represented as completed.

The fully checked compiled application was restarted on0.0.0.0:3000. **27read-onlylocalHTTPchecks passed**, covering home, academic/Meta/community/documentation/catalogue/services/book/account routes, three representative detail pages with price/identity markers, known media and route manifest, initial readable citations, private account’s empty SSR root, actual unknown-page/product/asset/API404s and expected unavailable-service responses. The first inline smoke attempt stopped on a case-sensitive heading marker; the saved checker uses the actual heading and case-insensitive marker comparison and all27checks then passed. `LOCAL_HTTP_SMOKE.json` records the final results.

Current readiness remains503 with original authentication/database/Stripe/origin configuration unavailable; account reads/storage remain unavailable, not simulated. Robots disallow indexing the unconfigured session; sitemap correctly remains404until a real final HTTPS origin is configured. The manifest declares36routes (ninecorepages plus27currentvariants). No live services, database migration, payments or permanent publication have been performed.

The final main JS chunk is519.69kB before compression (158.35kB gzip), so Vite’s greater-than500kB warning is present again with the expanded catalogue/data. Secondary pages remain lazy-loaded. The Manus HTML support script keeps the built template large. These are acknowledged performance limitations, not a claimed Lighthouse result; no warning was hidden by increasing a threshold. The added public body is server-rendered; the interactive client then mounts, rather than claiming full hydration of a private account/cart. Original hero storage remains503until the correct binding/file is restored.

## 8 November 2026 — consulting and community extension

Application and test-source TypeScript checks pass. The full isolated suite now passes **128 tests across16files**; the17new assertions cover strict social-destination/default validation, profile/post configuration, Discord invite/widget prerequisites, source-and-limitation discussion prompts, manual-share initial states, no premature embed/SDK markup, unchanged offer IDs/EURprices/checkout flags, query-selected consulting scope, proposed outputs and local worksheet collector exclusion. The prior academic privacy assertion is updated to the more precise 'Nothing is automatically sent or saved' wording, without removing input/no-record checks. The complete production build exits0; `node --check dist/index.js` passes. Vite's existing greater-than500kB main-chunk warning remains; no Lighthouse or browser-performance score is claimed.

One bounded read-only integration review found no confirmed additional implementation bugs. Parent inspection had already caught and corrected the new reusable consultation worksheet's missing `manus-no-record` ancestor; its markup regression passes. The review confirmed that all21loaded paper records have HTTPS source URLs without credentials and nonempty limitations. No real clipboard/device-share, external widget, private-message or replay-collector transmission was used to test these assertions.

The six-site benchmark uses actual public-source observations, with crawler limits/failures recorded in COMPETITOR_OPTIONS.md. Only SwissChems produced a fully substantive five-page crawler result; other selected sites used public-page fallback where extraction/pre-run failures required it. This is not supplier/laboratory/COA/stock/quality verification or proof of conversion performance.

Owner Instagram identity, permanent BioscienceDiscordinvite and optional serverwidgetID remain unconfigured. No potentially mismatched @bio.science link,25kverifiedcounter, socialposts, bot/rolesync, privateDiscordmirror, new points mission, payment activation, database migration or original-site publication is represented as completed. Missing original auth/database/Stripe/storage services remain fail-closed. The local running build and HTTP smoke results are recorded separately after restart.

The checked consulting/community build is now running on the same local port3000. **29read-onlyHTTPchecks pass**, including the selected EvidenceBriefing quote (`/book?product=evidence-briefing`), community-network markup, original public/catalogue/detail routes, private-account SSR exclusion,36-route manifest, expected missing API/assets404s and unavailable-service503s. `LOCAL_HTTP_SMOKE.json` contains the final29results. Health is200; readiness, protected accounts and original hero storage remain503because services are not connected. This refresh is a session listener, not a published original-website checkpoint or live social/payment acceptance.

## 10November2026 — design-preserving Shopify applied to new managed source

The owner selected Shopify behind the preserved custom frontend and delegated a new managed deployment target. Source is transferred into `/home/ubuntu/bioupgrade` with canonical Git intact, server/database, container health/server routing and host TypeScript diagnostics. Managed OAuth/database/storage configuration is present. The new database was verified empty, then initialized from the current nine-table schema plus a digest/version record; no fake accounts/orders/points or historical records were imported, and the old database/migration chain is untouched. This explicit fresh-project setup is separate from validation.

Both application and test-source TypeScript checks pass. The completed full isolated suite passes **282cases across20files**, followed by a successful production build at08:17–08:18UTC. The prior97/111/128records are historical. Provider, variant/availability/money, origin/crypto/cookie/capability, CRUD/error/warning, guarded checkout, private SSR and no-inferred-rewards cases use fake transports/isolated loopback servers—not live Storefront or the managed database.

One bounded review found three reproducible cart-state defects, all corrected: clear respects actual remaining/empty state and warnings; update rejects same-variant aggregate overflow before mutation; initial create/add reads back the public cart and blocks repeated blind creates after failed cookie continuity. Stateful/helper cases add22tests and correct the old static clear assumption. SHOPIFY_IMPLEMENTATION_REVIEW.md preserves original findings and SHOPIFY_REVIEW_FIXES.md records completion. No second broad review is claimed.

A new development-only public-page500 was reproduced as “React is not defined” under the inherited JSX-preserve setting. React’s automatic JSX runtime is selected, the affected direct render rechecked, and the compiled managed service restarted after the old watcher retained its transform cache. **30read-onlypublicHTTPchecks and5Shopify-state/origin checks pass** on the new listener. The37-route manifest is valid; real unauthenticated account reads return401; public services/research render200; original hero storage returns403because its asset/ownership was not transferred. Readiness remains503rather than pretending checkout configuration is complete. Vite's existing large-main-chunk warning remains; no performance score is claimed.

Focused browser visits through the real managed Preview confirm `/cart` renders the secure guest-cart-unavailable state and `/products` renders the four preserved educational scopes plus the separate existing Shopify-service panel. The real Storefront response is **HTTP400 “Online Store channel is locked”**, displayed as unavailable without fabricated prices, enabled purchase actions or paid-state/points claims. No real cart, checkout/payment, customer/order, external social post or cookie-persistence acceptance was performed. Browser iframe/standalone CRUD cannot be verified against a locked channel; fixture cookie jars do not prove browser policy.

New legacy Stripe sessions are blocked under Shopify selection; historical reconciliation remains source-preserved. Research checkout, unmapped/quote-only education and new Shopify account/points settlement are not activated. Existing-store card, dedicated protected cart secret, final origins/service approvals, verified customer/order/refund-event linkage and historical-data migration remain separate gates. Native checkpoint/publication receipts are reported only when returned; a source build/listener/new schema is not a successful permanent publication.
