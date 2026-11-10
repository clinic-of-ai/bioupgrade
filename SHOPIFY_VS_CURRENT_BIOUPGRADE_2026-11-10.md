# Shopify versus the current Bioupgrade platform

**Author:** Manus AI  
**Date:** 10 November 2026

**We do not need to discard the existing design to use Shopify.** The strongest Shopify option for Bioupgrade is to preserve the current custom website and use Shopify behind it for commerce. That is called **headless commerce**: the visible website stays custom, while Shopify handles products, carts, checkout and order operations. Shopify explicitly supports this architecture. It also warns that headless costs more to build and maintain than a standard theme. [1]

My recommendation is therefore **keep the existing UI and academic/community experience whichever payment route we choose; do not rebuild the whole site as a Shopify theme merely because you own a store**. Shopify becomes worthwhile when physical-product operations are a substantial near-term part of the business. If consulting and research literacy lead the launch, retaining the current Stripe implementation is the smaller and more direct route. The earlier Stripe choice was sensible for recovery; it is not a reason to dismiss Shopify permanently.

## What you actually have now

Your Shopify connector is enabled and its Admin API confirms the store is **My Store**, at `6v43dx-ck.myshopify.com`, with **EUR** as its currency. Its public storefront currently displays an “Opening soon” password page. It is not the revised Bioupgrade website. [2]

A read-only catalogue request returned four active products, with no next page: **Bio-Strategy Session**, **The Growth Protocol**, **The Performance Blueprint** and **Elite Concierge Protocol**, all labelled Consultation and vendor Bio.Science. This is useful existing store data, not an empty store. The returned catalogue contained no research-compound products. Those consultation names differ from the four current website offers, so we should agree an explicit offer mapping rather than overwrite them or assume identical pricing. This inspection did not verify their variant prices, payment setup, sales history or subscription bill.

The current Bioupgrade source is React/Vite with an Express/tRPC backend, MySQL/Drizzle records and Stripe integration. It includes the designed landing page, 27 owner-listed product variants, 16 family briefs, 21 source-linked papers, product detail pages, Meta editorial, consulting pages, community tools and custom Signal Points/referrals. The latest source passed 128 isolated tests and 29 local HTTP checks. Those checks verify application behaviour, not live merchant approval or production operation.

The distinction matters: the source runs, but the original production website, database, authentication, Stripe and storage have not been reattached here. Research checkout remains disabled. Native stock management, fulfilment, shipping operations, renewal entitlements and an unattended refund reconciler are not complete. Neither platform should be described as launch-ready solely because a page or product record exists.

## Will we lose the design, UI or UX?

### Keep the custom website and Stripe

This preserves the current frontend and its existing commerce integration. Typography, colours, layouts, navigation, paper cards, detail pages, consulting flow, account and community components remain in the same codebase. There is no redesign requirement.

The disadvantage is ownership of the missing operational features. Stock, fulfilment, shipping, returns, customer notifications and staff administration need development or integrations. Stripe supplies payment infrastructure, not a complete retail operating system. Keeping the current route is not “free”: hosting, database/storage, security, maintenance and optional billing/tax services still cost money. Stripe describes its core Payments pricing as pay-as-you-go without a setup or monthly Payments fee; additional products have separate pricing. [3]

This route is strongest for an initial business centred on educational consultations, evidence briefings, workshops and custom research-workflow services.

### Rebuild the whole website as a Shopify theme

Shopify would provide the conventional storefront foundation and its hosted commerce administration. Standard retail work becomes easier to delegate through Shopify Admin, and the theme route avoids maintaining a separate custom storefront host for ordinary theme pages. Shopify advertises inventory management, discounts, customer segmentation, marketing tools, abandoned-checkout recovery and order-related operations, with features depending on plan, region and eligibility. [4]

However, this is the route with the greatest risk to the careful frontend work. The current React components do not automatically become Shopify theme components. We would have to port or recreate the design and interactions, then connect the academic library, custom account, points and community features. We could reproduce much of the visual style, but it would be a redevelopment project—not an automatic transfer or a guaranteed pixel-identical result.

A theme is suitable if you consciously want a conventional store to become the main experience. It is not my first choice for Bioupgrade’s distinctive academic and community positioning.

### Preserve the custom frontend and add Shopify commerce

This is the best Shopify route if preserving the existing site is non-negotiable. We would retain the current frontend components and branding, while adapting the commerce layer to Shopify’s products, cart and checkout APIs. The paper library, Meta content, community tools and consulting explanations can stay where they are. Shopify’s official headless documentation explicitly supports adding its commerce to existing infrastructure and choosing your own frontend stack. [1]

