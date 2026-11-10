# Commerce 0003: manual, additive apply and reconnection

No database or Stripe credentials were available during recovery. This migration was not applied to any external database. The recovered source has 0000–0002 SQL but no `drizzle/meta` journal or snapshots. Do not run `pnpm db:push`, `drizzle-kit generate && migrate`, or recreate historical journal entries with invented timestamps against existing data.

## Authorized operator apply

1. Stop checkout/webhook/account writers during the maintenance window. Obtain a restorable backup, record row counts and balances, and test restoration. Rehearse on a separate staging copy first.
2. Inspect `SHOW CREATE TABLE` for users, rewardAccounts, rewardEvents, referralCodes and referrals. Confirm they match the recovered 0000–0002 schema and use InnoDB. Verify MySQL permissions and collation/index compatibility. If any 0003 column/table already exists, stop: this apply-once SQL is deliberately not an unsafe blanket rerun.
3. Apply `0003_durable_commerce.sql` once using the operator's normal secured SQL client, with secrets outside shell history. There is no automatic schema migration at server boot. MySQL DDL auto-commits: partial failure requires checking INFORMATION_SCHEMA and applying only the confirmed remaining statements, not rerunning the entire file. If the schema differs, produce an audited environment-specific additive migration instead.
4. Check the new unique indexes, the `commerceLocks` row with id=1, InnoDB engines, old row counts/balances/reference IDs and legacy referral statuses. Existing reward references and their duplicates remain untouched; only the nullable new `dedupKey` is unique. Old qualified referrals have no verified order/hold and are not auto-awarded. Deploy the code only after the complete schema exists. Do not roll back by dropping financial-history tables.

## Reconnection and permissions

Configure `DATABASE_URL`, Stripe key/webhook secret, and explicit HTTPS `PUBLIC_APP_URL` and/or comma-separated `ALLOWED_ORIGINS`. `PUBLIC_APP_URL` is an origin (no path). Missing Origin requires PUBLIC_APP_URL; no Host/X-Forwarded-Host fallback is used by checkout. Configure the recovered core's mutation-CSRF origins too (`APP_ORIGIN` / `TRUSTED_ORIGINS`, or the core's documented equivalent). A trusted proxy must not make arbitrary client Host headers authoritative. Do not log connection strings or payment secrets. Register the webhook before JSON middleware so its Buffer reaches Stripe signature verification.

All marketplace stock remains blocked unless `commerceApproved === true`, status available, positive amount and ordinary field-kit/membership kind. Research kinds remain blocked even if flags are manually toggled. Service checkout honors `checkoutEnabled === true`; scoped 'From' services need agreed pricing first. Initial monthly membership uses Stripe subscription mode, EUR recurring monthly pricing and promotion codes. Renewal billing is handled by Stripe; this recovery records/rewards the initial checkout order only, not invented renewal entitlements or renewal order rows. No membership-access provisioning, shipping fulfilment, email campaign, or admin dashboard is claimed.

The platform currently subscribes to **six event types**. Confirm their exact list during reconnection; ensure `checkout.session.completed` and `payment_intent.succeeded` remain subscribed so delayed asynchronous payments can settle. Do not assume `charge.refunded` or dispute callbacks are delivered by the current subscription. The handler can process those types if explicitly registered later, but refund/dispute integrity currently relies on retrieving the current Checkout Session, PaymentIntent and latest Charge for known server-owned orders on authenticated `account.me` and `rewards.me` reads. The same check covers referred qualifying orders before held rewards release and already-earned referrals before display. No browser-provided order IDs, payment URL parameters, or client purchase claims can credit points. `checkout.session.completed` with unpaid payment state stays pending; verified current succeeded payment and paid charge are required. Stripe/network failures return unavailable rather than releasing unchecked rewards. Unrelated signed events are durably deduplicated but cannot create orders.

## Ledger and referral rules

One point per complete EUR of the actual discounted product line (`amount_total - amount_tax`); shipping and tax are excluded. Original SKU/title/price/owner snapshots never change. Partial refunds conservatively reduce the product amount first; full refunds/disputes remove all remaining purchase points. Any refund/dispute revokes the 100-point first-purchase qualification and pending/earned referral reward. Negative compensating ledger events preserve history. Lifetime points are historical positive earnings, not spendable points; reversals reduce pointsBalance only, which can be negative if an old external redemption consumed points.

