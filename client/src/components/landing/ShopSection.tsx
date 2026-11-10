import { ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { OWNER_CATALOGUE_PRODUCTS } from "@shared/marketplace";
import { getProductImage } from "@shared/product-images";
import { getResearchBrief } from "@shared/research";

export default function ShopSection() {
  const products = OWNER_CATALOGUE_PRODUCTS.filter(product => product.featured);
  return (
    <section
      id="shop"
      className="relative overflow-hidden border-t border-accent/20 bg-[#e3f3e5]"
    >
      <div className="container relative py-24 md:py-32">
        <Reveal>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mono text-[12px] tracking-[0.24em] text-accent">
                <span className="text-foreground/35">§05 / </span>THE BIOUPGRADE
                SHOP
              </p>
              <h2 className="mt-4 text-[clamp(2rem,5vw,3.6rem)] leading-[1.02]">
                A catalogue.
                <br />
                <span className="text-accent">With a reading layer.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                {OWNER_CATALOGUE_PRODUCTS.length} owner-listed variants, exact
                prices and primary-source context. Explore molecular signalling,
                matrix biology and mitochondrial research without confusing a
                published finding with verification of a supplied batch.
              </p>
            </div>
            <Link
              href="/shop"
              className="btn-primary inline-flex min-h-12 items-center gap-2 self-start px-5 text-sm md:self-auto"
            >
              Explore the catalogue <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {products.map((product, index) => {
            const image =
              product.image ?? getProductImage(product.id, product.familyId);
            const brief = getResearchBrief(product.familyId);
            return (
              <Reveal key={product.id} delay={index * 60}>
                <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-accent/25 bg-white/80">
                  <Link
                    href={`/shop/${product.id}`}
                    className="block bg-white/80 p-5"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={`aspect-[4/3] w-full ${image.type === "illustrative laboratory" ? "object-cover" : "object-contain"}`}
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="mono text-[10px] tracking-[0.16em] text-accent">
                      {product.topic}
                    </p>
                    <h3 className="mt-4 text-[23px] leading-tight">
                      <Link
                        href={`/shop/${product.id}`}
                        className="hover:text-accent"
                      >
                        {product.title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>
                    <p className="mono mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" />
                      {brief?.papers.length ?? 0} linked papers · documentation
                      pending
                    </p>
                    <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                      {image.caption}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-accent/15 pt-5">
                      <span className="mono text-base">
                        {product.priceLabel}
                      </span>
                      <Link
                        href={`/shop/${product.id}`}
                        className="inline-flex min-h-11 items-center gap-2 text-sm text-accent"
                      >
                        Details <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-7 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          For research only, not human or animal use. Source-listed price and
          packaging labels do not establish stock, batch identity or procurement
          eligibility. Research-material checkout remains disabled while
          documentation and the eligible buyer route are established.{" "}
          <Link href="/documentation" className="text-accent underline">
            Review the documentation standard.
          </Link>
        </p>
      </div>
    </section>
  );
}