That does **not** mean zero migration work. The shop would need Shopify product/variant mappings, cart persistence, availability and price retrieval, checkout handoff, order events and account integration. We should keep existing catalogue provenance and supplier-document boundaries, not replace them with unqualified Shopify product descriptions.

The final payment step would change. Our present code already hands off to hosted Stripe Checkout; a Shopify route would normally hand off to Shopify checkout. The surrounding journey can retain our design, but the checkout screen is not an arbitrary React page that we can make identical. Shopify’s published plans distinguish limited checkout customisation from the fully customisable checkout offered with Plus. We should not buy an expensive plan just to chase cosmetic parity without a concrete requirement. [4]

This option preserves the most frontend investment and gains substantial commerce operations, but it retains custom hosting and backend maintenance and adds a Shopify integration to maintain.

## Which Shopify benefits are genuinely valuable here?

**A real product and order back office is the largest gain.** Staff could manage product variants, prices, inventory, collections and routine order work through Shopify instead of editing source files or commissioning an admin panel. Your 27 listed variants make this relevant if they become verified, stocked, permitted products. Shopify does not produce the stock records, batch identity, supplier permissions or COAs; those still come from your actual operations. [4]

**Fulfilment and customer-service tooling can save custom development.** Shopify provides a mature foundation for managing orders and integrating shipping, returns and notifications. Exact labels, carriers, payment-linked benefits and regional features must be checked for your store. For a physical-products business, that can be more valuable than the nominal difference in payment fees. [4]

**Retail marketing tools become easier to connect.** Discounts, segmentation and abandoned-checkout recovery are ordinary platform capabilities. Additional apps can extend subscriptions, booking, loyalty or marketing, but apps are not automatically free, and their rules do not automatically match our custom Signal Points. Their billing and data access need review. [4] [5]

**Social commerce has useful integrations, but not automatic eligibility.** Shopify’s Facebook/Instagram channel requires a non-private store, the right business/professional accounts, verified purchase domain and eligible products. It does not make every research product eligible for Instagram tags or ads. The exact Instagram ownership and Bioscience Discord destination still need confirmation; Discord discussion and role logic remain custom work. [6]

**Platform-managed commerce reduces part of the maintenance burden.** Shopify handles its own commerce infrastructure and standard platform updates. A headless Bioupgrade still owns frontend hosting, its custom account/points backend, consent handling and integration security. This is reduced retail infrastructure work, not the disappearance of all technical responsibility. [1] [4]

## What Shopify will not give us automatically

The academic layer is our differentiation, not a Shopify feature we would suddenly gain. The source-linked paper records, model/limitation labels, Meta editorial, question builder and study-to-community journey already exist. Keeping them in the custom frontend is more useful than rebuilding them into a generic catalogue.

Signal Points and referrals also remain application logic. Our current payment processing checks order ownership, paid status, duplicate events, refunds/disputes and referral qualification. Shopify has customer/order APIs, but moving orders there does not migrate our ledger or make a standard loyalty app equivalent. We would need a verified link between Bioupgrade users and Shopify customers, provider-specific order records, authenticated event handling, deduplication, refund reconciliation and protection against duplicate awards. Existing identities and historical ledger records should be preserved, not reconstructed from email matches. [1]

Shopify does not deliver a completed consulting practice. Staff capability, agreed scope, intake, scheduling, service terms and fulfilment of written outputs still need work. It can sell service products, but it does not determine whether an enquiry should become a €200 session, an €850 briefing or a quoted workflow project.

Finally, Shopify does not verify scientific claims, supplied batches or research organisations. Those controls are specific to this business. A custom frontend login or hidden purchase button is not adequate proof of laboratory eligibility; any required buyer-control design must work through all permitted purchase routes and be checked against the chosen platform/plan.

## Payments and the research catalogue

The comparison is **custom platform plus Stripe versus Shopify commerce**, not two interchangeable gateways. Shopify itself and Shopify Payments have different rules. Shopify may permit a storefront whose business is not supported by Shopify Payments, in which case an available, approved third-party provider is needed. Do not assume the existing Stripe account can simply be plugged into Shopify unchanged. [5] [7]

