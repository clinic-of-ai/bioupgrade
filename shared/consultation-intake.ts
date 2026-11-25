/**
 * Consultation intake: services, Read AI booking links and client-type prompts.
 *
 * Read AI Smart Scheduler links cannot ask custom questions, so the brief is
 * collected here first and the client is then sent to the matching link.
 * Read AI's free plan allows five custom links; the 60-minute services share
 * the owner's default 60-minute link.
 */
export const READ_AI_LINKS = {
  bioupgrade45:
    "https://cal.read.ai/philippe-datakult/01M893EXPFDNYKE82SRFC5XS5A",
  default60: "https://cal.read.ai/philippe-datakult/60-min",
} as const;

export type IntakeService = {
  id: string;
  title: string;
  priceLabel: string;
  minutes: 45 | 60;
  bookingUrl: string;
  focus: string;
};

export const INTAKE_SERVICES: readonly IntakeService[] = [
  {
    id: "bio-strategy-session",
    title: "Bio-Strategy Session",
    priceLabel: "€39",
    minutes: 45,
    bookingUrl: READ_AI_LINKS.bioupgrade45,
    focus:
      "One precise question, mapped against the literature: mechanism, study quality and open uncertainties.",
  },
  {
    id: "growth-protocol",
    title: "The Growth Protocol",
    priceLabel: "€55",
    minutes: 45,
    bookingUrl: READ_AI_LINKS.bioupgrade45,
    focus:
      "A structured research-literacy review of one goal area with a written reading map of primary sources.",
  },
  {
    id: "performance-blueprint",
    title: "The Performance Blueprint",
    priceLabel: "€95",
    minutes: 60,
    bookingUrl: READ_AI_LINKS.default60,
    focus:
      "A deep-dive into the evidence landscape for a defined performance objective, including measurement and tracking design.",
  },
  {
    id: "elite-concierge",
    title: "Elite Concierge Protocol",
    priceLabel: "€175",
    minutes: 60,
    bookingUrl: READ_AI_LINKS.default60,
    focus:
      "A multi-domain evidence review with priority access, a follow-up window and a documented reading and tracking plan.",
  },
] as const;

export type IntakePrompt = { id: string; label: string; hint: string };

export type ClientType = {
  id: string;
  label: string;
  descriptor: string;
  goalExample: string;
  prompts: readonly [IntakePrompt, IntakePrompt, IntakePrompt];
};

