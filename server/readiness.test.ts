import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getServiceStatus } from "./_core/env";
import { hasValidCheckoutOriginConfiguration } from "./commerceRules";
beforeEach(() => {
  vi.stubEnv("COMMERCE_PROVIDER", "stripe");
  vi.stubEnv("MANUS_PROJECT_ID", "readiness-dummy-project");
  vi.stubEnv("MANUS_JWT_SECRET", "readiness-dummy-no-real-signing");
  vi.stubEnv("MANUS_OAUTH_API_URL", "https://oauth-api.example.test");
  vi.stubEnv("MANUS_OAUTH_PORTAL_URL", "https://oauth.example.test");
  vi.stubEnv("DATABASE_URL", "mysql://mocked-not-connected");
  vi.stubEnv("STRIPE_SECRET_KEY", "not-a-real-key");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "not-a-real-webhook-secret");
  vi.stubEnv("PUBLIC_APP_URL", "");
  vi.stubEnv("ALLOWED_ORIGINS", "");
});
afterEach(() => vi.unstubAllEnvs());
describe("Required checkout-origin readiness", () => {
  it("stays unavailable when credentials are present but origin configuration is absent", () => {
    expect(getServiceStatus().configured).toBe(false);
    expect(getServiceStatus().services.checkoutOrigin).toBe(false);
  });
  it("rejects a path-bearing public URL even with otherwise complete credentials", () => {
    vi.stubEnv("PUBLIC_APP_URL", "https://app.example.test/not-an-origin");
    expect(getServiceStatus().configured).toBe(false);
    expect(hasValidCheckoutOriginConfiguration()).toBe(false);
  });
  it("rejects malformed additional origins rather than silently skipping them", () => {
    vi.stubEnv("PUBLIC_APP_URL", "https://app.example.test");
    vi.stubEnv("ALLOWED_ORIGINS", "https://preview.example.test/invalid");
    expect(getServiceStatus().configured).toBe(false);
  });
  it("accepts exact valid checkout origins without claiming external verification", () => {
    vi.stubEnv("PUBLIC_APP_URL", "https://app.example.test");
    expect(getServiceStatus().configured).toBe(true);
    expect(getServiceStatus().connectivityVerified).toBe(false);
    vi.stubEnv("PUBLIC_APP_URL", "");
    vi.stubEnv("ALLOWED_ORIGINS", "https://preview.example.test");
    expect(getServiceStatus().configured).toBe(true);
  });
});
