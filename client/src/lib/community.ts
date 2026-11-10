import { resolveCommunityConfig } from "@shared/community-config";

// These are public destination settings, never API/bot/OAuth credentials.
export function getCommunityConfig() {
  return resolveCommunityConfig({
    instagramProfileUrl:
      import.meta.env?.VITE_INSTAGRAM_PROFILE_URL ||
      (typeof process !== "undefined"
        ? process.env.VITE_INSTAGRAM_PROFILE_URL
        : undefined),
    instagramEmbedUrl:
      import.meta.env?.VITE_INSTAGRAM_EMBED_URL ||
      (typeof process !== "undefined"
        ? process.env.VITE_INSTAGRAM_EMBED_URL
        : undefined),
    discordInviteUrl:
      import.meta.env?.VITE_DISCORD_INVITE_URL ||
      (typeof process !== "undefined"
        ? process.env.VITE_DISCORD_INVITE_URL
        : undefined),
    discordServerId:
      import.meta.env?.VITE_DISCORD_WIDGET_SERVER_ID ||
      (typeof process !== "undefined"
        ? process.env.VITE_DISCORD_WIDGET_SERVER_ID
        : undefined),
  });
}