export const CLIENT_TYPES: readonly ClientType[] = [
  {
    id: "physical-performance",
    label: "Athletic & physical performance",
    descriptor: "Strength, endurance, hybrid or competitive athletes.",
    goalExample:
      "Raise VO2max from 48 to 52 ml/kg/min over a 16-week base block without losing 1RM squat strength; understand what the literature says about recovery-limited adaptation.",
    prompts: [
      {
        id: "discipline",
        label: "Discipline, training age and current phase",
        hint: "e.g. hybrid / HYROX, 6 years training, currently in an accumulation block, 9 sessions per week.",
      },
      {
        id: "metrics",
        label: "Performance and recovery metrics you already track",
        hint: "e.g. HRV (rMSSD), resting HR, sleep stages, VO2max estimate, 1RM, lactate threshold pace, RPE logs.",
      },
      {
        id: "constraints",
        label: "Competition calendar and testing constraints",
        hint: "Next key event, and whether you compete in a tested federation (WADA/national anti-doping code).",
      },
    ],
  },
  {
    id: "cognitive-performance",
    label: "Cognitive performance & knowledge work",
    descriptor: "Founders, engineers, researchers and high-load decision-makers.",
    goalExample:
      "Extend deep-work capacity from 2 to 4 focused hours per day within 8 weeks and understand the evidence on sleep architecture, attention and working memory.",
    prompts: [
      {
        id: "load",
        label: "Cognitive load profile",
        hint: "Typical schedule, context-switching, deep-work blocks, travel/time-zone shifts, chronotype.",
      },
      {
        id: "baseline",
        label: "Current baseline and what you measure",
        hint: "e.g. sleep latency and efficiency, wearable data, reaction-time or n-back scores, caffeine intake, focus logs.",
      },
      {
        id: "tried",
        label: "What you have already tried and observed",
        hint: "Interventions, duration, what changed and what did not; include anything you stopped and why.",
      },
    ],
  },
  {
    id: "longevity",
    label: "Longevity & healthspan",
    descriptor: "Biohackers focused on ageing biology and long-horizon resilience.",
    goalExample:
      "Build a literature-grounded view of mitochondrial and senescence pathways relevant to my 12-month goals, and decide which biomarkers to track every quarter.",
    prompts: [
      {
        id: "horizon",
        label: "Your healthspan priorities and time horizon",
        hint: "e.g. cardiovascular risk, metabolic flexibility, mitochondrial function, cognitive reserve; 1-, 5- or 10-year view.",
      },
      {
        id: "biomarkers",
        label: "Biomarkers or tests you already have (optional)",
        hint: "Only if you choose to share: e.g. ApoB, HbA1c, hs-CRP, VO2max, DEXA, epigenetic-age test. No diagnoses needed.",
      },
      {
        id: "pathways",
        label: "Pathways or compounds whose research you want to understand",
        hint: "e.g. mTOR/AMPK, NAD+ metabolism, mitochondrial peptides, telomere biology; name the papers if you have them.",
      },
    ],
  },
  {
    id: "metabolic",
    label: "Metabolic health & body composition",
    descriptor: "Recomposition, glycaemic control and lean-mass preservation.",
    goalExample:
      "Understand the published evidence on incretin-pathway research and lean-mass preservation, and design how I would track body composition over 12 weeks.",
    prompts: [
      {
        id: "composition",
        label: "Current body-composition picture",
        hint: "e.g. DEXA or BIA results, waist circumference, weight trend, training and protein intake.",
      },
      {
        id: "glycaemic",
        label: "Glycaemic and nutrition data (optional)",
        hint: "Only if you choose to share: CGM traces, fasting glucose, eating window, macronutrient pattern.",
      },
      {
        id: "research",
        label: "Research areas you want mapped",
        hint: "e.g. GLP-1/GIP receptor agonist trials, appetite regulation, muscle protein synthesis, mitochondrial uncoupling.",
      },
    ],
  },
  {
    id: "self-experimenter",
    label: "Advanced self-experimenter or independent researcher",
    descriptor: "People running structured n-of-1 projects or reviewing primary literature.",
    goalExample:
      "Pressure-test my n-of-1 tracking design (baseline, washout, confounders, outcome measures) against what the primary literature can and cannot support.",
    prompts: [
      {
        id: "question",
        label: "Your research question in one sentence",
        hint: "Population, intervention or exposure, comparison and outcome (PICO) if you can.",
      },
      {
        id: "literature",
        label: "Literature you have already read",
        hint: "DOIs, PMIDs or preprint links; note study type (RCT, cohort, in vitro, animal model) and what you doubt.",
      },
      {
        id: "design",
        label: "Your measurement and logging setup",
        hint: "Outcome measures, sampling frequency, baseline length, washout, blinding, confounders you control for.",
      },
    ],
  },
  {
    id: "practitioner",
    label: "Practitioner, coach or clinic team",
    descriptor: "Coaches, trainers and teams who need evidence reviews for their work.",
    goalExample:
      "Get an evidence-graded briefing on recovery-peptide research to answer client questions accurately and document what is and is not established.",
    prompts: [
      {
        id: "population",
        label: "Who you work with",
        hint: "Client population, sport or setting, team size and your professional scope.",
      },
      {
        id: "deliverable",
        label: "What you need to walk away with",
        hint: "e.g. evidence-grading table, reading list, client-facing explainer, protocol-documentation template.",
      },
      {
        id: "standards",
        label: "Standards and constraints you operate under",
        hint: "Regulatory or federation rules, internal policies, language or format requirements.",
      },
    ],
  },
] as const;

export const INTAKE_CONSENT_VERSION = "intake-v1";

export const INTAKE_LIMITS = {
  name: 120,
  email: 254,
  introduction: { min: 80, max: 1500 },
  goal: { min: 40, max: 1000 },
  prompt: 800,
  links: 1000,
  outcome: 600,
} as const;

export function getIntakeService(id: string | null | undefined) {
  return INTAKE_SERVICES.find(service => service.id === id) ?? null;
}

export function getClientType(id: string | null | undefined) {
  return CLIENT_TYPES.find(type => type.id === id) ?? null;
}
