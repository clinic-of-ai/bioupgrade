import { SCREENSHOT_REFERENCE } from "./supplier-reference";
import { getResearchBrief, getFamilyName } from "./research";
import { getProductImage, type ProductImage } from "./product-images";

export type MarketplaceKind =
  | "field-kit"
  | "peptide"
  | "molecule"
  | "membership"
  | "accessory";
export type SaleStatus = "available" | "waitlist" | "gated" | "review";
export type MarketplaceProduct = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  priceLabel: string;
  amountEur: number;
  kind: MarketplaceKind;
  status: SaleStatus;
  complianceNote: string;
  points: number;
  featured?: boolean;
  shopifyHandle?: string;
  commerceApproved: boolean;
  source?: "concept" | "prior-list" | "supplier-image";
  quantityLabel?: string;
  billing?: "one-time" | "monthly";
  familyId?: string;
  topic?: string;
  manufacturerLabel?: string;
  formLabel?: string;
  documentationStatus?: string;
  image?: ProductImage;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
type OwnerRow = [
  title: string,
  price: number,
  familyId: string,
  quantity: string,
  brand: string,
  form: string,
];
/** Owner's current list: stated names, pack quantities and prices; not an invented stock ledger. */
export const OWNER_CATALOGUE_ROWS: OwnerRow[] = [
  [
    "Tirzepatida 10mg ZPHC",
    75,
    "tirzepatide",
    "10 mg",
    "ZPHC",
    "Form not provided",
  ],
  [
    "Tirzepatida 25mg (5x5mg) ZPHC",
    150,
    "tirzepatide",
    "25 mg total · 5 × 5 mg",
    "ZPHC",
    "5-unit pack, as labelled",
  ],
  [
    "Tirzepatida 30mg",
    115,
    "tirzepatide",
    "30 mg",
    "Not provided",
    "Form not provided",
  ],
  [
    "Tirzepatida 60mg",
    145,
    "tirzepatide",
    "60 mg",
    "Not provided",
    "Form not provided",
  ],
  [
    "Tirzepatida pen 10mg",
    90,
    "tirzepatide",
    "10 mg",
    "Not provided",
    "Pen, as labelled",
  ],
  [
    "Tirzepatida pen 30mg",
    145,
    "tirzepatide",
    "30 mg",
    "Not provided",
    "Pen, as labelled",
  ],
  [
    "Pen Tirzepatida 30mg ZPHC",
    180,
    "tirzepatide",
    "30 mg",
    "ZPHC",
    "Pen, as labelled",
  ],
  [
    "Tirzepatida pen 60mg",
    170,
    "tirzepatide",
    "60 mg",
    "Not provided",
    "Pen, as labelled",
  ],
  [
    "Pen Semaglutida 6mg ZPHC",
    100,
    "semaglutide",
    "6 mg",
    "ZPHC",
    "Pen, as labelled",
  ],
  [
    "HGH Frag 10mg EVOPEP",
    80,
    "hgh-fragment",
    "10 mg",
    "EVOPEP",
    "Exact fragment sequence not provided",
  ],
  [
    "Klow 80mg",
    120,
    "klow",
    "80 mg",
    "Not provided",
    "Blend composition not provided",
  ],
  [
    "Glow 70mg",
    110,
    "glow",
    "70 mg",
    "Not provided",
    "Blend composition not provided",
  ],
  ["GHK-Cu 100mg", 90, "ghk-cu", "100 mg", "Not provided", "Form not provided"],
  ["GHK-Cu 100mg ZPHC", 120, "ghk-cu", "100 mg", "ZPHC", "Form not provided"],
  [
    "GHK-Cu 100mg EVOPEP",
    120,
    "ghk-cu",
    "100 mg",
    "EVOPEP",
    "Form not provided",
  ],
  ["GHK-Cu 200mg ZPHC", 160, "ghk-cu", "200 mg", "ZPHC", "Form not provided"],
  [
    "Tesamorelin 10mg",
    90,
    "tesamorelin",
    "10 mg",
    "Not provided",
    "Form not provided",
  ],
  [
    "Ipamorelin 5mg + CJC s/dac 5mg",
    80,
    "ipamorelin-cjc",
    "Ipamorelin 5 mg + CJC s/dac 5 mg",
    "Not provided",
    "Blend; CJC sequence not provided",
  ],
  [
    "Sermorelin 15mg",
    80,
    "sermorelin",
    "15 mg",
    "Not provided",
    "Form not provided",
  ],
  [
    "Wolverine Stack (BPC-157 10mg + TB-500 10mg)",
    80,
    "wolverine",
    "BPC-157 10 mg + TB-500 10 mg",
    "Not provided",
    "Blend; exact component specifications not provided",
  ],
  [
    "Wolverine Stack (BPC 5mg + TB-500 5mg) ZPHC",
    70,
    "wolverine",
    "BPC 5 mg + TB-500 5 mg",
    "ZPHC",
    "Blend; abbreviated BPC identity not resolved",
  ],
  ["MOTS-c 40mg", 90, "mots-c", "40 mg", "Not provided", "Form not provided"],
  [
    "SS31 30mg",
    100,
    "ss31",
    "30 mg",
    "Not provided",
    "Molecular form not independently verified",
  ],
  [
    "Epithalon 10mg",
    80,
    "epithalon",
    "10 mg",
    "Not provided",
    "Form not provided",
  ],
  [
    "Oxytocin 10mg",
    75,
    "oxytocin",
    "10 mg",
    "Not provided",
    "Form not provided",
  ],
  ["DSIP 10mg", 70, "dsip", "10 mg", "Not provided", "Form not provided"],
  [
    "Glutationa 600mg ZPHC",
    60,
    "glutathione",
    "600 mg",
    "ZPHC",
    "Formulation and route not provided",
  ],
];

