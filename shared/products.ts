export type ProductKind = "service" | "workshop" | "session";

export type Product = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  priceLabel: string;
  amountEur: number;
  kind: ProductKind;
  deliverables: string[];
  featured?: boolean;
  checkoutEnabled?: boolean;
};

/**
 * Educational scope catalogue. Historical Stripe checkout uses these EUR
 * amounts only when explicitly selected. Existing Shopify services have separate
 * identities and authoritative variant prices, not an inferred scope mapping.
 */
export const PRODUCTS: Product[] = [
  {
    id: "research-strategy-session",
    title: "Research Strategy Session",
    eyebrow: "60 MIN · 1:1",
    description:
      "One paper, one educational question: examine the entity, model, endpoint and limitations, then agree a concise written question map.",
    priceLabel: "€200",
    amountEur: 200,
    kind: "session",
    deliverables: ["Decision map", "Evidence read", "Next-step shortlist"],
    checkoutEnabled: true,
  },
  {
    id: "evidence-briefing",
    title: "Evidence Briefing",
    eyebrow: "SCOPED EVIDENCE · PROJECT",
    description:
      "A citation-linked synthesis for one scoped educational or internal research question, with documented source boundaries and uncertainty.",
    priceLabel: "From €850",
    amountEur: 850,
    kind: "service",
    deliverables: ["Source map", "Evidence levels", "Decision session"],
    featured: true,
    checkoutEnabled: false,
  },
  {
    id: "ai-workflow-sprint",
    title: "AI Workflow Sprint",
    eyebrow: "HUMAN REVIEW · B2B",
    description:
      "Evaluate one permitted research-document workflow through an agreed baseline, bounded proof of concept, citation checks and human-review handoff.",
    priceLabel: "From €2,800",
    amountEur: 2800,
    kind: "service",
    deliverables: [
      "Baseline + PoC",
      "Evaluation rubric",
      "Governance hand-off",
    ],
    checkoutEnabled: false,
  },
  {
    id: "bioscience-ai-workshop",
    title: "Applied AI in Bioscience",
    eyebrow: "TEAM · HALF DAY",
    description:
      "A half-day team exercise using one approved case to practise source evaluation, citation verification, prompting and human-reviewed AI workflows.",
    priceLabel: "From €1,200",
    amountEur: 1200,
    kind: "workshop",
    deliverables: ["Real team case", "Reusable SOP", "Quality rubric"],
    checkoutEnabled: false,
  },
];

export function getProduct(productId: string) {
  return PRODUCTS.find(product => product.id === productId);
}
