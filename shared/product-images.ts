import resolvedImages from "./product-image-data.json";

export type ProductImage = {
  src: string;
  alt: string;
  caption: string;
  sourceUrl: string;
  credit: string;
  type:
    | "reference packaging"
    | "molecular structure"
    | "illustrative laboratory";
};
export const PRODUCT_IMAGES = resolvedImages as Record<string, ProductImage>;
export const LAB_IMAGE: ProductImage = {
  src: "/images/research/lab-glassware.webp",
  alt: "Laboratory beaker, glass dropper and petri dish on a wooden work surface.",
  caption:
    "Illustrative laboratory image · not a photograph of the supplied product.",
  sourceUrl:
    "https://www.pexels.com/photo/dropper-on-a-beaker-with-water-8392541/",
  credit: "Anna Tarazevich / Pexels",
  type: "illustrative laboratory",
};
export function getProductImage(
  productId: string,
  familyId?: string
): ProductImage {
  return (
    PRODUCT_IMAGES[productId] ??
    (familyId ? PRODUCT_IMAGES[familyId] : undefined) ??
    LAB_IMAGE
  );
}