export const RESEARCH_TOPICS: Record<string, string> = {
  tirzepatide: "Incretin signalling",
  semaglutide: "Incretin signalling",
  "hgh-fragment": "Molecular identity",
  klow: "Molecular identity",
  glow: "Molecular identity",
  "ghk-cu": "Matrix biology",
  tesamorelin: "Endocrine signalling",
  "ipamorelin-cjc": "Endocrine signalling",
  sermorelin: "Endocrine signalling",
  wolverine: "Component research",
  "mots-c": "Mitochondrial biology",
  ss31: "Mitochondrial biology",
  epithalon: "Cellular ageing",
  oxytocin: "Neuropeptide signalling",
  dsip: "Neuropeptide signalling",
  glutathione: "Redox biology",
};

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  tirzepatide:
    "A reading pathway into dual GIP/GLP-1 receptor pharmacology: ligand design, signalling bias and the distance between a model and a clinical finding.",
  semaglutide:
    "Explore GLP-1 peptide engineering, albumin binding and translational physiology through primary studies—not a generic performance promise.",
  "hgh-fragment":
    "Growth-hormone fragment research begins with an exact sequence. This label does not yet define one, so related fragments are not treated as equivalent.",
  klow: "An identity-first blend entry. Composition and constituent quantities have not been supplied; evidence mapping begins when the formulation is defined.",
  glow: "An identity-first blend entry. The supplied name and mass label do not establish the ingredients, mechanism or an exact literature match.",
  "ghk-cu":
    "Copper–peptide chemistry meets extracellular-matrix research. Investigate a defined complex while keeping animal-model observations separate from human outcomes.",
  tesamorelin:
    "Follow the GHRH signalling axis and learn how endocrine endpoints and study-population boundaries shape the interpretation of human trials.",
  "ipamorelin-cjc":
    "A component-level view of growth-hormone secretagogue research. The no-DAC label requires precise molecular identification; it is not interchangeable with long-acting CJC-1295.",
  sermorelin:
    "A defined GHRH(1–29)-NH2 literature pathway: pituitary signalling, peptide pharmacokinetics and the difference between a hormone response and a clinical outcome.",
  wolverine:
    "Trace BPC-157 and analytical TB-500 literature independently. Component studies do not demonstrate blend synergy, and TB-500 is not automatically full-length thymosin-beta-4.",
  "mots-c":
    "A frontier in mitochondrial-to-nuclear communication: explore AMPK-associated signalling and stress-responsive gene regulation in preclinical research.",
  ss31: "Examine cardiolipin-associated mitochondrial research alongside a clinical trial that did not meet its primary endpoints. A mechanism is a question—not an outcome guarantee.",
  epithalon:
    "An AEDG tetrapeptide reading pathway into telomerase and telomere biology. Cell-culture evidence stays distinct from human longevity claims and Epithalamin extracts.",
  oxytocin:
    "Context matters in neuropeptide signalling. Explore OXTR biology and a bounded human evidence base without broad social-function or performance claims.",
  dsip: "A historical research lens on sleep-related peptide biology and EEG endpoints, including weak and inconsistent human-study findings.",
  glutathione:
    "Read redox biology through measured biomarkers and contrasting controlled trials. Study formulation, duration and population determine what can be inferred.",
};