One opaque code per referrer, one attribution per new buyer, no self-referrals, attribution before checkout, first verified ordinary paid order within 30 days, 250 points held 14 days and at most four qualified referrals per rolling 30 days. Revoked referrals still consume that rolling cap conservatively. All clocks and release decisions are server controlled, serialized with the order/ledger transaction using the seeded database lock and durable unique keys. No IP/browser ban or medical information capture is used. Interest is explicit consent, at most 25 unique marketplace products per authenticated account, and never a reservation/purchase approval. Capturing consent does not send marketing emails; operators must define contact/privacy/withdrawal processes before contacting users.

Legacy balances/events are preserved, not inferred into historical orders or retrospectively corrected. Previously unauthenticated purchases cannot be assigned to an account from matching email alone. Reconciliation checks all known linked orders and relevant active referral orders, with four concurrent Stripe lookups; the visible account history is capped at the latest 100 orders/events/referrals. This small-store correctness-first path should move to an operator-approved paginated background reconciliation design before large-scale traffic. Rewards writes currently use one database-wide transaction lock, favoring correctness over high-throughput scaling.

## Public API

`account.me` (protected; no input):

```ts
{
  account: { pointsBalance: number, lifetimePoints: number },
  events: RewardEvent[], // latest 100; legacy columns plus nullable dedupKey; timestamps are Dates via SuperJSON
  orders: [{ id: string, productTitle: string, amountCents: number,
    currency: string, status: 'created'|'pending'|'paid'|'failed'|'canceled'|'partially_refunded'|'refunded'|'disputed',
    createdAt: Date, fulfilledAt?: Date, stripeSessionId?: string }],
  referral: { code: string,
    records: [{ id: number, status: 'pending'|'qualified'|'earned'|'revoked'|'expired'|'capped',
      createdAt: Date, qualifiedAt?: Date, rewardPoints: number, releaseAt?: Date }],
    rules: { rewardPoints: 250, holdDays: 14, maxPerMonth: 4 } },
  missions: typeof REWARD_MISSIONS
}
```

`fulfilledAt` means payment-confirmed internal order processing, not a claim of shipment or membership provisioning. `amountCents` is the original product quote before settlement and the actual discounted paid product amount after settlement, excluding tax/shipping. It is not silently reduced on refund; status/ledger communicate reversals.

`referrals.applyCode({ code: string })` (protected): `{ applied: true, status }`; repeated same attribution is idempotent, different code conflicts.

`interest.join({ productId: string, consent: true })` (protected): `{ joined: true, alreadyJoined: boolean, productId: string }`; unknown fields are rejected and no medical data is accepted.

`checkout.createSession({ productId, catalog?: 'services'|'marketplace', email?: string })`: `{ url, orderId }`. Email is contact only; ownership always comes from ctx.user.id. Unknown product returns NOT_FOUND before auth; blocked known product PRECONDITION_FAILED before auth; eligible product requires login. Success/cancel returns to `/account?checkout=processing|cancelled&order=...` (processing also includes session_id), for navigation status only. Processing triggers the account UI's verification polling; the URL is never evidence of payment.

`rewards.me`: existing `{ account, events, missions }` shape, backed by the same reconciled account state. `rewards.claimMission` cannot award purchases/referrals, and the planned reading mission is unavailable until trusted verification exists. `checkout.history`: protected latest 100 public order snapshots, without payment/reward release side effects.

## Parent integration additions

`interest.mine()` is protected and returns at most 25 of the authenticated user's `{productId, createdAt, title}` records; it exposes no other user's identity. `interest.leave({productId})` is protected, strictly rejects additional fields, and removes only the authenticated user/product pair inside the existing commerce transaction. It is idempotent, including when a reference is later removed from the catalogue. The account panel provides explicit withdrawal; no marketing-email delivery is enabled.

Readiness now includes `services.checkoutOrigin`, using the same pure origin-configuration parsing as checkout. Credential presence is insufficient when PUBLIC_APP_URL/ALLOWED_ORIGINS is absent, malformed or path-bearing. `connectivityVerified:false` remains explicit. The recovered `pnpm db:push` command now stops safely with instructions and performs no schema operation.
