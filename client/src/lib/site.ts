/**
 * BIOUPGRADE — shared site constants.
 * Image asset URLs are tied to the webdev project lifecycle (do not expire).
 */

export const ASSETS = {
  hero: "/manus-storage/planhat-reference-hero_ee4ad5e3.webp",
  pillarTexture:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-pillar1-5sbsv5eX3zocfGyt6pxFSc.webp",
  consultation:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-consultation-CQpduFKjskFahwRqeKkSfm.webp",
  manifestoBg:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-pillar3-fu8d9H4SuLqHag3xXZvNw5.webp",
  logoMark:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/logo-mark-4CamwMqXAZn3xB9uBMBwJF.webp",
  pillarLab:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-pillar2-NfNCnJVESNsYFreCGgonfL.webp",
  pillarCircle:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-pillar3-fu8d9H4SuLqHag3xXZvNw5.webp",
  pillarLab2:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-pillar2-NfNCnJVESNsYFreCGgonfL.webp",
  bookBg:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663336574339/MvkxXqJeF9zYM94Gg4dNXa/planhat-consultation-CQpduFKjskFahwRqeKkSfm.webp",
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
