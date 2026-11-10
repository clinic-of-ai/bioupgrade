import { useEffect } from "react";
import { useLocation } from "wouter";
import { getPublicPageMetadata } from "@shared/public-page-metadata";

function setMeta(
  attribute: "name" | "property",
  key: string,
  value: string | null
) {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (value === null) {
    existing?.remove();
    return;
  }
  const meta = existing ?? document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.content = value;
  if (!existing) document.head.appendChild(meta);
}

export default function RouteMetadata() {
  const [location] = useLocation();
  useEffect(() => {
    const metadata = getPublicPageMetadata(location);
    document.title = metadata.title;
    setMeta("name", "description", metadata.description);
    setMeta(
      "name",
      "robots",
      metadata.indexable ? "index,follow" : "noindex,follow"
    );
    setMeta("property", "og:title", metadata.title);
    setMeta("property", "og:description", metadata.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "Bioupgrade");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", metadata.title);
    setMeta("name", "twitter:description", metadata.description);
    const configuredOrigin = document.head.querySelector<HTMLMetaElement>(
      'meta[name="bioupgrade:public-origin"]'
    )?.content;
    let origin: string | null = null;
    try {
      if (configuredOrigin) {
        const url = new URL(configuredOrigin);
        if (
          url.protocol === "https:" &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash &&
          !url.username &&
          !url.password
        )
          origin = url.origin;
      }
    } catch {
      /* No guessed/internal canonical is created. */
    }
    const existing = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (origin && metadata.status === 200) {
      const canonical = existing ?? document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = new URL(metadata.path, origin).href;
      if (!existing) document.head.appendChild(canonical);
      setMeta("property", "og:url", canonical.href);
    } else {
      existing?.remove();
      setMeta("property", "og:url", null);
    }
    const image = metadata.image.startsWith("https://")
      ? metadata.image
      : origin
        ? new URL(metadata.image, origin).href
        : null;
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:image", image);
  }, [location]);
  return null;
}
