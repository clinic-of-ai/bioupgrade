import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const";
import type { TrpcContext } from "./context";
import { APP_SESSION_COOKIE, getSessionCookieOptions } from "./cookies";
import { ENV, isSessionConfigured } from "./env";
import { hasTrustedMutationOrigin } from "./origin";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure.use(
  async ({ ctx, type, path, next }) => {
    if (type === "mutation" && !hasTrustedMutationOrigin(ctx.req)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "A trusted application Origin is required.",
      });
    }
    const result = await next();
    // Existing routers.ts clears the legacy cookie. Clear Preview's current name
    // too so the recovered router cannot leave the user logged in after logout.
    if (path === "auth.logout" && result.ok) {
      ctx.res.clearCookie(APP_SESSION_COOKIE, getSessionCookieOptions(ctx.req));
    }
    return result;
  }
);

const requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    if (
      ctx.authError ||
      (ctx.req.method && (!isSessionConfigured() || !ENV.databaseUrl))
    ) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "Account sign-in is not available. Authentication and database configuration are required.",
      });
    }
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = publicProcedure.use(requireUser);
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin")
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  return next({ ctx });
});
