import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const context = (id?: number): TrpcContext => ({
  user: id
    ? {
        id,
        openId: "isolated-user",
        role: "user",
        name: null,
        email: null,
        loginMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null,
  req: { headers: { origin: "https://example.test" } } as any,
  res: {} as any,
});
afterEach(() => vi.unstubAllEnvs());
describe("commerce API unavailable/authentication guarantees", () => {
  it("returns unavailable, not an invented zero balance or saved interest, without storage", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const caller = appRouter.createCaller(context(123));
    await expect(caller.account.me()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    await expect(caller.rewards.me()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    await expect(
      caller.interest.join({ productId: "field-notes-kit", consent: true })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("requires login for account data, referral attribution, and consented interest", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.account.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.referrals.applyCode({ code: "opaque-code" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.interest.join({ productId: "field-notes-kit", consent: true })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("cannot client-self-claim purchase/referral missions or the unverified planned reading mission", async () => {
    const caller = appRouter.createCaller(context(123));
    await expect(
      caller.rewards.claimMission({ missionId: "first-purchase" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.rewards.claimMission({ missionId: "bring-a-researcher" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.rewards.claimMission({ missionId: "read-the-brief" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
  it("preserves product validation errors before auth but requires login for a purchasable service", async () => {
    const caller = appRouter.createCaller(context());
    await expect(
      caller.checkout.createSession({ productId: "unknown" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.checkout.createSession({
        productId: "field-notes-kit",
        catalog: "marketplace",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(
      caller.checkout.createSession({ productId: "evidence-briefing" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(
      caller.checkout.createSession({ productId: "research-strategy-session" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
