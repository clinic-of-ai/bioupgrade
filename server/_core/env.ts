// Read at call time: compilation must not require service credentials.
// Canonical Manus names take precedence; adopted exports retain their aliases.
import { hasValidCheckoutOriginConfiguration } from "../commerceRules";
import { getCommerceProvider } from "../../shared/commerce-provider";
import { getShopifyConfiguration } from "../shopify-routes";
export const ENV = {
  get appId() {
    return process.env.MANUS_PROJECT_ID || process.env.VITE_APP_ID || "";
  },
  get cookieSecret() {
    return process.env.MANUS_JWT_SECRET || process.env.JWT_SECRET || "";
  },
  get databaseUrl() {
    return process.env.DATABASE_URL || "";
  },
  get oAuthServerUrl() {
    return (
      process.env.MANUS_OAUTH_API_URL || process.env.OAUTH_SERVER_URL || ""
    );
  },
  get oAuthPortalUrl() {
    return (
      process.env.MANUS_OAUTH_PORTAL_URL ||
      process.env.VITE_OAUTH_PORTAL_URL ||
      ""
    );
  },
  get ownerOpenId() {
    return process.env.OWNER_OPEN_ID || "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get forgeApiUrl() {
    return (
      process.env.MANUS_API_URL || process.env.BUILT_IN_FORGE_API_URL || ""
    );
  },
  get forgeApiKey() {
    return (
      process.env.MANUS_API_KEY || process.env.BUILT_IN_FORGE_API_KEY || ""
    );
  },
  get appOrigin() {
    return process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || "";
  },
};

export function isServiceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}

export function isSessionConfigured(): boolean {
  return Boolean(ENV.appId && ENV.cookieSecret);
}

export function isOAuthConfigured(): boolean {
  return (
    isSessionConfigured() &&
    isServiceUrl(ENV.oAuthServerUrl) &&
    isServiceUrl(ENV.oAuthPortalUrl) &&
    Boolean(ENV.databaseUrl)
  );
}

export function getServiceStatus() {
  const commerceProvider = getCommerceProvider();
  const shopify = getShopifyConfiguration();
  const services = {
    authentication: isOAuthConfigured(),
    database: Boolean(ENV.databaseUrl),
    payments:
      commerceProvider === "shopify"
        ? shopify.checkoutConfigured
        : Boolean(
            process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
          ),
    storage: isServiceUrl(ENV.forgeApiUrl) && Boolean(ENV.forgeApiKey),
    checkoutOrigin:
      commerceProvider === "shopify"
        ? shopify.originsConfigured
        : hasValidCheckoutOriginConfiguration(),
  };
  return {
    commerceProvider,
    shopify: { ...shopify, active: commerceProvider === "shopify", accountLinkageImplemented: false },
    configured:
      services.authentication &&
      services.database &&
      services.payments &&
      services.checkoutOrigin,
    services,
    // This is configuration readiness, not a claim of live upstream connectivity.
    connectivityVerified: false,
  };
}
