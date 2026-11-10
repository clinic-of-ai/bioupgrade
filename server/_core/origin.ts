import type { Request } from "express";
import { ENV } from "./env";

export function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function configuredOrigins(): string[] {
  return [ENV.appOrigin, ...(process.env.TRUSTED_ORIGINS || "").split(",")]
    .map(value => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));
}

/** Explicit origins win. Without a deployment URL, accept only the browser's
 * exact current Host, never a wildcard Manus domain or an untrusted forwarded Host.
 * A reverse proxy that changes Host must configure APP_ORIGIN/TRUSTED_ORIGINS.
 */
export function isTrustedOrigin(req: Request, value: string): boolean {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  const allowed = configuredOrigins();
  if (ENV.appOrigin || process.env.TRUSTED_ORIGINS)
    return allowed.includes(origin);
  const host = req.headers.host;
  if (typeof host !== "string" || /[\s,\\/@]/.test(host)) return false;
  const url = new URL(origin);
  if (url.host.toLowerCase() !== host.toLowerCase()) return false;
  // The public preview may be HTTPS even if req.protocol is HTTP internally.
  return (
    url.protocol === "https:" ||
    (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      req.protocol === "http")
  );
}

export function hasTrustedMutationOrigin(req: Request): boolean {
  // Server-side createCaller has no HTTP request. Every real Express request has
  // a method; do not let a missing Origin on an HTTP mutation bypass CSRF checks.
  if (!req.method) return true;
  const origin = req.headers.origin;
  return (
    typeof origin === "string" &&
    isTrustedOrigin(req, origin) &&
    req.headers["sec-fetch-site"] !== "cross-site"
  );
}
