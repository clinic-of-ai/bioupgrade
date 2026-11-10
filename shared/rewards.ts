/** Signal Points are non-cash loyalty units, never a product-safety or eligibility credential. */
export const POINTS_PER_EURO = 1;
export type RewardTier = {
  id: string;
  label: string;
  minPoints: number;
  accent: string;
};
export const REWARD_TIERS: RewardTier[] = [
  { id: "signal", label: "Signal", minPoints: 0, accent: "#6b8f71" },
  { id: "protocol", label: "Protocol", minPoints: 500, accent: "#3f995f" },
  { id: "frontier", label: "Frontier", minPoints: 1500, accent: "#c4913c" },
  { id: "operator", label: "Operator", minPoints: 5000, accent: "#172d24" },
];
export const REFERRAL_REWARD_POINTS = 250;
export const REFERRAL_HOLD_DAYS = 14;
export const REFERRAL_MAX_PER_MONTH = 4;
export const REFERRAL_ATTRIBUTION_DAYS = 30;
export const REWARD_MISSIONS = [
  {
    id: "first-purchase",
    label: "First eligible purchase",
    points: 100,
    description:
      "Recorded automatically after a verified eligible payment. Reversed if refunded or disputed.",
  },
  {
    id: "read-the-brief",
    label: "Read a weekly brief",
    points: 25,
    description:
      "Planned. No points are claimable until reading verification is implemented.",
  },
  {
    id: "bring-a-researcher",
    label: "Refer a collaborator",
    points: 250,
    description:
      "A qualifying first purchase, a 14-day hold and a maximum of four rewards per 30 days. Research materials are excluded.",
  },
] as const;
const tierBasis = (points: number) =>
  Math.max(0, Number.isFinite(points) ? points : 0);
export function getTier(points: number) {
  return (
    [...REWARD_TIERS]
      .reverse()
      .find(tier => tierBasis(points) >= tier.minPoints) ?? REWARD_TIERS[0]
  );
}
export function getNextTier(points: number) {
  return REWARD_TIERS.find(tier => tier.minPoints > tierBasis(points)) ?? null;
}
export function getTierProgress(points: number) {
  const current = getTier(points),
    next = getNextTier(points);
  if (!next) return 100;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((tierBasis(points) - current.minPoints) /
          (next.minPoints - current.minPoints)) *
          100
      )
    )
  );
}
export function getTierBenefits(tierId: string) {
  const tier = REWARD_TIERS.find(item => item.id === tierId) ?? REWARD_TIERS[0];
  return [
    { label: "Protected purchase and points history", available: true },
    { label: "Personal referral code and activity record", available: true },
    { label: `${tier.label} recognition in your account`, available: true },
    {
      label: "Additional discounts, early access and member events",
      available: false,
    },
  ];
}
