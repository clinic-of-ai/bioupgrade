# Shopify extension: bounded implementation review

**Review date:** 10 November 2026, approximately 07:57–08:01 UTC.  
**Source:** `/home/ubuntu/bioupgrade-recovered`.  
**Disposition:** Three reproducible cart-state defects warrant minimal fixes before enabled-cart staging. No confirmed checkout-host bypass, plaintext cart-capability disclosure, account/rewards fabrication or new Stripe-order bypass was found in this bounded pass. The locked Storefront channel remains a separate live-verification blocker.

## Scope and execution boundary

This was one read-only source/test pass over the requested Shopify server adapter, encrypted cart session, routes, selected-provider wiring, shared contracts, client helpers/components, Products/Shop/Cart/Account integration, root-level `SHOPIFY_INTEGRATION_WALKTHROUGH.md` and `.env.example`. Narrowly related preservation and public-rendering helpers were inspected only to establish the requested catalogue/private-SSR boundaries. No unrelated historical auth/commerce audit was performed.

No project source was edited, formatted, built or migrated. No browser, Storefront network, Admin operation, purchase, publication or private account data was accessed. The only HTTP requests made by this review were to isolated loopback Express servers whose Shopify transport was entirely fixture-backed. Application/test-source typing and build completion remain owned by the parent/backend work; this report does not claim their outcomes.

The parent subsequently chose a **new managed deployment preserving the revised custom code and existing Shopify store**, leaving the old website/data intact. Earlier unbound-target documentation is a historical operational snapshot, **not a code finding**. Binding and deployment evidence must be updated by the parent after the actual operation; credentials/accounts/data are not assumed migrated. The inspected `_core/index.ts:38` already conditionally registers Shopify routes for the selected provider.

## Confirmed findings and minimal fixes

### F1 — P2: Clear reports success and relinquishes ownership without checking the returned cart

**Evidence:** `server/shopify-routes.ts:427–440`; `server/shopify-storefront.ts:598–610`; existing test `server/shopify.test.ts:949–966` and its static mutation fixture at `:159–180`.

The clear branch awaits `cartLinesRemove` but discards both its validated cart and its warnings. It then always expires the guest cookie and returns `cart: null` with “has been cleared.” The adapter accepts an authoritative mutation response with remaining eligible lines; therefore the route can abandon a still-populated provider cart while claiming it was emptied. An already-open checkout tab is not invalidated by dropping the application cookie.

**Local reproduction:** A fixture remove response with `userErrors: []`, one warning and one remaining valid line produced HTTP **200**, `cart: null`, the cleared-success message and an expired cookie, while the provider fixture still had **one line**. This is a permitted-response handling defect, not evidence that a live Shopify removal actually failed. The existing clear test passes using a fixture that returns the unchanged populated cart, so it currently embeds the same false-success assumption.

**Minimal fix:** Capture the mutation result. Expire the cookie and report successful clear only when the returned cart has no lines and quantity zero. If lines remain, preserve the session and return the actual sanitized cart/warnings with a controlled partial-change or refresh-required message; do not retry automatically.

**Affected checks:** Add stateful successful-clear, remaining-lines/warning and remove-user-error cases. Assert provider response, public response and cookie disposition agree.

### F2 — P2: A non-persisted cookie is silently treated as a fresh cart, despite a successful add message

**Evidence:** `server/shopify-routes.ts:412–425,465–470,499–501`; `server/shopify-cart-session.ts:217–237`; `client/src/components/shopify/ShopifyServiceCatalog.tsx:346–371`; `client/src/pages/Cart.tsx:59–67`. Cookie-policy-only tests: `server/shopify.test.ts:388–423,835–853`. Staging limitation is already honestly acknowledged in `SHOPIFY_INTEGRATION_WALKTHROUGH.md:60`.

A create response is treated as a usable persistent cart immediately after `Set-Cookie`, without confirming that the browser sends the encrypted session back. When storage is blocked in an embed, subsequent GET returns an ordinary enabled empty cart and another add invokes `cartCreate` again. The service panel reports “Guest cart refreshed” although the visitor cannot recover that cart. This also loses earlier selections across repeated adds. There is no plaintext/localStorage fallback, which is correct; the missing piece is an explicit failed-session state.

**Local reproduction:** Intentionally omit cookie persistence: first add returned HTTP **200** with a nonempty cart; the next GET returned HTTP **200**, `cart: null`, `cartEnabled: true`; the next add produced a second `cartCreate`. This models absent-cookie continuity only—it is not a browser test or a claim that the eventual staging browser blocks cookies.

**Minimal fix:** After the first create/add, confirm session continuity through a same-origin cart read before showing persistent-cart success. If that read cannot recover the cart just created, show an explicit secure-session/cookie-unavailable error and prevent repeated blind creates in that client flow. Preserve HttpOnly/encryption/Secure/exact-origin restrictions; never return the private cart key or rescue persistence through localStorage. Do not automatically retry an ambiguous create.

**Affected checks:** Use a fixture cookie jar to test create → read → add → read, and a deliberately non-persisting jar to test explicit failure instead of false success. Actual embedded-browser acceptance remains a later authorized staging check.

### F3 — P2: Quantity update enforces the per-variant cap only after writing when a variant occupies multiple lines

**Evidence:** `server/shopify-storefront.ts:224–239`; `server/shopify-routes.ts:444–463,479–497`; reset behavior at `server/shopify-routes.ts:326–327`.

Private-cart validation explicitly allows different line IDs with the same merchandise ID, provided their aggregate quantity is at most 20. Add computes and rejects aggregate overflow before mutation, but update checks only the target line's requested quantity (1–20). For an otherwise valid two-line cart containing the same variant, setting one line to 20 can write an aggregate of 21. Post-write validation then rejects the cart and clears its cookie, abandoning the mutated provider cart instead of rejecting an invalid request before writing.

