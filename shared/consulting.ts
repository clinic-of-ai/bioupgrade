import profiles from "./consulting-profiles.json";
export type ConsultingProfile = {
  id: string;
  targetAudience: string;
  bestFor: string;
  prework: string[];
  outcomes: string[];
  scopeLimits: string[];
  process: string[];
  bookingCta: string;
};
export const CONSULTING_PROFILES = profiles as ConsultingProfile[];
export const getConsultingProfile = (id: string) =>
  CONSULTING_PROFILES.find(profile => profile.id === id);
