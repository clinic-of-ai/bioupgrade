import { getMarketplaceProduct } from "./marketplace";
import { getProductImage } from "./product-images";

export type PublicPageMetadata = {
  title: string;
  description: string;
  status: number;
  indexable: boolean;
  image: string;
  path: string;
};
export const PUBLIC_PAGE_PATHS = [
  "/",
  "/research",
  "/meta",
  "/community",
  "/documentation",
  "/shop",
  "/products",
  "/book",
];
export const PUBLIC_LOGO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/logo-mark-4CamwMqXAZn3xB9uBMBwJF.webp";
export function getPublicPageMetadata(path: string): PublicPageMetadata {
  const standard = {
    status: 200,
    indexable: true,
    image: PUBLIC_LOGO_IMAGE,
    path,
  };
  const pages: Record<string, [string, string]> = {
    "/": [
      "Bioupgrade — Molecular science, papers and the Meta",
      "Explore source-led molecular science, primary papers, educational consultations and a research catalogue with explicit evidence and documentation boundaries.",
    ],
    "/research": [
      "Bioupgrade Research — Primary papers and evidence context",
      "Read verified molecular research papers with study types, findings, DOI links and limitations. Named-compound evidence is separate from supplier verification.",
    ],
    "/meta": [
      "The Meta — Precision molecular research | Bioupgrade",
      "Explore precision molecular development through source-linked perspectives on mechanisms, endpoints, replication and the limits of research inference.",
    ],
    "/community": [
      "Bioupgrade Community — Source-led research literacy",
      "Discover research-literacy standards, a local question builder, educational conversations and transparent Signal Points and referral rules.",
    ],
    "/documentation": [
      "Research documentation and source standards | Bioupgrade",
      "Understand owner-listed prices, scientific citations and batch COA/SDS requirements. Documentation gaps remain visible; a label is not procurement approval.",
    ],
    "/shop": [
      "The Bioupgrade Shop — Molecular research catalogue",
      "Explore 27 owner-listed research variants with exact EUR prices, molecular context and primary papers. Research procurement and batch documents remain separate.",
    ],
    "/products": [
      "Bioupgrade educational consultations and evidence services",
      "Explore research strategy sessions, evidence briefings and human-reviewed bioscience AI workflows. Defined scopes, transparent prices and no medical prescribing.",
    ],
    "/book": [
      "Book an educational research consultation | Bioupgrade",
      "Discuss papers, research questions and study limitations in a 60-minute educational session. Scheduling and payment are separate; no medical prescribing.",
    ],
  };
  if (pages[path])
    return { ...standard, title: pages[path][0], description: pages[path][1] };
  if (path === "/cart")
    return {
      ...standard,
      title: "Your Shopify cart | Bioupgrade",
      description:
        "Review the current Shopify cart before a separately verified hosted checkout. Cart activity is not proof of purchase or Signal Points.",
      indexable: false,
    };
  if (path === "/account")
    return {
      ...standard,
      title: "My Signal account | Bioupgrade",
      description:
        "Sign in to your private orders, points ledger, saved interests and referrals.",
      indexable: false,
    };
  if (path.startsWith("/shop/")) {
    const product = getMarketplaceProduct(path.slice("/shop/".length));
    if (product)
      return {
        ...standard,
        title: `${product.title} — Research record | Bioupgrade`,
        description:
          `${product.title}: ${product.priceLabel}. ${product.description}`.slice(
            0,
            160
          ),
        image: getProductImage(product.id, product.familyId).src,
        indexable: product.source === "prior-list",
      };
  }
  return {
    ...standard,
    title: "Page not found | Bioupgrade",
    description:
      "This address does not match a known public Bioupgrade page or catalogue entry.",
    status: 404,
    indexable: false,
  };
}
