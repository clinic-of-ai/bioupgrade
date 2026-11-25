/**
 * Curated snapshot of the Bioupgrade social presence for the landing page.
 * Only owner-confirmed figures and public posts belong here. Images are stored locally
 * under /images/community/ (Instagram CDN links expire), and each item links to the original post.
 */
export type CommunityStat = { value: string; label: string };
export type CommunityPost = {
  href: string;
  image: string;
  alt: string;
  caption: string;
};

/** Owner-confirmed audience figures, e.g. { value: "25k+", label: "on Instagram" }. */
export const COMMUNITY_STATS: readonly CommunityStat[] = [
  { value: "35k+", label: "on TikTok" },
  { value: "10k", label: "on Discord" },
];

/** Latest public posts, newest first (up to 6 are shown). */
export const COMMUNITY_FEED: readonly CommunityPost[] = [];

function tiktokUrl(value: string | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && /(^|\.)tiktok\.com$/.test(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** Public TikTok profile (set VITE_TIKTOK_PROFILE_URL); the card shows "opening soon" until set. */
export const TIKTOK_PROFILE_URL = tiktokUrl(
  import.meta.env?.VITE_TIKTOK_PROFILE_URL as string | undefined
);
