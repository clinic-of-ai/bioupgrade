import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import {
  AXIOS_TIMEOUT_MS,
  COOKIE_NAME,
  ONE_YEAR_MS,
  decodeOAuthState,
} from "../../shared/const";
import { getUserByOpenId, upsertUser } from "../db";
import { APP_SESSION_COOKIE } from "./cookies";
import { ENV, isServiceUrl, isSessionConfigured } from "./env";

const EXCHANGE_TOKEN_PATH = "/webdev.v1.WebDevAuthPublicService/ExchangeToken";
const GET_USER_INFO_PATH = "/webdev.v1.WebDevAuthPublicService/GetUserInfo";
const GET_USER_INFO_WITH_JWT_PATH =
  "/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt";
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export class AuthenticationError extends Error {
  readonly statusCode = 401;
  constructor(message = "Invalid session") {
    super(message);
    this.name = "AuthenticationError";
  }
}
export class ServiceUnavailableError extends Error {
  readonly statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}
export type SessionPayload = { openId: string; appId: string; name: string };
export type SessionOptions = { name?: string; expiresInMs?: number };
export type OAuthToken = {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
};
export type OAuthUser = {
  openId: string;
  name?: string;
  email?: string | null;
  platforms?: string[];
  platform?: string | null;
  loginMethod?: string | null;
};

export class SDKServer {
  constructor(private readonly client?: AxiosInstance) {}

  private async post<T>(path: string, payload: unknown): Promise<T> {
    if (!ENV.appId || !isServiceUrl(ENV.oAuthServerUrl)) {
      throw new ServiceUnavailableError(
        "Manus OAuth service is not configured."
      );
    }
    // These are the recovered Connect HTTP endpoints, not a new OAuth provider.
    const client =
      this.client ||
      axios.create({ baseURL: ENV.oAuthServerUrl, timeout: AXIOS_TIMEOUT_MS });
    const { data } = await client.post<T>(path, payload, {
      maxRedirects: 0,
      headers: {
        "Content-Type": "application/json",
        "connect-protocol-version": "1",
      },
    });
    if (!data || (typeof data === "object" && "error" in data)) {
      throw new ServiceUnavailableError(
        "Manus OAuth returned an invalid response."
      );
    }
    return data;
  }

  deriveLoginMethod(
    platforms: unknown,
    fallback?: string | null
  ): string | null {
    if (nonEmpty(fallback)) return fallback;
    if (!Array.isArray(platforms)) return null;
    const values = new Set(platforms.filter(nonEmpty));
    const methods: Record<string, string> = {
      REGISTERED_PLATFORM_EMAIL: "email",
      REGISTERED_PLATFORM_GOOGLE: "google",
      REGISTERED_PLATFORM_APPLE: "apple",
      REGISTERED_PLATFORM_MICROSOFT: "microsoft",
      REGISTERED_PLATFORM_AZURE: "microsoft",
      REGISTERED_PLATFORM_GITHUB: "github",
    };
    for (const [platform, method] of Object.entries(methods))
      if (values.has(platform)) return method;
    return Array.from(values)[0]?.toLowerCase() || null;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<OAuthToken> {
    const redirectUri = decodeOAuthState(state).redirectUri;
    if (!code || !redirectUri)
      throw new AuthenticationError("Invalid OAuth exchange.");
    const token = await this.post<OAuthToken>(EXCHANGE_TOKEN_PATH, {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri,
    });
    if (!nonEmpty(token.accessToken))
      throw new ServiceUnavailableError(
        "OAuth exchange returned no access token."
      );
    return token;
  }

  private normalizeUser(data: OAuthUser): OAuthUser {
    if (!nonEmpty(data.openId) || data.openId.length > 64)
      throw new AuthenticationError("OAuth returned no valid identity.");
    const loginMethod = this.deriveLoginMethod(
      data.platforms,
      data.loginMethod || data.platform
    );
    return { ...data, platform: loginMethod, loginMethod };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUser> {
    return this.normalizeUser(
      await this.post<OAuthUser>(GET_USER_INFO_PATH, { accessToken })
    );
  }

  async getUserInfoWithJwt(jwtToken: string): Promise<OAuthUser> {
    return this.normalizeUser(
      await this.post<OAuthUser>(GET_USER_INFO_WITH_JWT_PATH, {
        jwtToken,
        projectId: ENV.appId,
      })
    );
  }

  parseCookies(header?: string): Map<string, string | undefined> {
    try {
      return new Map(Object.entries(parseCookieHeader(header || "")));
    } catch {
      return new Map();
    }
  }

  getSessionSecret() {
    if (!isSessionConfigured())
      throw new ServiceUnavailableError(
        "Project session verification is not configured."
      );
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(openId: string, options: SessionOptions = {}) {
    return this.signSession(
      { openId, appId: ENV.appId, name: options.name || "" },
      options
    );
  }

  async signSession(payload: SessionPayload, options: SessionOptions = {}) {
    if (!nonEmpty(payload.openId) || payload.appId !== ENV.appId)
      throw new AuthenticationError("Invalid project identity.");
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    if (!Number.isFinite(expiresInMs) || expiresInMs <= 0)
      throw new AuthenticationError("Invalid session lifetime.");
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
      .sign(this.getSessionSecret());
  }

  async verifySession(token?: string | null): Promise<SessionPayload | null> {
    if (!token || !isSessionConfigured()) return null;
    try {
      const { payload } = await jwtVerify(token, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      // jwtVerify checks an exp if present; the application also requires it.
      if (
        !nonEmpty(payload.openId) ||
        payload.openId.length > 64 ||
        payload.appId !== ENV.appId ||
        typeof payload.exp !== "number" ||
        !Number.isFinite(payload.exp) ||
        payload.exp <= Date.now() / 1000
      )
        return null;
      if (payload.name !== undefined && typeof payload.name !== "string")
        return null;
      return {
        openId: payload.openId,
        appId: ENV.appId,
        name: typeof payload.name === "string" ? payload.name : "",
      };
    } catch {
      return null;
    } // Never log cookies, JWTs or signing secrets.
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const authHeader = req.headers.authorization;
    // A supplied invalid cookie must not be rescued by a different bearer identity.
    const token =
      cookies.get(APP_SESSION_COOKIE) ||
      cookies.get(COOKIE_NAME) ||
      (typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined);
    if (!token) throw new AuthenticationError();
    if (!isSessionConfigured())
      throw new ServiceUnavailableError(
        "Project authentication is not configured."
      );
    const session = await this.verifySession(token);
    if (!session) throw new AuthenticationError();
    if (!ENV.databaseUrl)
      throw new ServiceUnavailableError("Account database is not configured.");
    try {
      let user = await getUserByOpenId(session.openId);
      if (!user) {
        const info = await this.getUserInfoWithJwt(token);
        if (info.openId !== session.openId)
          throw new AuthenticationError(
            "OAuth identity does not match the session."
          );
        await upsertUser({
          openId: info.openId,
          name: info.name || null,
          email: info.email ?? null,
          loginMethod: info.loginMethod ?? null,
          lastSignedIn: new Date(),
        });
        user = await getUserByOpenId(session.openId);
      }
      if (!user)
        throw new ServiceUnavailableError(
          "Account could not be resolved from the database."
        );
      // Roles come from the real database, not JWT name/claims or Preview heuristics.
      return user;
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof ServiceUnavailableError
      )
        throw error;
      throw new ServiceUnavailableError(
        "Account service is temporarily unavailable."
      );
    }
  }
}

export const sdk = new SDKServer();