export const OWNER_CATALOGUE_PRODUCTS: MarketplaceProduct[] =
  OWNER_CATALOGUE_ROWS.map(
    ([
      title,
      amountEur,
      familyId,
      quantityLabel,
      manufacturerLabel,
      formLabel,
    ]) => {
      const id = slugify(title);
      return {
        id,
        title,
        amountEur,
        quantityLabel,
        manufacturerLabel,
        formLabel,
        familyId,
        topic: RESEARCH_TOPICS[familyId],
        eyebrow: `${getFamilyName(familyId).toUpperCase()} · RESEARCH CATALOGUE`,
        description:
          FAMILY_DESCRIPTIONS[familyId] ??
          getResearchBrief(familyId)?.productCopy ??
          "Owner-listed research material; specifications require documentation.",
        priceLabel: `€${amountEur}`,
        kind: familyId === "glutathione" ? "molecule" : "peptide",
        status: "review",
        commerceApproved: false,
        points: 0,
        source: "prior-list",
        shopifyHandle: id,
        documentationStatus: "Batch COA, SDS and stock records not provided",
        image: getProductImage(id, familyId),
        featured: [
          "tirzepatida-25mg-5x5mg-zphc",
          "ghk-cu-100mg",
          "mots-c-40mg",
        ].includes(id),
        complianceNote:
          "Listed quantities describe the supplied pack, not administration instructions. Research materials are not offered for human or animal use. Exact identity, batch documents, verified research-buyer eligibility, seller/destination requirements and payment acceptance must be established before procurement; this catalogue does not approve a purchase. No purchase or referral points apply.",
      };
    }
  );

/** Keep existing legacy IDs for saved interests/history; they no longer lead the shop. */
const LEGACY_CONCEPTS: MarketplaceProduct[] = [
  {
    id: "field-notes-kit",
    title: "Field Notes Kit",
    eyebrow: "TOOLS · LAUNCH PLANNED",
    description:
      "An evidence journal, source cards and research templates. Production, stock and fulfilment are not yet confirmed.",
    priceLabel: "€48 · proposed",
    amountEur: 48,
    kind: "field-kit",
    status: "waitlist",
    complianceNote:
      "Educational tool concept. Not available to order. Joining records interest, not a reservation.",
    points: 0,
    shopifyHandle: "field-notes-kit",
    commerceApproved: false,
    source: "concept",
    billing: "one-time",
  },
  {
    id: "bioupgrade-signal-membership",
    title: "Signal Membership",
    eyebrow: "ACCESS · LAUNCH PLANNED",
    description:
      "A proposed monthly learning membership. Content schedule, delivery and cancellation terms need owner confirmation.",
    priceLabel: "€19 / month · proposed",
    amountEur: 19,
    kind: "membership",
    status: "waitlist",
    complianceNote:
      "Education and community, not medical advice. Billing remains disabled until launch approval.",
    points: 0,
    shopifyHandle: "signal-membership",
    commerceApproved: false,
    source: "concept",
    billing: "monthly",
  },
  {
    id: "peptide-research-drop-001",
    title: "Peptide Research Review",
    eyebrow: "RESEARCH · NO CHECKOUT",
    description:
      "Research procurement is a separate review process. Membership and points do not establish buyer eligibility.",
    priceLabel: "Not available to order",
    amountEur: 0,
    kind: "peptide",
    status: "gated",
    complianceNote:
      "No purchase or access approval is offered. Identity, intended use, seller permissions and destination requirements remain under review.",
    points: 0,
    shopifyHandle: "peptide-research-drop-001",
    commerceApproved: false,
    source: "concept",
  },
  {
    id: "molecule-signal-drop-001",
    title: "Molecule Research Review",
    eyebrow: "RESEARCH · NO CHECKOUT",
    description:
      "A review of proposed research materials, with source references kept separate from verified product documentation.",
    priceLabel: "Not available to order",
    amountEur: 0,
    kind: "molecule",
    status: "gated",
    complianceNote:
      "No treatment claims, purchase offer or guarantee of future availability.",
    points: 0,
    shopifyHandle: "molecule-signal-drop-001",
    commerceApproved: false,
    source: "concept",
  },
];

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  ...OWNER_CATALOGUE_PRODUCTS,
  ...SCREENSHOT_REFERENCE.map(
    (reference): MarketplaceProduct => ({
      id: reference.id,
      title: reference.title,
      quantityLabel: reference.quantityLabel,
      eyebrow: "ATTACHMENT SOURCE · ARCHIVE",
      description:
        reference.identityNote ??
        "Original attachment-source label and price, preserved separately from the current owner list. Batch identity, documentation and stock are not supplied.",
      priceLabel: `€${reference.referencePriceEur} · attachment reference`,
      amountEur: reference.referencePriceEur,
      kind: reference.kind,
      status: "review",
      commerceApproved: false,
      source: "supplier-image",
      complianceNote:
        "Archived source reference, not an order offer. Attachment prices remain separate from the newer owner list. No human-use claims, instructions, purchase points or referral rewards.",
      points: 0,
      shopifyHandle: reference.id,
      documentationStatus: "Not provided",
      image: getProductImage(reference.id),
    })
  ),
  ...LEGACY_CONCEPTS,
];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  available: "Available",
  waitlist: "Launch planned",
  gated: "Review only",
  review: "Documentation pending",
};
export function getMarketplaceProduct(productId: string) {
  return MARKETPLACE_PRODUCTS.find(product => product.id === productId);
}
export function isMarketplacePurchasable(product: MarketplaceProduct) {
  return (
    product.commerceApproved &&
    product.status === "available" &&
    product.amountEur > 0 &&
    (product.kind === "field-kit" || product.kind === "membership")
  );
}