Stripe’s current FAQ explicitly describes conditional support for research peptides when preventive measures stop nonresearch purchases. Shopify Payments lists restricted categories including prescription drugs and products with unverified health claims, with regional variation. Both require review of the actual business and products. I am not using FDA status to rank your catalogue; the relevant platform decision is whether the chosen provider supports your actual merchant model, claims and buyer controls. A research-only label or academic page does not by itself answer that question. [7] [8]

Shopify’s acceptable-use policy separately requires compliance with the rules where business is conducted, partner terms and applicable channel requirements. Keeping an educational platform and a research-procurement flow separate can clarify their functions, but it must be transparent to providers—not an attempt to hide part of the business from review. [9]

There is also a specific **Manus integration constraint**: the managed Shopify and Stripe integrations are mutually exclusive within one website project. That does not mean separate services can never coexist technically. It means we cannot present a one-click combined managed integration as available in this project. A separate-store/services arrangement would need an explicit architecture and secure cross-system account/order handling.

## Costs: where Shopify can become more expensive

A theme-based Shopify store pays its plan and any apps/processing charges, while ordinary theme hosting is included. A headless setup pays Shopify **and** retains custom hosting/backend costs. Our current platform avoids a Shopify subscription but still needs infrastructure, maintenance and payment fees. [1] [3] [4]

The clearest published fee difference is Shopify’s **2% third-party transaction fee on Basic**, additional to the external provider’s processing fee. For €10,000 of payments subject to that surcharge, the extra Shopify charge is **€200**, before the subscription, apps and gateway fees. This is a calculation using the published rate, not your actual invoice. Higher plans display lower third-party rates; an upgrade is only worthwhile after comparing its extra plan cost with the fees and operational features saved. [4] [5]

That surcharge is not applied to covered Shopify Payments transactions. Shopify Payments has its own processing rates and eligibility conditions. We should compare the provider you can actually use, not assume access to the lowest advertised rate. Public plan prices vary by region and billing cycle; the rendered pricing and static regional extraction differed during this check, so I have not treated either as your contractual subscription price. Your actual plan/bill has not been verified. [4] [5]

The economic decision is therefore: **are the retail operations Shopify removes worth its subscription, app charges, possible gateway surcharge and integration maintenance?** If the answer is yes, it can be cheaper overall than building and supporting a complete retail back office. If sales are mainly occasional high-value consultations, those operational savings are smaller and the custom Stripe route is usually more proportionate.

## My recommendation for Bioupgrade

**Preserve the current frontend. Do not start again as a Shopify theme.** Your design and source-led experience should remain the public face of the business.

If the near-term launch is mainly consultations, papers and community, keep the current Stripe route and complete the original production reconnection. Shopify’s current four consultation records alone do not create enough new operational value to justify migrating the custom account and checkout flow.

If the 27-product catalogue is intended to become a substantial, actively fulfilled retail operation, **Shopify as a headless commerce backend is worth adopting** once merchant/payment eligibility and buyer controls are confirmed. That gains the product/order back office without throwing away the UI. It is a targeted commerce migration, not a full website rebuild.

Before choosing that route, the decisive inputs are the approved payment provider, actual plan/app cost, realistic stock and fulfilment process, and the mapping between existing Shopify consultation products and our current offers. Then preserve the frontend and account/ledger data, replace only the necessary commerce contracts, and verify the new cart, checkout, order/refund and points flows before release. The current 128-test result does not certify a future Shopify adapter.

The useful choice is **not “lose the design or miss out on Shopify.”** It is whether Shopify’s operational back office is valuable enough now to justify a controlled backend change while keeping the designed website.

No products, store settings, payment integrations or website source were changed for this analysis.

## References

[1]: https://shopify.dev/docs/storefronts/headless "Shopify: About headless commerce"
[2]: https://6v43dx-ck.myshopify.com/ "Supplied Shopify storefront: Opening soon"
[3]: https://stripe.com/pt/pricing "Stripe Portugal: Pricing and product fees"
[4]: https://www.shopify.com/pt/precos "Shopify Portugal: Plans, features and transaction fees"
[5]: https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/pricing-overview "Shopify: Pricing plans and billing overview"
[6]: https://help.shopify.com/en/manual/online-sales-channels/facebook-instagram-by-meta/requirements "Shopify: Facebook and Instagram by Meta requirements"
[7]: https://help.shopify.com/en/manual/payments/shopify-payments/onboarding/eligibility "Shopify Payments: Eligibility and prohibited categories"
[8]: https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs "Stripe: Prohibited and restricted businesses FAQs"
[9]: https://www.shopify.com/legal/aup "Shopify: Acceptable Use Policy"
