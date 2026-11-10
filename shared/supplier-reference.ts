export type SupplierReference = {
  id: string;
  title: string;
  quantityLabel: string;
  referencePriceEur: number;
  kind: "peptide" | "molecule" | "accessory";
  identityNote?: string;
};

/** Supplier reference only. Not stock, an approved retail offer, or administration instructions. */
export const SCREENSHOT_REFERENCE: SupplierReference[] = [
  {
    id: "image-tirzepatide-20",
    title: "TIRZEPATIDE",
    quantityLabel: "20 mg",
    referencePriceEur: 85,
    kind: "peptide",
  },
  {
    id: "image-tirzepatide-30",
    title: "TIRZEPATIDE",
    quantityLabel: "30 mg",
    referencePriceEur: 100,
    kind: "peptide",
  },
  {
    id: "image-tirzepatide-60",
    title: "TIRZEPATIDE",
    quantityLabel: "60 mg",
    referencePriceEur: 150,
    kind: "peptide",
  },
  {
    id: "image-retatrutide-10",
    title: "RETATRUTIDE",
    quantityLabel: "10 mg",
    referencePriceEur: 60,
    kind: "peptide",
  },
  {
    id: "image-retatrutide-20",
    title: "RETATRUTIDE",
    quantityLabel: "20 mg",
    referencePriceEur: 85,
    kind: "peptide",
  },
  {
    id: "image-retatrutide-30",
    title: "RETATRUTIDE",
    quantityLabel: "30 mg",
    referencePriceEur: 120,
    kind: "peptide",
  },
  {
    id: "image-retatrutide-40",
    title: "RETATRUTIDE",
    quantityLabel: "40 mg",
    referencePriceEur: 145,
    kind: "peptide",
  },
  {
    id: "image-retatrutide-100",
    title: "RETATRUTIDE",
    quantityLabel: "100 mg",
    referencePriceEur: 220,
    kind: "peptide",
  },
  {
    id: "image-cagrilutide-5",
    title: "CAGRILUTIDE",
    quantityLabel: "5 mg",
    referencePriceEur: 65,
    kind: "peptide",
  },
  {
    id: "image-klow-80",
    title: "KLOW",
    quantityLabel: "80 mg",
    referencePriceEur: 70,
    kind: "peptide",
    identityNote:
      "Composition and individual component quantities are not supplied.",
  },
  {
    id: "image-nad-500",
    title: "NAD+",
    quantityLabel: "500 mg",
    referencePriceEur: 60,
    kind: "molecule",
  },
  {
    id: "image-5-amino-50",
    title: "5 AMINO",
    quantityLabel: "50 mg",
    referencePriceEur: 50,
    kind: "molecule",
    identityNote: "Exact chemical identity is not specified by this label.",
  },
  {
    id: "image-kpv-10",
    title: "KPV",
    quantityLabel: "10 mg",
    referencePriceEur: 35,
    kind: "peptide",
  },
  {
    id: "image-mt1",
    title: "MT-1 (MELANOTAN 1)",
    quantityLabel: "Not supplied",
    referencePriceEur: 35,
    kind: "peptide",
  },
  {
    id: "image-ghk-cu-50",
    title: "GHK-CU",
    quantityLabel: "50 mg",
    referencePriceEur: 28,
    kind: "peptide",
  },
  {
    id: "image-ghk-cu-100",
    title: "GHK-CU",
    quantityLabel: "100 mg",
    referencePriceEur: 45,
    kind: "peptide",
  },
  {
    id: "image-selank-10",
    title: "SELANK",
    quantityLabel: "10 mg",
    referencePriceEur: 50,
    kind: "peptide",
  },
  {
    id: "image-semak-10",
    title: "SEMAK",
    quantityLabel: "10 mg",
    referencePriceEur: 50,
    kind: "peptide",
    identityNote:
      "Ambiguous source label preserved as supplied; do not assume a different compound.",
  },
  {
    id: "image-aod-10",
    title: "AOD",
    quantityLabel: "10 mg",
    referencePriceEur: 65,
    kind: "peptide",
    identityNote: "Exact sequence or identity is not supplied.",
  },
  {
    id: "image-lemon-bottle",
    title: "LEMON BOTTLE",
    quantityLabel: "Not supplied",
    referencePriceEur: 35,
    kind: "molecule",
    identityNote: "Composition and product classification need verification.",
  },
  {
    id: "image-cjc-ipa",
    title: "CJC - IPA",
    quantityLabel: "5/5 mg",
    referencePriceEur: 60,
    kind: "peptide",
    identityNote: "Exact component identities require verification.",
  },
  {
    id: "image-bacteriostatic-water-3",
    title: "ÁGUA BACTERIOSTÁTICA",
    quantityLabel: "3 ml",
    referencePriceEur: 10,
    kind: "accessory",
  },
  {
    id: "image-bacteriostatic-water-10",
    title: "ÁGUA BACTERIOSTÁTICA",
    quantityLabel: "10 ml",
    referencePriceEur: 20,
    kind: "accessory",
  },
];

export const SUPPLIER_SHIPPING_REFERENCE = [
  { label: "PORTAGEM EUROPA", referencePriceEur: 15 },
  { label: "PORTAGEM PAÍSES BAIXOS", referencePriceEur: 10 },
] as const;
