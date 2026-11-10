import type { CookieOptions, Request, Response } from "express";
import { COOKIE_NAME, OAUTH_STATE_COOKIE } from "../../shared/const";
import { ENV } from "./env";

export const APP_SESSION_COOKIE = "webdev_app_session";
export const LOCAL_OAUTH_STATE_COOKIE = "webdev_oauth_state";

const isLoopback = (host: string) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(host);

/** Public HTTPS may arrive at Express as HTTP; default to iframe-safe cookies.
 * Plain HTTP is supported only for an explicitly identifiable loopback browser.
 */
export function getSessionCookieOptions(
  req: Request,
  publicOrigin?: string
): CookieOptions {
  let localHttp = false;
  try {
    const origin =
      publicOrigin ||
      ENV.appOrigin ||
      (typeof req.headers.origin === "string" ? req.headers.origin : "");
    const forwarded = req.headers["x-forwarded-proto"];
    const forwardedHttps = (
      Array.isArray(forwarded) ? forwarded.join(",") : forwarded || ""
    )
      .split(",")
      .some(value => value.trim().toLowerCase() === "https");
    if (origin) {
      const url = new URL(origin);
      localHttp =
        url.protocol === "http:" && isLoopback(url.hostname) && !forwardedHttps;
    } else if (req.headers.host && req.protocol === "http" && !forwardedHttps) {
      localHttp = isLoopback(new URL(`http://${req.headers.host}`).hostname);
    }
  } catch {
    /* Invalid origin never weakens secure defaults. */
  }
  return {
    httpOnly: true,
    path: "/",
    sameSite: localHttp ? "lax" : "none",
    secure: !localHttp,
  };
}

export function getOAuthStateCookieName(req: Request, publicOrigin?: string) {
  return getSessionCookieOptions(req, publicOrigin).secure
    ? OAUTH_STATE_COOKIE
    : LOCAL_OAUTH_STATE_COOKIE;
}

export function setSessionCookies(
  req: Request,
  res: Response,
  token: string,
  maxAge: number,
  publicOrigin?: string
) {
  const options = { ...getSessionCookieOptions(req, publicOrigin), maxAge };
  res.cookie(APP_SESSION_COOKIE, token, options);
  // Adopted legacy code and its gateway already use this project-signed cookie.
  res.cookie(COOKIE_NAME, token, options);
}

export function clearSessionCookies(req: Request, res: Response) {
  const options = getSessionCookieOptions(req);
  res.clearCookie(APP_SESSION_COOKIE, options);
  res.clearCookie(COOKIE_NAME, options);
}
