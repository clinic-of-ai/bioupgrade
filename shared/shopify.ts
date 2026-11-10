export const SHOPIFY_REFERENCE_DOMAIN = "6v43dx-ck.myshopify.com";
export const SHOPIFY_API_VERSION = "2026-10";
/** Existing owner store references; not an equivalence to the educational scopes. */
export const EXISTING_SHOPIFY_SERVICES = [
  { id: "gid://shopify/Product/10996820869458", title: "Bio-Strategy Session" },
  { id: "gid://shopify/Product/10996822245714", title: "The Growth Protocol" },
  {
    id: "gid://shopify/Product/10996822278482",
    title: "The Performance Blueprint",
  },
  {
    id: "gid://shopify/Product/10996822311250",
    title: "Elite Concierge Protocol",
  },
] as const;
export type ShopifyMoney = { amount: string; currencyCode: string };
export type ShopifyVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
};
export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  productType: string;
  description: string;
  availableForSale: boolean;
  image: { url: string; altText: string | null } | null;
  variants: ShopifyVariant[];
};
export type ShopifyCatalogResult = {
  status: "connected" | "unavailable" | "disabled";
  storeDomain: string;
  updatedAt: string | null;
  products: ShopifyProduct[];
  cartEnabled: boolean;
  checkoutEnabled: boolean;
  message: string;
};
export type ShopifyCartLine = {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string;
  merchandiseId: string;
  productId: string;
  price: ShopifyMoney;
  totalAmount: ShopifyMoney;
};
/** Intentionally omit the full Shopify cart ID/key and checkout URL. */
export type ShopifyCart = {
  totalQuantity: number;
  lines: ShopifyCartLine[];
  subtotalAmount: ShopifyMoney;
  totalAmount: ShopifyMoney;
  warnings: string[];
};
export type ShopifyCartResult = {
  cart: ShopifyCart | null;
  cartEnabled: boolean;
  checkoutEnabled: boolean;
  message: string;
};
export type ShopifyCartMutation =
  | { action: "add"; merchandiseId: string; quantity: number }
  | { action: "update"; lineId: string; quantity: number }
  | { action: "remove"; lineId: string }
  | { action: "clear" };
