import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request } from "express";
import {
  OAUTH_STATE_COOKIE,
  ONE_YEAR_MS,
  decodeOAuthState,
  encodeOAuthState,
} from "../../shared/const";
import { getUserByOpenId, upsertUser } from "../db";
import {
  getOAuthStateCookieName,
  getSessionCookieOptions,
  LOCAL_OAUTH_STATE_COOKIE,
  setSessionCookies,
} from "./cookies";
import { ENV, isOAuthConfigured } from "./env";
import {
  hasTrustedMutationOrigin,
  isTrustedOrigin,
  normalizeOrigin,
} from "./origin";
import { sdk } from "./sdk";

const STATE_TTL_MS = 10 * 60 * 1000;
type PendingState = {
  redirectUri: string;
  origin: string;
  cookieName: string;
  expiresAt: number;
};

/** Single-process atomic consume: one callback can use a nonce, including when
 * replayed with an old Cookie header. For replicas, use an atomic shared TTL
 * store or sticky sessions; a different instance fails closed, never bypasses.
 */
export class OAuthStateStore {
  private states = new Map<string, PendingState>();
  private key(nonce: string) {
    return createHash("sha256").update(nonce).digest("hex");
  }
  issue(
    redirectUri: string,
    origin: string,
    cookieName: string,
    now = Date.now()
  ) {
    this.states.forEach((state, key) => {
      if (state.expiresAt <= now) this.states.delete(key);
    });
    if (this.states.size >= 10000)
      throw new Error("Too many pending sign-ins.");
    const nonce = randomBytes(32).toString("base64url");
    this.states.set(this.key(nonce), {
      redirectUri,
      origin,
      cookieName,
      expiresAt: now + STATE_TTL_MS,
    });
    return nonce;
  }
  consume(
    nonce: string,
    cookieNonce: string,
    redirectUri: string,
    now = Date.now()
  ): PendingState | null {
    if (nonce.length > 128 || cookieNonce.length > 128) return null;
    const a = Buffer.from(nonce);
    const b = Buffer.from(cookieNonce);
    if (!a.length || a.length !== b.length || !timingSafeEqual(a, b))
      return null;
    const key = this.key(nonce);
    const pending = this.states.get(key);
    if (!pending || pending.redirectUri !== redirectUri) return null;
    this.states.delete(key); // Consume synchronously, before token exchange awaits.
    return pending.expiresAt > now ? pending : null;
  }
}

function query(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(
  app: Express,
  states = new OAuthStateStore()
) {
  app.get("/api/oauth/config", (_req, res) => {
    res.set("Cache-Control", "no-store").json({
      configured: isOAuthConfigured(),
      message: isOAuthConfigured()
        ? null
        : "Sign-in is unavailable until Manus OAuth and the account database are configured.",
    });
  });

  app.post("/api/oauth/login", (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!isOAuthConfigured()) {
      res
        .status(503)
        .json({
          error:
            "Sign-in is unavailable. Manus OAuth and the account database must be configured.",
        });
      return;
    }
    const origin =
      typeof req.body?.origin === "string"
        ? normalizeOrigin(req.body.origin)
        : null;
    if (
      !origin ||
      !hasTrustedMutationOrigin(req) ||
      !isTrustedOrigin(req, origin) ||
      origin !==
        normalizeOrigin(
          typeof req.headers.origin === "string" ? req.headers.origin : ""
        )
    ) {
      res
        .status(403)
        .json({
          error: "Sign-in must start from a trusted application origin.",
        });
      return;
    }
    try {
      const redirectUri = `${origin}/api/oauth/callback`;
      const cookieName = getOAuthStateCookieName(req, origin);
      const nonce = states.issue(redirectUri, origin, cookieName);
      res.cookie(cookieName, nonce, {
        ...getSessionCookieOptions(req, origin),
        maxAge: STATE_TTL_MS,
      });
      const url = new URL(
        "app-auth",
        ENV.oAuthPortalUrl.replace(/\/+$/, "") + "/"
      );
      url.searchParams.set("appId", ENV.appId);
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("state", encodeOAuthState({ redirectUri, nonce }));
      url.searchParams.set("responseType", "code");
      url.searchParams.set("type", "signIn"); // Legacy portal compatibility.
      res.json({ authorizationUrl: url.toString() });
    } catch {
      console.warn("[OAuth] Login initiation failed");
      res
        .status(503)
        .json({
          error: "Sign-in is temporarily unavailable. Please try again later.",
        });
    }
  });

  app.get("/api/oauth/login", (_req, res) => {
    res
      .status(isOAuthConfigured() ? 405 : 503)
      .json({
        error: "Use the application's Sign in button to start secure sign-in.",
      });
  });

  app.get("/api/oauth/callback", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const code = query(req, "code");
    const state = query(req, "state");
    if (!code || !state || state.length > 4096 || code.length > 8192) {
      res
        .status(400)
        .json({ error: "A valid OAuth code and state are required." });
      return;
    }
    const decoded = decodeOAuthState(state);
    let cookies: Record<string, string | undefined> = {};
    try {
      cookies = parseCookieHeader(req.headers.cookie || "");
    } catch {
      /* Reject below. */
    }
    const expected =
      cookies[OAUTH_STATE_COOKIE] || cookies[LOCAL_OAUTH_STATE_COOKIE] || "";
    const pending =
      typeof decoded.nonce === "string"
        ? states.consume(decoded.nonce, expected, decoded.redirectUri)
        : null;
    if (!pending) {
      res
        .status(403)
        .json({
          error: "Invalid or expired OAuth state. Start sign-in again.",
        });
      return;
    }
    res.clearCookie(
      pending.cookieName,
      getSessionCookieOptions(req, pending.origin)
    );
    if (!isOAuthConfigured()) {
      res
        .status(503)
        .json({
          error:
            "Sign-in is unavailable. Authentication configuration is missing.",
        });
      return;
    }
    try {
      const token = await sdk.exchangeCodeForToken(code, state);
      const info = await sdk.getUserInfo(token.accessToken);
      await upsertUser({
        openId: info.openId,
        name: info.name || null,
        email: info.email ?? null,
        loginMethod: info.loginMethod ?? info.platform ?? null,
        lastSignedIn: new Date(),
      });
      // An upsert without a database used to silently succeed. Never mint an
      // application session until a real persisted user has been resolved.
      const user = await getUserByOpenId(info.openId);
      if (!user || user.openId !== info.openId)
        throw new Error("Account could not be persisted.");
      const session = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      setSessionCookies(req, res, session, ONE_YEAR_MS, pending.origin);
      res.redirect(302, "/account");
    } catch {
      // Axios errors may contain request tokens/codes: log only a safe message.
      console.warn("[OAuth] Callback exchange or account persistence failed");
      res
        .status(503)
        .json({
          error:
            "Sign-in could not complete. The identity or account service is unavailable; please start sign-in again.",
        });
    }
  });
}
