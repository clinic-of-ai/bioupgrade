import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express, { raw, type Express, type Request } from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SignJWT } from "jose";
import {
  COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  decodeOAuthState,
  encodeOAuthState,
} from "../shared/const";
import { SDKServer, sdk, ServiceUnavailableError } from "./_core/sdk";
import { createContext } from "./_core/context";
import {
  APP_SESSION_COOKIE,
  getSessionCookieOptions,
  LOCAL_OAUTH_STATE_COOKIE,
} from "./_core/cookies";
import { ENV } from "./_core/env";
import { hasTrustedMutationOrigin, isTrustedOrigin } from "./_core/origin";
import { OAuthStateStore, registerOAuthRoutes } from "./_core/oauth";
import { isSafeStorageKey, registerStorageProxy } from "./_core/storageProxy";
import { serveStatic } from "./_core/vite";
import { configuredPort, createApp, startServer } from "./_core/index";
import { getUserByOpenId, upsertUser } from "./db";
import { toast } from "sonner";
import { startLogin } from "../client/src/const";

vi.mock("./db", () => ({ getUserByOpenId: vi.fn(), upsertUser: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
// Isolate runtime ordering from concurrently repaired commerce routers. These
// procedures use the real core middleware/context and never touch a live DB.
vi.mock("./routers", async () => {
  const { router, publicProcedure, protectedProcedure } = await import(
    "./_core/trpc"
  );
  const { getSessionCookieOptions } = await import("./_core/cookies");
  return {
    appRouter: router({
      auth: router({
        me: publicProcedure.query(({ ctx }) => ctx.user),
        logout: publicProcedure.mutation(({ ctx }) => {
          ctx.res.clearCookie(
            "app_session_id",
            getSessionCookieOptions(ctx.req)
          );
          return { success: true };
        }),
      }),
      account: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id })),
    }),
  };
});
vi.mock("./stripe", () => ({
  registerStripeWebhook: (app: Express) => {
    app.post(
      "/api/stripe/webhook",
      raw({ type: "application/json" }),
      (req, res) => {
        res.json({
          raw: Buffer.isBuffer(req.body),
          text: Buffer.isBuffer(req.body) ? req.body.toString() : "parsed",
        });
      }
    );
  },
}));

const origin = "https://app.example.test";
const testSecret = "isolated-test-signing-key-never-used-in-production";
const fixtureUser = {
  id: 4,
  openId: "real-openid",
  name: "Real Member",
  email: "member@example.test",
  loginMethod: "google",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};
const servers: Server[] = [];
const temporaryDirectories: string[] = [];
const request = (headers: Record<string, string> = {}, protocol = "http") =>
  ({
    method: "POST",
    protocol,
    headers: { host: "app.example.test", ...headers },
  }) as Request;

