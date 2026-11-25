import { ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import Reveal from "@/components/Reveal";
import { PRODUCTS } from "@shared/products";

export default function Products() {
  return (
    <section
      id="products"
      className="relative border-t border-accent/20 bg-white/45"
    >
      <div className="container py-24 md:py-32">
        <Reveal>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mono text-[12px] tracking-[0.24em] text-accent">
                <span className="text-foreground/35">§04 / </span>THE PROTOCOLS
              </p>
              <h2 className="mt-4 text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] text-foreground">
                From the frontier.
                <br />
                <span className="text-accent">Built around you.</span>
              </h2>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-foreground/65">
                Four levels of depth, from a focused strategy session to a fully
                customised concierge protocol. You bring the goal; we bring the
                literature, our own protocol work and a team that has spent years
                at the edge of the field.
              </p>
            </div>
            <Link
              href="/products"
              className="btn-ghost inline-flex items-center gap-2 self-start px-5 py-3 text-[13px] md:self-auto"
            >
              View the full offer <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {PRODUCTS.map((product, index) => (
            <Reveal key={product.id} delay={index * 55}>
              <article
                className={`group h-full rounded-[18px] border p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 md:p-8 ${product.featured ? "border-accent/45 bg-[#e7f7e9]" : "border-accent/20 bg-background/80"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="mono text-[11px] tracking-[0.2em] text-accent">
                    {product.eyebrow}
                  </p>
                  {product.featured ? (
                    <span className="mono rounded-full bg-accent px-3 py-1 text-[10px] tracking-[0.14em] text-white">
                      START HERE
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-5 text-[24px] leading-tight text-foreground">
                  {product.title}
                </h3>
                <p className="mt-4 min-h-[72px] text-[15px] leading-relaxed text-foreground/65">
                  {product.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                  {product.deliverables.map(item => (
                    <span
                      key={item}
                      className="flex items-center gap-1.5 text-[12px] text-foreground/65"
                    >
                      <Check className="h-3.5 w-3.5 text-accent" /> {item}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-accent/15 pt-5">
                  <span className="mono text-[15px] text-foreground">
                    {product.priceLabel}
                  </span>
                  <Link
                    href={`/products?product=${product.id}`}
                    className="inline-flex items-center gap-2 text-[13px] font-medium text-accent transition-colors hover:text-foreground"
                  >
                    Explore{" "}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={160}>
          <div className="mt-8 flex flex-col gap-3 rounded-[14px] border border-accent/15 bg-[#f4fbf4] px-5 py-4 text-[13px] text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-accent" /> Shopify is the
              selected commerce route; store availability and service scope must
              be confirmed before checkout. Scoped educational projects require
              an agreed quote; no crypto checkout is connected.
            </span>
            <span className="mono text-[10px] tracking-[0.14em] text-foreground/40">
              NO MEDICAL ADVICE · HUMAN REVIEW
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
