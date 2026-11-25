import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

import { notifyOwner } from "./_core/notification";
import { appRouter } from "./routers";
import {
  formatIntakeBrief,
  intakeInput,
  resetIntakeRateLimit,
} from "./consultation-intake";
import {
  CLIENT_TYPES,
  INTAKE_SERVICES,
  READ_AI_LINKS,
} from "../shared/consultation-intake";

function ctx(ip = "203.0.113.7"): TrpcContext {
  return {
    user: null,
    req: { ip, headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const valid = {
  serviceId: "performance-blueprint",
  clientTypeId: "physical-performance",
  name: "Ada Runner",
  email: "ada@example.com",
  introduction:
    "Hybrid athlete, six years of structured training, software engineer, booking to understand recovery research before my next block.",
  goal: "Raise VO2max from 48 to 52 ml/kg/min over 16 weeks without losing squat 1RM.",
  answers: { discipline: "HYROX, accumulation block", metrics: "HRV rMSSD" },
  links: "doi:10.1000/example",
  outcome: "An evidence-graded reading list",
  consentEducational: true as const,
  consentData: true as const,
  adult: true as const,
  website: "",
};

describe("consultation intake", () => {
  beforeEach(() => {
    resetIntakeRateLimit();
    vi.mocked(notifyOwner).mockReset();
    vi.mocked(notifyOwner).mockResolvedValue(true);
  });

  it("defines four services with Read AI links and six client types with three prompts", () => {
    expect(INTAKE_SERVICES.map(s => s.title)).toEqual([
      "Bio-Strategy Session",
      "The Growth Protocol",
      "The Performance Blueprint",
      "Elite Concierge Protocol",
    ]);
    for (const service of INTAKE_SERVICES) {
      expect(service.bookingUrl).toMatch(/^https:\/\/cal\.read\.ai\//);
      expect(service.bookingUrl).toBe(
        service.minutes === 45 ? READ_AI_LINKS.bioupgrade45 : READ_AI_LINKS.default60
      );
    }
    expect(CLIENT_TYPES).toHaveLength(6);
    for (const type of CLIENT_TYPES) expect(type.prompts).toHaveLength(3);
  });

  it("notifies the owner with the full brief and returns the matching booking link", async () => {
    const result = await appRouter.createCaller(ctx()).consultationIntake.submit(valid);
    expect(result).toEqual({
      received: true,
      bookingUrl: READ_AI_LINKS.default60,
      minutes: 60,
    });
    const sent = vi.mocked(notifyOwner).mock.calls[0]![0];
    expect(sent.title).toContain("The Performance Blueprint");
    expect(sent.content).toContain("PRIMARY GOAL");
    expect(sent.content).toContain("VO2max from 48 to 52");
    expect(sent.content).toContain("HYROX, accumulation block");
    expect(sent.content).toContain("(not provided)");
    expect(sent.content).toContain("intake-v1");
  });

  it("requires all consents, a real introduction and goal, and rejects unknown fields", () => {
    expect(intakeInput.safeParse({ ...valid, consentData: false }).success).toBe(false);
    expect(intakeInput.safeParse({ ...valid, adult: false }).success).toBe(false);
    expect(intakeInput.safeParse({ ...valid, introduction: "Hi" }).success).toBe(false);
    expect(intakeInput.safeParse({ ...valid, goal: "Be better" }).success).toBe(false);
    expect(intakeInput.safeParse({ ...valid, serviceId: "unknown" }).success).toBe(false);
    expect(intakeInput.safeParse({ ...valid, dose: "x" }).success).toBe(false);
    expect(intakeInput.safeParse({ ...valid, website: "spam" }).success).toBe(false);
  });

  it("does not return a booking link when the brief cannot be delivered", async () => {
    vi.mocked(notifyOwner).mockResolvedValue(false);
    await expect(
      appRouter.createCaller(ctx()).consultationIntake.submit(valid)
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("rate-limits repeated submissions from one sender", async () => {
    const caller = appRouter.createCaller(ctx("198.51.100.1"));
    for (let i = 0; i < 5; i++) await caller.consultationIntake.submit(valid);
    await expect(caller.consultationIntake.submit(valid)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("formats only the selected profile's prompts", () => {
    const brief = formatIntakeBrief(intakeInput.parse(valid));
    expect(brief.content).toContain("Discipline, training age and current phase");
    expect(brief.content).not.toContain("Cognitive load profile");
  });
});
