import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  CLIENT_TYPES,
  INTAKE_CONSENT_VERSION,
  INTAKE_LIMITS,
  INTAKE_SERVICES,
  getClientType,
  getIntakeService,
} from "../shared/consultation-intake";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";

const text = (max: number, min = 0) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(value => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), {
      message: "Control characters are not allowed.",
    });

export const intakeInput = z
  .object({
    serviceId: z.enum(
      INTAKE_SERVICES.map(service => service.id) as [string, ...string[]]
    ),
    clientTypeId: z.enum(
      CLIENT_TYPES.map(type => type.id) as [string, ...string[]]
    ),
    name: text(INTAKE_LIMITS.name, 2),
    email: z.string().trim().email().max(INTAKE_LIMITS.email),
    introduction: text(
      INTAKE_LIMITS.introduction.max,
      INTAKE_LIMITS.introduction.min
    ),
    goal: text(INTAKE_LIMITS.goal.max, INTAKE_LIMITS.goal.min),
    answers: z.record(z.string().max(40), text(INTAKE_LIMITS.prompt)).default({}),
    links: text(INTAKE_LIMITS.links).default(""),
    outcome: text(INTAKE_LIMITS.outcome).default(""),
    consentEducational: z.literal(true),
    consentData: z.literal(true),
    adult: z.literal(true),
    /** Honeypot: must stay empty. */
    website: z.string().max(0).default(""),
  })
  .strict();

export type IntakeInput = z.infer<typeof intakeInput>;

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const submissions = new Map<string, number[]>();

export function allowIntake(key: string, now = Date.now()) {
  const recent = (submissions.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    submissions.set(key, recent);
    return false;
  }
  recent.push(now);
  submissions.set(key, recent);
  if (submissions.size > 5000) {
    const firstKey = submissions.keys().next().value;
    if (firstKey !== undefined) submissions.delete(firstKey);
  }
  return true;
}

export function resetIntakeRateLimit() {
  submissions.clear();
}

export function formatIntakeBrief(input: IntakeInput) {
  const service = getIntakeService(input.serviceId)!;
  const clientType = getClientType(input.clientTypeId)!;
  const prompts = clientType.prompts
    .map(prompt => {
      const answer = input.answers[prompt.id]?.trim();
      return `${prompt.label}:\n${answer ? answer : "(not provided)"}`;
    })
    .join("\n\n");
  const title = `Consultation brief: ${service.title} · ${clientType.label} · ${input.name}`;
  const content = [
    `Service: ${service.title} (${service.priceLabel}, ${service.minutes} min)`,
    `Client type: ${clientType.label}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    "",
    "INTRODUCTION",
    input.introduction,
    "",
    "PRIMARY GOAL",
    input.goal,
    "",
    "CONTEXT",
    prompts,
    "",
    "PAPERS / LINKS",
    input.links || "(none)",
    "",
    "DESIRED SESSION OUTCOME",
    input.outcome || "(not specified)",
    "",
    `Consent: educational scope, data processing for session preparation, 18+ (${INTAKE_CONSENT_VERSION}).`,
    `Booking link sent: ${service.bookingUrl}`,
  ].join("\n");
  return { title: title.slice(0, 1200), content: content.slice(0, 20000) };
}

export const consultationIntakeRouter = router({
  submit: publicProcedure.input(intakeInput).mutation(async ({ ctx, input }) => {
    if (input.website) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid request." });
    }
    const service = getIntakeService(input.serviceId);
    const clientType = getClientType(input.clientTypeId);
    if (!service || !clientType) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Unknown option." });
    }
    const key = `${ctx.req.ip ?? "unknown"}|${input.email.toLowerCase()}`;
    if (!allowIntake(key)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many briefs submitted. Please try again later.",
      });
    }
    const brief = formatIntakeBrief(input);
    const delivered = await notifyOwner(brief).catch(() => false);
    if (!delivered) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "Your brief could not be delivered right now. Please try again in a few minutes.",
      });
    }
    return {
      received: true as const,
      bookingUrl: service.bookingUrl,
      minutes: service.minutes,
    };
  }),
});
