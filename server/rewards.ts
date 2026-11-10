import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { REWARD_MISSIONS } from "../shared/rewards";
import { accountSnapshot } from "./account";
export const rewardsRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const { account, events, missions } = await accountSnapshot(ctx.user.id);
    return { account, events, missions };
  }),
  claimMission: protectedProcedure
    .input(z.object({ missionId: z.string().min(1) }))
    .mutation(({ input }) => {
      const mission = REWARD_MISSIONS.find(item => item.id === input.missionId);
      if (!mission)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mission not found.",
        });
      if (
        input.missionId === "first-purchase" ||
        input.missionId === "bring-a-researcher"
      )
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This mission is awarded only after server-verified eligible commerce.",
        });
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "This learning mission is planned; completion verification is not available yet.",
      });
    }),
});
