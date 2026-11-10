# Managed deployment status —10November2026

The owner delegated the original-resource versus new-managed-deployment choice. This revision uses the new managed Bioupgrade project and preserves the revised React/Wouter/Express source, brand and existing Shopify merchant rather than rebuilding a Shopify theme. The original website, store data and historical account database are untouched.

Managed source directory: `/home/ubuntu/bioupgrade`. The new project has server/database capabilities, a container declaration using the existing Dockerfile and `/api/health`, server-first routing and host-owned TypeScript diagnostics. Code/dependencies were transferred without private values or the old Git repository.

The new database was verified empty, then initialized explicitly from the current nine-table application schema with a separate fresh Drizzle baseline and digest/version record. There are10tables including the schema-version record. No fake accounts, orders or points were seeded, and no historical data were imported. The uploaded archive’s incomplete migration chain was not executed. `scripts/init-fresh-project-db.mjs` refuses nonempty databases and never runs at application startup.

The existing store remains `6v43dx-ck.myshopify.com`. The recorded real public Storefront request returned HTTP400: “Online Store channel is locked.” This is not solved by enabling buttons, assuming Admin active products are public, supplying a fake token or bypassing the store password. The supported managed existing-store selection card is the next connection step.

Cart uses a dedicated server-only secret, exact authorised origins and explicit service approvals. Its secret is not copied from authentication keys or committed source. New Shopify purchases are not yet linked to Bioupgrade users, order history or Signal Points; verified order/customer/refund-event linkage remains separate work. The preserved legacy account/ledger implementation is not an automatic historical migration or settlement link.

Checkpoint/publication/browser verification evidence is appended only after those operations actually complete. A managed project or healthy local listener alone is not a successful publication or payment test.

## New managed listener observation

The development service starts on the configured port3000 with the exact returned Preview origin. Health200reports new OAuth/database/storage configuration present, Shopify selected, and checkout not configured. The channel catalogue response is an honest unavailable200with no products/actions; guest cart is null/disabled. Unauthenticated account reads now return401rather than the old missing-configuration503. The37-route manifest is valid. The original hero reference returns403from new storage ownership. A concrete development-only `/products`500was observed and is being corrected before the final checkpoint; no passing public-page claim is made from that initial smoke.

## Completed source and Preview verification

The public-page500is fixed by React’s automatic JSX runtime and restarting the compiled checked build. Application/test-source types,282isolatedcases/20files and production build pass. Thirty public read-onlyHTTPchecks plus five Shopify-state/origin cases pass. Focused real Preview visits show the cart unavailable state and the preserved consultation page with the genuine channel-lock panel, no invented merchant prices and no purchase action. Live embedded/standalone cart persistence, payment and new account/reward linkage remain unverified.

The next required owner action is the managed **Connect an existing Shopify store** card for `6v43dx-ck.myshopify.com`. A dedicated protected cart secret, exact final origins, approved real service/variant scope and actual channel readiness are still needed. No other merchant store or copied authentication secret has been created. The managed source checkpoint is saved only after the canonical push receipt; permanent publication remains open until the required owner connection flow is completed.
