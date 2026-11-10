import { Link } from "wouter";
import Logo from "@/components/Logo";

/*
 * 404 — Isomorphic Labs-inspired mint canvas with forest type and signal-green actions.
 */
export default function NotFound() {
  return (
    <div className="grain relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <Logo />
      <p className="mono mt-10 text-[12px] tracking-[0.26em] text-accent">
        404 · OFF THE FRONTIER
      </p>
      <h1 className="mt-5 text-[clamp(2.5rem,8vw,5rem)] leading-[1] text-foreground">
        This page
        <br />
        ran out of meta.
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-foreground/65">
        The page you&apos;re looking for doesn&apos;t exist — it may have been moved,
        archived, or it was never peer-reviewed in the first place.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary px-6 py-3.5 text-[14px]">
          Back to home
        </Link>
        <Link href="/book" className="btn-ghost px-6 py-3.5 text-[14px]">
          Book a consultation →
        </Link>
      </div>
    </div>
  );
}
