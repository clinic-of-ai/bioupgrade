# Bioupgrade: platform decision

**Keep the existing custom platform and Stripe.** Bioupgrade's core should be source-led learning, educational services, an authenticated community and auditable Signal Points. A permitted, verified shop can support that experience. Research procurement, if feasible, needs a separately authorised operating model; a membership tier is never a research-buyer credential.

Shopify becomes worth reconsidering when real ordinary-goods inventory, shipping, returns and merchandising complexity justify its operational tooling. None of those requirements was verified from the uploaded price image or exported application. Migrating now would replace existing account/reward work without solving product eligibility. Shopify and Stripe are also mutually exclusive as managed integrations in one Manus website.

## What the recovered code changed about the assessment

The ZIP is the actual existing React/Vite, Express, tRPC, Drizzle/MySQL and Stripe source, not a rebuild. It contains a broken catalogue template string; excludes essential core authentication/runtime source; presents two placeholder products as available; charges a monthly-labelled membership through one-time Checkout; lets a client claim purchase/referral missions; records no durable orders; and awards points at session completion without checking the paid state. Existing reward-event lookup alone does not provide concurrency-safe deduplication. No refund/dispute reward reversal or account dashboard was complete.

The original launch claims have therefore been replaced with explicit staging, rather than treating a prior 'five tests passed' report as current evidence. The supplied image is preserved as 23 separate supplier-reference rows, with the earlier 27-row list retained as another source. Conflicting prices are not merged; ambiguous names such as SEMAK are not silently corrected. Shipping prices are references, not activated shipping rates. Unsupported supplier quality/result claims and unverified member testimonials are not republished as facts.

The implementation work repairs the exported source, retains original routes/branding/storage references, and adds account history, a protected points ledger, referral attribution, controlled interest capture and payment verification logic. It does not create or migrate a Manus website, configure a payment account, submit pharmacy approvals, connect a live database, run production migrations or publish a website. See README.md and the migration notes for exact runtime and verification limitations.

## Product and payment eligibility

Stripe's official FAQ is not a blanket peptide ban: some nonprescription peptides may be supported if safe, properly branded and not marketed with false or misleading claims; research-peptide sales require preventive measures blocking nonresearch buyers; prescription peptides require pharmacy merchant preapproval. Product law, account review and the actual business still matter. [Stripe FAQ](https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs)

Stripe separately prohibits illegal products, incorrectly labelled research chemicals and unsafe or harmful-claim pseudo-pharmaceuticals. [Stripe restricted businesses](https://stripe.com/legal/restricted-businesses)

Shopify Payments eligibility excludes categories including prescription drugs and unverified-health-claim pseudo-pharmaceuticals. Alternative payment providers do not override product law or storefront acceptable-use rules. [Shopify Payments eligibility](https://help.shopify.com/en/manual/payments/shopify-payments/onboarding/eligibility) · [Shopify acceptable-use policy](https://www.shopify.com/legal/aup)

The EMA/HMA warning about illegal online GLP-1 products, including tirzepatide, makes consumer-facing medicine sales a material launch risk. It does not classify every lab reagent as a medicine, but a supplier price list is not evidence of an authorised pharmacy offer. [EMA warning](https://www.ema.europa.eu/en/news/warning-about-sharp-rise-illegal-medicines-sold-eu)

These official sources were reviewed on 4 November 2026. This is an architecture and launch-risk assessment, not legal authorisation, product approval or a guarantee that a processor will approve Bioupgrade.
