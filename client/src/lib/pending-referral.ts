const KEY = "bioupgrade.pending-referral";
const TEN_MINUTES_MS = 10 * 60 * 1000;
const valid = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{8,32}$/.test(value);
export function rememberReferral(code: string) {
  if (!valid(code)) return;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ code, expiresAt: Date.now() + TEN_MINUTES_MS })
    );
  } catch {
    /* Optional intent, never authentication state. */
  }
}
export function forgetReferral() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* Storage can be unavailable. */
  }
}
export function pendingReferral(): string {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw || raw.length > 256) return "";
    const data = JSON.parse(raw);
    if (
      valid(data.code) &&
      typeof data.expiresAt === "number" &&
      data.expiresAt > Date.now() &&
      data.expiresAt <= Date.now() + TEN_MINUTES_MS
    )
      return data.code;
    forgetReferral();
  } catch {
    forgetReferral();
  }
  return "";
}
