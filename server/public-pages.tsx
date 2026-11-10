import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link, Router } from "wouter";
import Home from "../client/src/pages/Home";
import Research from "../client/src/pages/Research";
import Meta from "../client/src/pages/Meta";
import Community from "../client/src/pages/Community";
import Documentation from "../client/src/pages/Documentation";
import ProductDetail from "../client/src/pages/ProductDetail";
import Nav from "../client/src/components/Nav";
import Footer from "../client/src/components/Footer";
import { OWNER_CATALOGUE_PRODUCTS } from "../shared/marketplace";
import { PRODUCTS } from "../shared/products";
import { getConsultingProfile } from "../shared/consulting";
import { getProductImage } from "../shared/product-images";
import { getResearchPapers } from "../shared/research";
import {
  getPublicPageMetadata,
  PUBLIC_PAGE_PATHS,
} from "../shared/public-page-metadata";
export {
  getPublicPageMetadata,
  PUBLIC_PAGE_PATHS,
} from "../shared/public-page-metadata";

export function configuredPublicOrigin(): string | null {
  const value = process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!
  );

function PublicCatalogue() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container pb-24 pt-32">
        <p className="mono text-xs text-accent">THE BIOUPGRADE SHOP</p>
        <h1 className="mt-5 text-5xl">
          The molecular frontier.
          <br />
          Read it precisely.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Explore {OWNER_CATALOGUE_PRODUCTS.length} owner-listed research
          variants, exact EUR prices and source-linked papers. Research
          materials are not for human or animal use. Stock, batch documentation
          and the eligible procurement route are not established by these
          labels.
        </p>
        <Link
          href="/research"
          className="btn-primary mt-7 inline-flex min-h-12 items-center px-5"
        >
          Read the paper library
        </Link>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OWNER_CATALOGUE_PRODUCTS.map(product => {
            const image = getProductImage(product.id, product.familyId);
            return (
              <article
                key={product.id}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="aspect-[4/3] w-full object-contain"
                  loading="lazy"
                />
                <p className="mono mt-4 text-xs text-accent">{product.topic}</p>
                <h2 className="mt-3 text-2xl">
                  <Link href={`/shop/${product.id}`}>{product.title}</Link>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
                <p className="mono mt-5 text-xl">{product.priceLabel}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {image.caption}
                </p>
                <Link
                  href={`/shop/${product.id}`}
                  className="mt-4 inline-flex min-h-11 items-center text-sm text-accent"
                >
                  Specifications and papers →
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Interactive filtering and account-linked interest capture are
          available when the application loads. No research-material checkout is
          available.
        </p>
        <Link
          href="/documentation"
          className="mt-3 inline-flex min-h-11 items-center text-accent"
        >
          Documentation standard →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
function PublicServices({
  booking = false,
  selectedProductId,
}: {
  booking?: boolean;
  selectedProductId?: string;
}) {
  const selected =
    PRODUCTS.find(product => product.id === selectedProductId) ?? PRODUCTS[0];
  const offers = booking ? [selected] : PRODUCTS;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container pb-24 pt-32">
        <p className="mono text-xs text-accent">
          EDUCATIONAL RESEARCH SERVICES
        </p>
        <h1 className="mt-5 text-5xl">
          {booking ? selected.title : "Move from signal to decision."}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Source evaluation, methods, evidence limits and human-reviewed
          workflows—not diagnosis, prescribing or a compound-use protocol.
          Scheduling is separate from account-linked payment.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {offers.map(product => (
            <article
              key={product.id}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <p className="mono text-xs text-accent">{product.eyebrow}</p>
              <h2 className="mt-4 text-3xl">{product.title}</h2>
              <p className="mt-4 text-base text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {getConsultingProfile(product.id)?.bestFor}
              </p>
              <p className="mono mt-6 text-xs text-accent">
                PROPOSED WRITTEN OUTPUTS · SCOPE AGREED BEFORE COMMITMENT
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm">
                {getConsultingProfile(product.id)
                  ?.outcomes.slice(0, 3)
                  .map(item => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
              <ul className="mt-5 list-inside list-disc text-sm">
                {product.deliverables.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mono mt-5 text-xl">{product.priceLabel}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {product.checkoutEnabled
                  ? "Review the selected checkout route and confirm the educational scope before payment; it does not reserve a calendar slot."
                  : "Define the scope and agree a final quote before payment."}
              </p>
              <Link
                href={
                  booking
                    ? `/products?product=${product.id}`
                    : `/book?product=${product.id}`
                }
                className="mt-4 inline-flex min-h-11 items-center text-accent"
              >
                {booking
                  ? "Review the full offer →"
                  : "Confirm fit and scope →"}
              </Link>
            </article>
          ))}
        </div>
        <Link
          href="/research"
          className="mt-8 inline-flex min-h-11 items-center text-accent"
        >
          Start with the research library →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
function NotFoundPublic() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container min-h-[70vh] pb-24 pt-40">
        <h1 className="text-5xl">This page is not in the record.</h1>
        <p className="mt-6 text-muted-foreground">
          No product, price or availability is inferred from an unknown address.
        </p>
        <Link
          href="/shop"
          className="btn-primary mt-8 inline-flex min-h-12 items-center px-5"
        >
          Back to the catalogue
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export function renderPublicBody(path: string, search = ""): string {
  let body: ReactNode;
  if (path === "/account") return ""; // Never SSR any authenticated account state.
  if (path === "/cart")
    return '<main class="container min-h-screen pt-36"><h1>Your Shopify cart</h1><p>Cart contents are loaded privately in your browser. A cart is not proof of payment or Signal Points.</p><a href="/shop">Return to the catalogue</a></main>';
  if (path === "/") body = <Home />;
  else if (path === "/research") body = <Research />;
  else if (path === "/meta") body = <Meta />;
  else if (path === "/community") body = <Community />;
  else if (path === "/documentation") body = <Documentation />;
  else if (path === "/shop") body = <PublicCatalogue />;
  else if (path === "/products" || path === "/book")
    body = (
      <PublicServices
        booking={path === "/book"}
        selectedProductId={
          new URLSearchParams(search).get("product") ?? undefined
        }
      />
    );
  else if (path.startsWith("/shop/"))
    body = <ProductDetail productId={path.slice("/shop/".length)} />;
  else body = <NotFoundPublic />;
  return renderToStaticMarkup(
    createElement(Router, {
      ssrPath: path,
      ssrSearch: search.replace(/^\?/, ""),
      children: body,
    })
  );
}

export function renderPublicDocument(template: string, originalUrl: string) {
  const parsed = new URL(originalUrl, "http://local.invalid");
  const path = parsed.pathname;
  const metadata = getPublicPageMetadata(path);
  const origin = configuredPublicOrigin();
  const image = metadata.image.startsWith("https://")
    ? metadata.image
    : origin
      ? new URL(metadata.image, origin).href
      : null;
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${metadata.indexable ? "index,follow" : "noindex,follow"}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Bioupgrade" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ];
  if (origin && metadata.status === 200) {
    const canonical = escapeHtml(new URL(path, origin).href);
    tags.push(
      `<link rel="canonical" href="${canonical}" />`,
      `<meta property="og:url" content="${canonical}" />`
    );
  }
  if (origin)
    tags.push(
      `<meta name="bioupgrade:public-origin" content="${escapeHtml(origin)}" />`
    );
  if (image)
    tags.push(
      `<meta property="og:image" content="${escapeHtml(image)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(image)}" />`
    );
  const stripped = template
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(
      /<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*\/?\s*>/gi,
      ""
    )
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
  const html = stripped
    .replace("</head>", `${tags.join("\n")}\n</head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${renderPublicBody(path, parsed.search)}</div>`
    );
  return {
    html,
    status: metadata.status,
    indexable: metadata.indexable,
    paperCount: getResearchPapers().length,
  };
}

export function publicSitemap(origin = configuredPublicOrigin()) {
  if (!origin) return null;
  const paths = [
    ...PUBLIC_PAGE_PATHS,
    ...OWNER_CATALOGUE_PRODUCTS.map(product => `/shop/${product.id}`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeHtml(new URL(path, origin).href)}</loc></url>`).join("")}</urlset>`;
}
export function publicRobots(origin = configuredPublicOrigin()) {
  return origin
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /account\nDisallow: /cart\nDisallow: /manus-storage/\nSitemap: ${origin}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
}