async function listen(app: Express) {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
function configureAuth() {
  vi.stubEnv("MANUS_PROJECT_ID", "project-under-test");
  vi.stubEnv("MANUS_JWT_SECRET", testSecret);
  vi.stubEnv("MANUS_OAUTH_API_URL", "https://oauth-api.example.test");
  vi.stubEnv("MANUS_OAUTH_PORTAL_URL", "https://oauth.example.test");
  vi.stubEnv("DATABASE_URL", "mysql://isolated-mocked-database");
  vi.stubEnv("APP_ORIGIN", origin);
}
async function signed(
  claims: Record<string, unknown> = {},
  options: {
    expired?: boolean;
    noExpiry?: boolean;
    algorithm?: string;
    secret?: string;
  } = {}
) {
  let jwt = new SignJWT({
    openId: "real-openid",
    appId: "project-under-test",
    name: "Real Member",
    ...claims,
  }).setProtectedHeader({ alg: options.algorithm || "HS256" });
  if (!options.noExpiry)
    jwt = jwt.setExpirationTime(
      Math.floor(Date.now() / 1000) + (options.expired ? -60 : 600)
    );
  return jwt.sign(new TextEncoder().encode(options.secret || testSecret));
}
async function begin(base: string) {
  const response = await fetch(`${base}/api/oauth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ origin }),
  });
  const data = (await response.json()) as { authorizationUrl: string };
  const url = new URL(data.authorizationUrl);
  const state = url.searchParams.get("state")!;
  const cookie = response.headers.getSetCookie()[0].split(";")[0];
  return { response, url, state, cookie };
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of [
    "MANUS_PROJECT_ID",
    "VITE_APP_ID",
    "MANUS_JWT_SECRET",
    "JWT_SECRET",
    "MANUS_OAUTH_API_URL",
    "OAUTH_SERVER_URL",
    "MANUS_OAUTH_PORTAL_URL",
    "VITE_OAUTH_PORTAL_URL",
    "DATABASE_URL",
    "MANUS_API_URL",
    "MANUS_API_KEY",
    "BUILT_IN_FORGE_API_URL",
    "BUILT_IN_FORGE_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "APP_ORIGIN",
    "PUBLIC_APP_URL",
    "TRUSTED_ORIGINS",
    "PORT",
  ])
    vi.stubEnv(key, "");
  vi.mocked(getUserByOpenId).mockResolvedValue(fixtureUser);
  vi.mocked(upsertUser).mockResolvedValue(undefined);
});
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  for (const dir of temporaryDirectories.splice(0))
    await rm(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("project session verification", () => {
  it("validates HS256 expiry and current project identity", async () => {
    configureAuth();
    expect(await sdk.verifySession(await signed())).toEqual({
      openId: "real-openid",
      appId: "project-under-test",
      name: "Real Member",
    });
  });
  it.each([
    ["different appId", { appId: "another-project" }, {}],
    ["expired JWT", {}, { expired: true }],
    ["missing expiry", {}, { noExpiry: true }],
    ["empty openId", { openId: "" }, {}],
    ["different algorithm", {}, { algorithm: "HS384" }],
    ["invalid signature", {}, { secret: "a-different-isolated-test-key" }],
  ])("rejects %s", async (_name, claims, options) => {
    configureAuth();
    expect(await sdk.verifySession(await signed(claims, options))).toBeNull();
    expect(getUserByOpenId).not.toHaveBeenCalled();
  });
  it("accepts a real identity without inventing a required display name", async () => {
    configureAuth();
    expect(await sdk.verifySession(await signed({ name: "" }))).toMatchObject({
      openId: "real-openid",
      name: "",
    });
  });
  it("fails closed when project/signing config is absent", async () => {
    expect(await sdk.verifySession("arbitrary-token")).toBeNull();
    await expect(sdk.createSessionToken("real-openid")).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });
  it("retains legacy env aliases, with canonical names taking priority", async () => {
    vi.stubEnv("VITE_APP_ID", "project-under-test");
    vi.stubEnv("JWT_SECRET", testSecret);
    expect(await sdk.verifySession(await signed())).not.toBeNull();
    vi.stubEnv("MANUS_PROJECT_ID", "canonical-project");
    expect(ENV.appId).toBe("canonical-project");
    expect(await sdk.verifySession(await signed())).toBeNull();
  });
  it.each([APP_SESSION_COOKIE, COOKIE_NAME])(
    "resolves %s to a persisted DB user",
    async cookieName => {
      configureAuth();
      const token = await signed();
      expect(
        await sdk.authenticateRequest(
          request({ cookie: `${cookieName}=${token}` })
        )
      ).toEqual(fixtureUser);
      expect(getUserByOpenId).toHaveBeenCalledWith("real-openid");
    }
  );
  it("accepts verified bearer fallback, but does not rescue an invalid cookie", async () => {
    configureAuth();
    const token = await signed();
    expect(
      await sdk.authenticateRequest(
        request({ authorization: `Bearer ${token}` })
      )
    ).toEqual(fixtureUser);
    await expect(
      sdk.authenticateRequest(
        request({
          cookie: `${APP_SESSION_COOKIE}=invalid`,
          authorization: `Bearer ${token}`,
        })
      )
    ).rejects.toThrow("Invalid session");
  });
  it("never grants user claims/roles when the DB is absent", async () => {
    configureAuth();
    const token = await signed({ role: "admin" });
    vi.stubEnv("DATABASE_URL", "");
    await expect(
      sdk.authenticateRequest(request({ cookie: `${COOKIE_NAME}=${token}` }))
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(getUserByOpenId).not.toHaveBeenCalled();
  });
  it("rejects a JWT identity sync that returns a different openId", async () => {
    configureAuth();
    vi.mocked(getUserByOpenId).mockResolvedValue(undefined);
    vi.spyOn(sdk, "getUserInfoWithJwt").mockResolvedValue({
      openId: "different-openid",
    });
    await expect(
      sdk.authenticateRequest(
        request({ authorization: `Bearer ${await signed()}` })
      )
    ).rejects.toThrow("does not match");
    expect(upsertUser).not.toHaveBeenCalled();
  });
  it("keeps context logged out for invalid cookies", async () => {
    const req = request({ cookie: `${COOKIE_NAME}=invalid` });
    const ctx = await createContext({
      req,
      res: {} as never,
      info: {} as never,
    });
    expect(ctx.user).toBeNull();
  });
  it("uses the recovered official Connect exchange and identity payloads", async () => {
    configureAuth();
    const post = vi
      .fn()
      .mockResolvedValueOnce({ data: { accessToken: "isolated-access-token" } })
      .mockResolvedValueOnce({
        data: {
          openId: "real-openid",
          platforms: ["REGISTERED_PLATFORM_GOOGLE"],
        },
      });
    const instance = new SDKServer({ post } as never);
    const state = encodeOAuthState({
      redirectUri: `${origin}/api/oauth/callback`,
      nonce: "nonce",
    });
    const token = await instance.exchangeCodeForToken("isolated-code", state);
    expect(post.mock.calls[0][0]).toBe(
      "/webdev.v1.WebDevAuthPublicService/ExchangeToken"
    );
    expect(post.mock.calls[0][1]).toEqual({
      clientId: "project-under-test",
      grantType: "authorization_code",
      code: "isolated-code",
      redirectUri: `${origin}/api/oauth/callback`,
    });
    expect(await instance.getUserInfo(token.accessToken)).toMatchObject({
      openId: "real-openid",
      loginMethod: "google",
    });
    expect(post.mock.calls[1][1]).toEqual({
      accessToken: "isolated-access-token",
    });
  });
});

describe("OAuth browser binding", () => {
  it("issues an HttpOnly Secure SameSite=None nonce on public HTTPS behind HTTP", async () => {
    configureAuth();
    const app = express();
    app.use(express.json());
    registerOAuthRoutes(app);
    const { response, url } = await begin(await listen(app));
    expect(response.status).toBe(200);
    expect(url.origin).toBe("https://oauth.example.test");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("responseType")).toBe("code");
    expect(decodeOAuthState(url.searchParams.get("state")!)).toMatchObject({
      redirectUri: `${origin}/api/oauth/callback`,
      nonce: expect.any(String),
    });
    expect(response.headers.getSetCookie()[0]).toMatch(
      /__Host-oauth_state=.*HttpOnly; Secure; SameSite=None/
    );
  });
  it("rejects state mismatch before any token exchange", async () => {
    configureAuth();
    const exchange = vi.spyOn(sdk, "exchangeCodeForToken");
    const app = express();
    app.use(express.json());
    registerOAuthRoutes(app);
    const base = await listen(app);
    const { state } = await begin(base);
    const response = await fetch(
      `${base}/api/oauth/callback?code=code&state=${encodeURIComponent(state)}`,
      { headers: { Cookie: `${OAUTH_STATE_COOKIE}=not-the-issued-nonce` } }
    );
    expect(response.status).toBe(403);
    expect(exchange).not.toHaveBeenCalled();
  });
  it("binds redirect URI and consumes successful state once, setting both session names", async () => {
    configureAuth();
    vi.spyOn(sdk, "exchangeCodeForToken").mockResolvedValue({
      accessToken: "isolated-access-token",
    });
    vi.spyOn(sdk, "getUserInfo").mockResolvedValue({
      openId: "real-openid",
      name: "Real Member",
    });
    const app = express();
    app.use(express.json());
    registerOAuthRoutes(app);
    const base = await listen(app);
    const { state, cookie } = await begin(base);
    const callback = `${base}/api/oauth/callback?code=code&state=${encodeURIComponent(state)}`;
    const response = await fetch(callback, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/account");
    const sessionCookies = response.headers
      .getSetCookie()
      .filter(
        value =>
          value.startsWith(`${COOKIE_NAME}=`) ||
          value.startsWith(`${APP_SESSION_COOKIE}=`)
      );
    expect(sessionCookies).toHaveLength(2);
    for (const value of sessionCookies)
      expect(value).toMatch(/HttpOnly; Secure; SameSite=None/);
    const replay = await fetch(callback, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    expect(replay.status).toBe(403);
    expect(sdk.exchangeCodeForToken).toHaveBeenCalledTimes(1);
  });
  it("does not mint a session when account persistence cannot resolve the identity", async () => {
    configureAuth();
    vi.mocked(getUserByOpenId).mockResolvedValue(undefined);
    vi.spyOn(sdk, "exchangeCodeForToken").mockResolvedValue({
      accessToken: "isolated-access-token",
    });
    vi.spyOn(sdk, "getUserInfo").mockResolvedValue({ openId: "real-openid" });
    const sign = vi.spyOn(sdk, "createSessionToken");
    const app = express();
    app.use(express.json());
    registerOAuthRoutes(app);
    const base = await listen(app);
    const { state, cookie } = await begin(base);
    const response = await fetch(
      `${base}/api/oauth/callback?code=code&state=${encodeURIComponent(state)}`,
      { headers: { Cookie: cookie } }
    );
    expect(response.status).toBe(503);
    expect(sign).not.toHaveBeenCalled();
    expect(
      response.headers
        .getSetCookie()
        .some(value => value.startsWith(`${APP_SESSION_COOKIE}=`))
    ).toBe(false);
  });
  it("rejects tampered callback destinations and expired nonce records", () => {
    const store = new OAuthStateStore();
    const nonce = store.issue(
      `${origin}/api/oauth/callback`,
      origin,
      OAUTH_STATE_COOKIE,
      1000
    );
    expect(
      store.consume(nonce, nonce, "https://evil.example/callback", 1100)
    ).toBeNull();
    expect(
      store.consume(nonce, nonce, `${origin}/api/oauth/callback`, 700000)
    ).toBeNull();
  });
  it("refuses missing configuration and hostile login origins without crashing", async () => {
    const app = express();
    app.use(express.json());
    registerOAuthRoutes(app);
    const base = await listen(app);
    let response = await fetch(`${base}/api/oauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ origin }),
    });
    expect(response.status).toBe(503);
    configureAuth();
    response = await fetch(`${base}/api/oauth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      body: JSON.stringify({ origin: "https://evil.example" }),
    });
    expect(response.status).toBe(403);
  });
});

describe("cookie and mutation Origin security", () => {
  it("defaults internal HTTP/public host requests to secure iframe-compatible cookies", () => {
    expect(getSessionCookieOptions(request())).toMatchObject({
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
    expect(
      getSessionCookieOptions(request({ "x-forwarded-proto": "https" }))
    ).toMatchObject({ secure: true, sameSite: "none" });
  });
  it("separates plain loopback HTTP from HTTPS Preview cookies", () => {
    expect(
      getSessionCookieOptions(
        request({ host: "localhost:3000", origin: "http://localhost:3000" })
      )
    ).toMatchObject({ secure: false, sameSite: "lax" });
    expect(
      getSessionCookieOptions(
        request({ host: "localhost:3000", "x-forwarded-proto": "https" })
      )
    ).toMatchObject({ secure: true, sameSite: "none" });
    expect(LOCAL_OAUTH_STATE_COOKIE).not.toBe(OAUTH_STATE_COOKIE);
  });
  it("rejects foreign, null and missing mutation origins", () => {
    vi.stubEnv("APP_ORIGIN", origin);
    expect(hasTrustedMutationOrigin(request({ origin }))).toBe(true);
    expect(
      hasTrustedMutationOrigin(request({ origin: "https://evil.example" }))
    ).toBe(false);
    expect(hasTrustedMutationOrigin(request({ origin: "null" }))).toBe(false);
    expect(hasTrustedMutationOrigin(request())).toBe(false);
    expect(
      hasTrustedMutationOrigin(
        request({ origin, "sec-fetch-site": "cross-site" })
      )
    ).toBe(false);
  });
  it("uses explicit origins instead of attacker-supplied Host/forwarded Host", () => {
    vi.stubEnv("APP_ORIGIN", origin);
    expect(
      isTrustedOrigin(
        request({ host: "evil.example", "x-forwarded-host": "evil.example" }),
        "https://evil.example"
      )
    ).toBe(false);
    expect(isTrustedOrigin(request({ host: "internal-service" }), origin)).toBe(
      true
    );
  });
  it("only accepts the exact current Host when an origin allowlist is absent", () => {
    expect(isTrustedOrigin(request(), origin)).toBe(true);
    expect(isTrustedOrigin(request(), "https://another.manus.space")).toBe(
      false
    );
    expect(
      isTrustedOrigin(
        request({ "x-forwarded-host": "evil.example" }),
        "https://evil.example"
      )
    ).toBe(false);
    expect(
      isTrustedOrigin(request(), "https://app.example.test.evil.example")
    ).toBe(false);
  });
  it("guards HTTP logout and clears both cookies on a trusted request", async () => {
    vi.stubEnv("APP_ORIGIN", origin);
    const base = await listen(createApp());
    const denied = await fetch(`${base}/api/trpc/auth.logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      body: JSON.stringify({ json: null }),
    });
    expect(denied.status).toBe(403);
    expect(denied.headers.getSetCookie()).toHaveLength(0);
    const ok = await fetch(`${base}/api/trpc/auth.logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ json: null }),
    });
    expect(ok.status).toBe(200);
    expect(
      ok.headers
        .getSetCookie()
        .map(value => value.split("=")[0])
        .sort()
    ).toEqual([COOKIE_NAME, APP_SESSION_COOKIE].sort());
  });
});

describe("recovered runtime and storage", () => {
  it("health reports listener up while readiness and protected APIs fail closed", async () => {
    const base = await listen(createApp());
    const health = await fetch(`${base}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({
      ok: true,
      configured: false,
      connectivityVerified: false,
    });
    expect((await fetch(`${base}/api/ready`)).status).toBe(503);
    expect((await fetch(`${base}/api/trpc/account`)).status).toBe(503);
    const me = await fetch(`${base}/api/trpc/auth.me`);
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ result: { data: { json: null } } });
  });
  it("preserves Stripe's exact raw bytes before JSON parsing", async () => {
    const base = await listen(createApp());
    const body = '{ "preserve" : "raw bytes" }';
    const response = await fetch(`${base}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    expect(await response.json()).toEqual({ raw: true, text: body });
  });
  it("API and missing asset requests do not receive SPA fallback HTML", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "bioupgrade-static-")
    );
    temporaryDirectories.push(directory);
    await writeFile(
      path.join(directory, "index.html"),
      "<!doctype html><title>Recovered UI</title>"
    );
    const app = createApp();
    serveStatic(app, directory);
    app.use((_req, res) => res.status(404).end());
    const base = await listen(app);
    expect(
      (await fetch(`${base}/account`, { headers: { Accept: "text/html" } }))
        .status
    ).toBe(200);
    const api = await fetch(`${base}/api/not-a-route`, {
      headers: { Accept: "text/html" },
    });
    expect(api.status).toBe(404);
    expect(api.headers.get("content-type")).toContain("application/json");
    expect((await fetch(`${base}/missing.js`)).status).toBe(404);
  });
  it("keeps PORT fixed and rejects malformed values", async () => {
    expect(configuredPort()).toBe(3000);
    expect(configuredPort("3000")).toBe(3000);
    for (const value of ["3000garbage", "0", "-1", "65536", "3.5"])
      expect(() => configuredPort(value)).toThrow();
    const base = await listen(express());
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PORT", new URL(base).port);
    await expect(startServer()).rejects.toMatchObject({ code: "EADDRINUSE" });
  });
  it.each([
    "https://evil.example/asset",
    "../secret",
    "folder/../secret",
    "/absolute",
    "folder\\key",
    "folder/key?url=evil",
    "a//b",
  ])("rejects unsafe storage key %s", key => {
    expect(isSafeStorageKey(key)).toBe(false);
  });
  it("uses only the credentialed configured presign adapter", async () => {
    vi.stubEnv("MANUS_API_URL", "https://storage-api.example.test/");
    vi.stubEnv("MANUS_API_KEY", "isolated-test-api-key");
    const app = express();
    registerStorageProxy(app);
    const base = await listen(app);
    const realFetch = globalThis.fetch;
    const mock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            url: "https://bucket.example.test/file?signature=isolated",
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", mock);
    const response = await realFetch(`${base}/manus-storage/folder/image.png`, {
      redirect: "manual",
    });
    expect(response.status).toBe(307);
    const called = new URL(String(mock.mock.calls[0][0]));
    expect(called.origin).toBe("https://storage-api.example.test");
    expect(called.pathname).toBe("/v1/storage/presign/get");
    expect(called.searchParams.get("path")).toBe("folder/image.png");
    expect(mock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer isolated-test-api-key"
    );
    expect(response.headers.get("location")).toBe(
      "https://bucket.example.test/file?signature=isolated"
    );
  });
  it("returns 503 rather than proxying when storage is unconfigured", async () => {
    const app = express();
    registerStorageProxy(app);
    expect(
      (await fetch(`${await listen(app)}/manus-storage/folder/image.png`))
        .status
    ).toBe(503);
  });
});

describe("non-crashing client login initiation", () => {
  it("shows a user-facing unavailable error instead of constructing an undefined portal URL", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { origin, assign } });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "Sign-in is unavailable." }), {
            status: 503,
          })
        )
    );
    expect(await startLogin()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Sign-in is unavailable.");
    expect(assign).not.toHaveBeenCalled();
  });
  it("handles a network error without rejecting into a React event handler", async () => {
    vi.stubGlobal("window", { location: { origin, assign: vi.fn() } });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(startLogin()).resolves.toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });
});