**Local reproduction:** Start with two distinct owned lines of the same variant, one unit each. Update the first to 20. `cartLinesUpdate` was called; the fixture's authoritative aggregate became **21**; the route returned HTTP **409** and expired the cookie. This is a supported-response edge case; the present UI does not itself submit line attributes to manufacture split lines.

**Minimal fix:** Before `cartLinesUpdate`, compute the sum of sibling quantities for the target merchandise ID plus the requested replacement quantity. Reject aggregate overflow without a provider mutation or session reset. Retain post-response validation as defense in depth.

**Affected checks:** Distinct-line/same-variant update at the aggregate boundary and over it; assert zero mutation calls on overflow and no cookie deletion. Include normal single-line update to prevent regression.

## Checks that held in this pass

- **Preservation:** Direct source imports returned **27** owner research variants, **16** briefs and **21** distinct papers. The four educational records remain `€200` / `From €850` / `From €2,800` / `From €1,200`, with checkout flags **true / false / false / false**. The fixed-price educational offer is separately disabled in the Shopify-selected UI because it is unmapped (`Products.tsx:213–229`); quote-only flags were not repurposed as charges. The four Shopify legacy-service product references remain distinct (`shared/shopify.ts:4–15`), with no guessed merchant prices or equivalence.
- **Transport/money:** Exact server endpoint, official tokenless or genuine-token client paths, no Admin-token alias, bounded response size/time, no automatic mutation retry, HTTP/GraphQL/user-error handling and controlled warning text are implemented (`shopify-storefront.ts:320–477,568–610`). Money is provider decimal-string/currency data, not browser settlement arithmetic (`:27–30,248–268`). Locked-channel HTTP 400 classification is fixture-tested; no new live probe was performed.
- **Capability/ownership:** AES-GCM authenticates and conceals the complete cart capability; dedicated secret, store-bound AAD, expiry, production HttpOnly/Secure/SameSite=None and explicit loopback policy are present. Public cart projection replaces provider line IDs with cart-bound HMAC handles and omits full cart IDs, checkout URLs and buyer identity. Exact configured Origin is required for both POST routes; strict body schemas reject arbitrary GraphQL, cart IDs, prices and buyer details. Foreign line handles are rejected before writes.
- **Checkout:** The guarded POST refreshes the full bounded cart with availability and checkout URL immediately before handoff; explicit launch flag/product approvals, every-line approval and empty/invalid-cart gates hold. Server and browser require the exact verified HTTPS host and controlled checkout paths/query fields, with credential/fragment/redirect rejection. Cart/catalog GETs do not request or disclose checkout URLs. No purchase or checkout tab was opened by this review.
- **Provider/accounts/SSR:** Shopify route registration is conditional. Mocked `checkout.createSession` tests confirm that Shopify selection creates neither a new internal Stripe order nor a Stripe session. Preserved legacy webhook/history wiring is not treated as a duplicate new checkout route. Shopify code does not write account/order/reward records; pending linkage is disclosed. `/account` renders no private body and `/cart` only a fixed public shell in initial HTML (`server/public-pages.tsx:238–242`). Catalogue prices are hidden on loading/error/unavailable states, and controller API failures clear cart results rather than awarding points or fabricating successful payment.

## Test result and remaining focused gaps

The actual focused fixture run passed **4 files / 135 tests**:

```text
pnpm exec vitest run server/shopify.test.ts server/shopify-ui.test.ts \
  server/commerce-provider.test.ts server/commerceCheckout.test.ts \
  --pool=forks --maxWorkers=1 --minWorkers=1 --no-cache

shopify.test.ts             95 passed
shopify-ui.test.ts          33 passed
commerce-provider.test.ts    3 passed
commerceCheckout.test.ts     4 passed
```

An earlier runner invocation rejected the deprecated cache-directory option before running tests; the command above is the completed run. Counts are test cases, not a claimed assertion count or entire-project result. Preservation counts were additionally checked by direct imports, not by a scientific-content re-audit.

**The highest-value gaps are the three regression groups attached to F1–F3.** Existing CRUD fixtures return the same cart for create/add/update/remove (`shopify.test.ts:136–180`), so they verify operation selection and safe projection more than actual quantity/removal evolution. Frontend tests are static markup plus mocked helpers, not mounted event/state tests: cookie continuity, asynchronous stale responses, popup cancellation and unmount behavior are not demonstrated end to end. Client cart-response guards also do not independently enforce the server's 20-line/quantity/consistency bounds (`client/src/lib/shopify.ts:47–70`); the production server does, so this is a defense-in-depth test gap, not a confirmed bypass.

**Approval granularity should remain explicit:** current approval is a four-product allowlist plus live variant-to-product/availability validation, not a frozen per-variant approval list (`shopify-storefront.ts:151–181,529–553`; `shopify-routes.ts:540–548`). No variant inventory was live-verified here. If the owner's eventual approval is limited to exact options rather than all variants of a product, bind that narrower verified set before enabling checkout; do not infer variant IDs or prices. This is a launch-contract clarification, not counted as a fourth confirmed bug.

Do not replace these fixture checks with live writes now. The known **HTTP 400 “Online Store channel is locked.”** remains the recorded Storefront blocker. Live cart/payment/account linkage and publication are unverified; new managed deployment, service credentials and historical data continuity require their own explicit evidence.

## Parent action

Confirm and fix F1–F3 without changing design/catalogue identities, then rerun their affected fixture suites and the parent-owned source/test typing/build checks. Update the walkthrough's deployment-target status only after actual Resource binding. This report is complete for the requested one-pass review; no follow-up review or publication is implied.
