import { useEffect, useState } from "react";
import { Link } from "wouter";
import Logo from "./Logo";

/*
 * Nav — Isomorphic Labs-inspired light mint header with forest text and green CTA.
 * A translucent surface keeps the cinematic image visible while preserving contrast.
 * `slim` variant (used on /book) drops the section links.
 */
export default function Nav({ slim = false }: { slim?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Consultations", href: "/products" },
    { label: "Research", href: "/research" },
    { label: "Lab", href: "/shop" },
    { label: "Community", href: "/community" },
    { label: "The Meta", href: "/meta" },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300"
      style={{
        backgroundColor: scrolled
          ? "rgba(239,248,240,0.98)"
          : "rgba(239,248,240,0.94)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled
          ? "1px solid rgba(63,153,95,0.22)"
          : "1px solid rgba(63,153,95,0.12)",
      }}
    >
      <nav className="container flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {!slim && (
          <div className="hidden items-center gap-5 lg:flex xl:gap-8">
            {links.map(l => (
              <a key={l.label} href={l.href} className="nav-link mono">
                {l.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {slim ? (
            <Link href="/" className="nav-link mono hidden sm:inline">
              ← Back to home
            </Link>
          ) : null}
          <Link
            href="/cart"
            className="nav-link mono inline-flex min-h-11 items-center px-2 text-[12px]"
          >
            Cart
          </Link>
          <Link
            href="/account"
            className="nav-link mono inline-flex min-h-11 items-center px-2 text-[12px]"
          >
            My account
          </Link>
          <Link
            href="/book"
            className="btn-primary hidden px-4 py-2 text-[13px] sm:inline-block"
          >
            Book a call
          </Link>

          {!slim && (
            <button
              aria-label="Menu"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(v => !v)}
              className="btn-ghost flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className="absolute left-0 h-px w-4 bg-foreground transition-transform duration-200"
                  style={{
                    top: open ? "5px" : "0px",
                    transform: open ? "rotate(45deg)" : "none",
                  }}
                />
                <span
                  className="absolute left-0 top-[5px] h-px w-4 bg-foreground transition-opacity duration-200"
                  style={{ opacity: open ? 0 : 1 }}
                />
                <span
                  className="absolute left-0 h-px w-4 bg-foreground transition-transform duration-200"
                  style={{
                    bottom: open ? "5px" : "0px",
                    transform: open ? "rotate(-45deg)" : "none",
                  }}
                />
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown */}
      {!slim && open && (
        <div
          id="mobile-navigation"
          className="border-t border-accent/20 bg-white/95 backdrop-blur-xl lg:hidden"
        >
          <div className="container flex flex-col gap-1 py-4">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="nav-link mono py-2.5 text-[15px]"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 px-4 py-2.5 text-center text-[13px]"
            >
              Book a call
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
