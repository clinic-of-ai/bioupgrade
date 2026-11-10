import { defineConfig } from "drizzle-kit";
/** Generate-only baseline for a verified-empty new deployment. Never use against the original DB. */
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/fresh",
  dialect: "mysql",
});
