import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getServiceStatus, isOAuthConfigured } from "./env";
import { notifyOwner } from "./notification";

export const systemRouter = router({
  health: publicProcedure
    .input(z.object({ timestamp: z.number().min(0) }).optional())
    .query(() => ({ ok: true, ...getServiceStatus() })),
  authStatus: publicProcedure.query(() => ({
    configured: isOAuthConfigured(),
    message: isOAuthConfigured()
      ? null
      : "Sign-in is unavailable until Manus OAuth and the account database are configured.",
  })),
  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(1200),
        content: z.string().trim().min(1).max(20000),
      })
    )
    .mutation(async ({ input }) => ({ success: await notifyOwner(input) })),
});
