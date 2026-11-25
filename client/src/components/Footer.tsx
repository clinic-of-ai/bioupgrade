import { Link } from "wouter";
import Logo from "./Logo";
import CommunityBridge from "./community/CommunityBridge";

const COLUMNS = [
  {
    title: "Research",
    links: [
      { label: "Academic rigor", href: "/research" },
      { label: "The Meta", href: "/meta" },
      { label: "Our community", href: "/community" },
    ],
  },
  {
    title: "Work with us",
    links: [
      { label: "Educational services", href: "/products" },
      { label: "Consultation", href: "/book" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Compound catalogue", href: "/shop" },
      { label: "Documentation", href: "/documentation" },
    ],
  },
  {
    title: "Your account",
    links: [
      { label: "Signal Points", href: "/account" },
      { label: "Orders & referrals", href: "/account" },
    ],
  },
];
export default function Footer() {
  return (
    <footer className="border-t border-accent/20 bg-background">
      <div className="container py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-xs md:col-span-1">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Read the papers. Run the meta. Source-led learning, research
              literacy and tools for better decisions.
            </p>
            <CommunityBridge compact />
          </div>
          {COLUMNS.map(column => (
            <div key={column.title}>
              <h4 className="mono mb-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center text-sm text-foreground hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bioupgrade
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            Education and research literacy, not medical advice. Signal Points
            have no cash value and do not change product eligibility.
          </p>
          <Link
            href="/book"
            className="mono inline-flex min-h-11 items-center text-xs text-accent hover:underline"
          >
            Book a consultation →
          </Link>
        </div>
      </div>
    </footer>
  );
}
