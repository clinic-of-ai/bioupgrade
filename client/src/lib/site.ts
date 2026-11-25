/**
 * BIOUPGRADE — shared site constants.
 * Image asset URLs are tied to the webdev project lifecycle (do not expire).
 */

export const ASSETS = {
  hero: "/images/hero-biopunk.webp",
  consultation: "/images/consultation-biopunk.webp",
  manifestoBg: "/images/manifesto-biopunk.webp",
  logoMark:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/logo-mark-4CamwMqXAZn3xB9uBMBwJF.webp",
  bookBg: "/images/book-biopunk.webp",
} as const;

/** Public Cal.com embed link — owner swaps this in. */
export const CAL_LINK =
  (import.meta.env?.VITE_CAL_LINK as string | undefined) ||
  "CAL_LINK_PLACEHOLDER";

export const SOURCES = [
  "Nature",
  "Cell",
  "bioRxiv",
  "Science",
  "PNAS",
  "arXiv",
] as const;

/**
 * Second marquee row: cell-biology / genomics names used as PLACEHOLDERS for a
 * future partner row. Replace only with confirmed partners (written permission).
 */
export const SOURCE_PLACEHOLDERS = [
  "eLife",
  "Nature Genetics",
  "Cell Metabolism",
  "Aging Cell",
  "Nucleic Acids Research",
  "PLOS Biology",
  "Genome Research",
  "EMBO Journal",
] as const;
