export type CommunityConfigInput = {
  instagramProfileUrl?: string;
  instagramEmbedUrl?: string;
  discordInviteUrl?: string;
  discordServerId?: string;
};
export type CommunityConfig = {
  instagramProfileUrl: string | null;
  instagramEmbedUrl: string | null;
  instagramHandle: string | null;
  discordInviteUrl: string | null;
  discordWidgetUrl: string | null;
};

function safeHttps(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    return url;
  } catch {
    return null;
  }
}
export function resolveCommunityConfig(
  input: CommunityConfigInput = {}
): CommunityConfig {
  const rawProfile = safeHttps(input.instagramProfileUrl);
  const instagramHost = (url: URL) =>
    ["instagram.com", "www.instagram.com"].includes(url.hostname.toLowerCase());
  const match =
    rawProfile && instagramHost(rawProfile)
      ? rawProfile.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/)
      : null;
  const reserved = [
    "p",
    "reel",
    "reels",
    "stories",
    "accounts",
    "explore",
    "direct",
    "about",
    "developer",
    "legal",
  ];
  const username =
    match && !reserved.includes(match[1].toLowerCase()) ? match[1] : null;
  const instagramProfileUrl = username
    ? `https://www.instagram.com/${username}/`
    : null;
  const rawEmbed = safeHttps(input.instagramEmbedUrl);
  const embedPath = rawEmbed?.pathname.match(
    /^\/(p|reel)\/([A-Za-z0-9_-]+)\/?$/
  );
  const instagramEmbedUrl =
    instagramProfileUrl && rawEmbed && instagramHost(rawEmbed) && embedPath
      ? `https://www.instagram.com/${embedPath[1]}/${embedPath[2]}/`
      : instagramProfileUrl;
  const rawInvite = safeHttps(input.discordInviteUrl);
  const inviteMatch = rawInvite
    ? rawInvite.hostname === "discord.gg"
      ? rawInvite.pathname.match(/^\/([A-Za-z0-9_-]{2,64})\/?$/)
      : ["discord.com", "www.discord.com"].includes(rawInvite.hostname)
        ? rawInvite.pathname.match(/^\/invite\/([A-Za-z0-9_-]{2,64})\/?$/)
        : null
    : null;
  const discordInviteUrl = inviteMatch
    ? `https://discord.gg/${inviteMatch[1]}`
    : null;
  const serverId = input.discordServerId?.trim();
  const discordWidgetUrl =
    discordInviteUrl && serverId && /^\d{17,20}$/.test(serverId)
      ? `https://discord.com/widget?id=${serverId}&theme=light`
      : null;
  return {
    instagramProfileUrl,
    instagramEmbedUrl,
    instagramHandle: username ? `@${username}` : null,
    discordInviteUrl,
    discordWidgetUrl,
  };
}
