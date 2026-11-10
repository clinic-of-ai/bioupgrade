#!/usr/bin/env node
import { createGraphQLClient } from "@shopify/graphql-client";
import { writeFile } from "node:fs/promises";
const domain = "6v43dx-ck.myshopify.com";
const client = createGraphQLClient({
  url: `https://${domain}/api/2026-10/graphql.json`,
  headers: { "Content-Type": "application/json" },
  customFetchApi: fetch,
  retries: 0,
});
const response = await client.fetch(`query BioupgradePublicInventory {
  products(first:5) {
    nodes {
      id title handle productType availableForSale
      variants(first:10) { nodes { id title availableForSale price { amount currencyCode } } }
    }
    pageInfo { hasNextPage }
  }
}`, { signal: AbortSignal.timeout(15000) });
const raw = await response.text();
let body;
try { body = JSON.parse(raw); } catch { body = {}; }
const safe = {
  checkedAt: new Date().toISOString(),
  domain,
  authentication: "documented-tokenless-storefront",
  success: Boolean(response.ok && body.data && !body.errors),
  httpStatus: response.status,
  data: body.data ?? null,
  error: response.ok && !body.errors ? null : {
    message: body.errors ?? "Storefront request rejected",
    responseDiagnostic: raw.slice(0, 600),
  },
};
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(safe, null, 2) + "\n");
console.log(JSON.stringify(safe, null, 2));
process.exitCode = safe.success ? 0 : 1;
