# Bioupgrade: production variables, live Stripe and storage

Updated 8 November 2026. This guide applies to the revised React/Express application. It is **not a connection or publication receipt**. The current source archive is running in a temporary session; it is not bound to the original Manus website, and its original database, OAuth, Stripe and storage credentials have not been connected here. Do not paste secret values into chat or put them in source/Git.

## 1. Reattach the original website—not another payment account

Provide the original editable website resource through Manus’s website attachment/continuation control. A task link, Shopify admin link, public URL or source ZIP cannot carry the original runtime service binding. Confirm the returned website/domain, original canonical repository and latest source before merging this revision. Preserve its existing Stripe integration, database, identity and asset ownership. Do not enable Shopify or create a replacement site/database to bypass missing access.

The recommended architecture remains one server-capable container serving React and Express/tRPC on port3000. A static-only publication cannot implement authenticated accounts or payment settlement. Inspect original configuration, including auto-publish, before advancing canonical main. Use the separate production deployment runbook for backup, migration, release, checkpoint and publication.

## 2. Separate platform-owned values from your application settings

Manus Settings → Integrations owns managed Stripe setup. Managed database/OAuth/runtime services supply their own values. Application-owned protected values belong in the registered secure configuration input, with Production selected—not in a chat message or a committed `.env`. If the owner has deliberately chosen non-managed hosting, configure runtime values through that host’s secret manager, preserve identity/provider ownership and validate the actual integration contract; this guide does not authorise copying platform keys into a replacement project.

| Name | Purpose and ownership | Browser-safe? |
| --- | --- | --- |
| `PUBLIC_APP_URL`, `APP_ORIGIN` | Application settings: the same exact final HTTPS origin, no path/trailing slash/wildcard/credentials. Use the real published address, not the temporary session URL. | Public configuration, although read on the server |
| `TRUSTED_ORIGINS`, `ALLOWED_ORIGINS` | Exact comma-separated authorised origins. Current checks read both sets; configure the deliberate set consistently. Add the actual authorised Preview only when testing; no broad Manus-domain wildcard. | Public origin values |
| `PORT` | Runtime listener, normally3000; no alternate-port auto-selection. | Non-secret |
| `DATABASE_URL` | Existing durable MySQL target. Platform-owned when managed database is enabled; do not manually declare a replacement DSN over it. | **No** |
| `MANUS_PROJECT_ID` | Original project identity; preserve the compatible legacy `VITE_APP_ID` read when applicable. | Identity is public, not a secret replacement |
| `MANUS_JWT_SECRET` | Original session-signing value; the adopted application can read `JWT_SECRET` as a compatible alias. Do not invent/override a platform identity secret. | **No** |
| `MANUS_OAUTH_PORTAL_URL`, `MANUS_OAUTH_API_URL` | Original actual authentication endpoints. Adopted aliases: `VITE_OAUTH_PORTAL_URL`, `OAUTH_SERVER_URL`. | Endpoints are public; exchange credentials are not |
| `MANUS_API_URL`, `MANUS_API_KEY` | Original runtime service/storage endpoint and server Bearer credential. Adopted reads fall back to `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`. | URL is public; **server key is not** |
| `STRIPE_SECRET_KEY` | Managed Stripe server key, set through Integrations. Never place it in a `VITE_` variable. | **No** |
| `STRIPE_WEBHOOK_SECRET` | Managed callback signing value; supplied/refreshed through the integration, not a user-created second webhook. | **No** |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Managed public Stripe key. Must match the server account/mode. | Yes |
| `VITE_CAL_LINK` | Optional real Cal.com embed link. Without it the page honestly displays unavailable booking. | Yes |
| `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID` | Optional approved public analytics settings; no placeholder requests are sent. | Yes |

Only browser-safe `VITE_` values may be baked into frontend bundles. Changing them requires rebuilding/republishing. Saving a server value does not automatically reload an already-running process or republish the site. Restart the affected Preview process and republish production through the supported flow. `.env.example` lists **names only** and is not the mechanism by which managed values are delivered.

Example **non-secret settings**, after replacing the address with the actual final origin:

```text
PUBLIC_APP_URL=https://YOUR_ACTUAL_FINAL_DOMAIN
APP_ORIGIN=https://YOUR_ACTUAL_FINAL_DOMAIN
TRUSTED_ORIGINS=https://YOUR_ACTUAL_FINAL_DOMAIN
ALLOWED_ORIGINS=https://YOUR_ACTUAL_FINAL_DOMAIN
PORT=3000
```

Do not literally deploy the example domain. If additional authorised origins are needed, enumerate each exact origin in the appropriate settings; do not relax origin checking to make a failed login or checkout work.

## 3. Connect live Stripe through the existing integration

First confirm the merchant entity, account country, permitted offers and actual intended buyers with Stripe. The platform decision is architectural—not merchant approval. Stripe’s current FAQ permits some research-peptide sales **conditionally**, requiring measures that exclude nonresearch buyers, while pharmacy/prescription categories have separate rules. A research-only label, points tier or corporate address does not establish eligibility. This site does not use FDA approval as its merchandising ranking; actual classification, seller/destination rules and processor acceptance remain separate facts. Research-material checkout is still blocked in the current implementation, which does not yet implement an approved organisation-verification/procurement system.

