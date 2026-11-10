import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import { sdk, ServiceUnavailableError } from "./sdk";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: User | null;
  authError?: "SERVICE_UNAVAILABLE";
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  try {
    return {
      req: opts.req,
      res: opts.res,
      user: await sdk.authenticateRequest(opts.req),
    };
  } catch (error) {
    // auth.me must return null for a logged-out or invalid-session request.
    return {
      req: opts.req,
      res: opts.res,
      user: null,
      ...(error instanceof ServiceUnavailableError
        ? { authError: "SERVICE_UNAVAILABLE" as const }
        : {}),
    };
  }
}