For a bound project that already uses Stripe, preserve the integration. If test-webhook reconnection is required after attachment, inspect current config and use the supported owner operation `POST integrations/stripe/webhook` with an empty body. It connects the project’s single test callback to the attached Cloud Preview and can replace another session’s target. Do not create a parallel Stripe Dashboard callback to evade that contract, and do not request the managed sandbox signing secret through chat.

If live keys are not already configured, complete an initial private publication to establish the production endpoint. The owner then enters the **live publishable key and live secret key as a matching pair** in Manus Dashboard **Settings → Integrations → Stripe**. The platform registers/points the production callback at the published domain. **Republish is required** for production runtime/build values to receive the live setup. Never rotate a working pair unnecessarily or combine a test public key with a live server key.

The implemented route is `POST /api/stripe/webhook`. Raw request bytes are verified before JSON parsing, and durable event/order keys prevent duplicate credits. The current managed subscription has exactly six event types: `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and `checkout.session.completed`. It does **not** deliver refund/dispute events simply because application code can understand them. Refund/dispute integrity currently retrieves current known payment state on account/rewards/referral reads; it is not an unattended immediate reconciliation monitor. An immediate/background requirement needs a separately approved supported design.

Keep test-mode checkout IDs out of production history. Current order rows do not store a test/live mode and on-read reconciliation uses the active key; mixed-mode records can become unreadable after a live transition. Use an authorised isolated staging database, not the original shared managed database, for real test-mode integration rehearsals. Preserve any existing test history through an audited mode-aware remediation—not deletion or a bypass.

Check real signed callback delivery and actual server-linked payment state in authorised staging. A success redirect or a200 health response is not payment evidence. A real acceptance purchase/refund charges/reverses money and requires explicit approval of the offer and amount; do not automatically charge the€200 consultation to “test” deployment.

## 4. Connect storage—and distinguish public media from private records

The revised catalogue’s small images are included under `client/public/images/research/`, so those assets do not require runtime uploads. Molecular images are source-linked diagrams of named research entities; the one matched packaging photo is a third-party reference, not proof of the supplied lot. Actual product/packaging photos, stock records and batch COAs/SDS still need to be supplied by the owner.

The original hero `/manus-storage/planhat-reference-hero_ee4ad5e3.webp` belongs to original project storage. Restore that asset through the original binding or supplied original file; do not invent a replacement and call it the original. A raw development-port request is not proof of platform Preview/published storage resolution.

Runtime uploads use the original `MANUS_API_URL` and server `MANUS_API_KEY` (compatible adopted aliases are retained). `server/storage.ts` uses this documented flow:

1. Server requests `GET <runtime-base>/v1/storage/presign/put?path=<ASCII-key>` with its Bearer credential.
2. The returned URL accepts `PUT` of the file bytes and Content-Type. A presign response alone does not prove upload completion.
3. Persist the final key and the stable `/manus-storage/<key>` address in authorised application/product metadata. Keys receive a random suffix to prevent collisions.
4. If a temporary externally fetchable URL is needed for a designated authorised service, the server can request `GET <runtime-base>/v1/storage/presign/get?path=<key>`. That signed address lasts about one hour; it is not the permanent stored address.

The current helper is not a document administration UI or a private-file permission system. Do not upload personal medical records, private customer documents or research-organisation IDs to a public catalogue asset path. Before adding owner/document uploads, implement authenticated role checks, file type/size validation, a file index and an appropriate access boundary; keep the server key out of browser code. A COA must be attached to its actual SKU/lot, method, date and provenance—not inferred from a paper or another supplier’s certificate.

The runtime storage API has no list/delete operation. Application record removal is not physical object deletion. Operator-side storage management uses a separate owner-authorised surface. Do not claim a withdrawal/privacy request erases stored bytes merely by hiding a record.

## 5. Validate readiness and connectivity separately

`GET /api/health` confirms the listener. `GET /api/ready` checks required configuration and exact checkout-origin syntax; it deliberately returns `connectivityVerified:false`. It can return200 without proving a successful DB query, login exchange, Stripe API/callback or asset upload. Storage is reported separately and is not part of the current overall readiness predicate.

After authorised attachment/configuration, verify on the actual final/attached origin: real OAuth login/callback/logout; owner-scoped persisted orders and points; authenticated consent/interest withdrawal; signed settled checkout and idempotent replay in staging; refund/referral reversals; original hero and new public assets; and one harmless authorised storage upload/download. Never print credentials, signed URLs or customer records in shared logs.

The current OAuth routes are `POST /api/oauth/login` and `GET /api/oauth/callback`, returning to `/account`. Callback state is process-local; a multi-instance or overlapping rollout requires supported sticky routing/shared atomic state, or a controlled restart with fresh sign-in initiation. Do not weaken state or cookies to compensate for misconfigured origins.

Database migration is a **separate approved production action**. The recovered export lacks migration journal metadata. `pnpm db:push` intentionally exits without modifying the DB. Audit the actual existing schema, back up and verify restoration in staging, then apply only the reviewed additive migration once during an approved window. No secret configuration or frontend publication should casually replay schema history.

## Sources and scope

Connection mechanics: current Manus managed Stripe, secrets, storage and service API capability contracts read on8November2026. Product acceptance: Stripe FAQ https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs . EU online-medicine context: EMA/HMA https://www.ema.europa.eu/en/news/warning-about-sharp-rise-illegal-medicines-sold-eu . These sources do not establish the legality, safety, batch quality or payment eligibility of every named catalogue variant. Operating from Estonia, Germany or Portugal is not operating outside all jurisdictions; a qualified review must use the actual seller, product classification, intended use and destination facts.
