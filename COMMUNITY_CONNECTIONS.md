# Instagram and Bioscience Discord connections

## Implemented website journey

The existing `/community` page connects **Instagram discovery → original paper → Bioscience Discord discussion → scoped educational consulting**. The footer points to the same community bridge. Paper cards and the local question builder provide **Copy discussion prompt** and **Share source** actions carrying the citation, reported finding and limitation together. Visitors decide where to paste or share; the website neither posts to Instagram/Discord nor verifies that a post occurred. These actions grant no Signal Points.

Configured external links open in a new tab without opener access. Instagram previews and the native public Discord widget load only after a visitor clicks the corresponding button. Before that, the bridge loads no Instagram SDK or Discord iframe. Loading an embed contacts that platform and may use its cookies. Closing the page or removing an embed does not erase earlier requests or cookies. Platform privacy rules apply.

## Pending destination confirmation

The owner described a 25k-follower account at `@bio.science`. A public check of `https://www.instagram.com/bio.science/` on 8 November 2026 returned a private school-science profile showing 38 followers. This may be a handle mismatch. No link, embed or 25k counter for that potentially unrelated account has been configured. The exact owned Instagram profile URL, permanent Bioscience Discord invite and optional widget server ID remain owner inputs. No invite or server ID is invented.

## Public configuration

Set these **public** settings on the original bound application for both the frontend build and serving process. Leave them empty until the destinations are confirmed:

```dotenv
VITE_INSTAGRAM_PROFILE_URL=
VITE_INSTAGRAM_EMBED_URL=
VITE_DISCORD_INVITE_URL=
VITE_DISCORD_WIDGET_SERVER_ID=
```

`VITE_INSTAGRAM_PROFILE_URL` must be a direct HTTPS Instagram profile URL, not a login, Stories or explore page. An optional `VITE_INSTAGRAM_EMBED_URL` may identify a public post/Reel chosen by the owner; otherwise the profile is used. Configuration is not automated ownership or post-authorship verification. The profile/content must be public and allow Embeds. If Instagram blocks a preview, the direct profile link remains available.

`VITE_DISCORD_INVITE_URL` accepts the confirmed permanent `https://discord.gg/<code>` or `https://discord.com/invite/<code>` invite. The widget additionally requires the exact 17–20-digit server ID and an owner-enabled public widget under Discord Server Settings. The ID is not an invite and does not install a bot or grant private access. Confirm the destination and widget invitation/channel settings before enabling it.

Never put a bot token, webhook secret, client secret or access token in a `VITE_` variable. Rebuild/restart or republish through the original website’s authorised release process after public settings change. Build and runtime settings must match; otherwise client mounting can disagree with initial HTML. This recovered session is not attached to the original managed website, and no live social account connection has been applied here.

## Three connection levels

**Direct navigation and manual sharing — implemented in code.** Confirmed external links, paper-first prompts and consultation CTAs connect the audience without reading private discussions or collecting social identities.

**Consented public previews — implemented, pending configuration.** Native Instagram embeds and the public Discord widget add visible presence. Actual external rendering is unverified while destinations are missing. The widget is not a chat mirror; the site stores no member list or private conversation.

**Authenticated operations — a future option, not implemented.** Instagram publishing/analytics or a Discord bot/OAuth role flow needs current provider permissions, app ownership, secure server-side tokens, least-privilege access, documented consent and actual delivery tests. A Manus connector is not automatically a website backend integration. Public posts require approval of the payload; bot installations and permission changes need explicit authorisation. Private channel reading requires specific access and privacy permission. Do not harvest discussions by default or assume that Signal Points grant paid Discord roles.

## Official references

1. Meta for Developers, [“Embed an Instagram Post”](https://developers.facebook.com/documentation/instagram-platform/oembed), updated 15 May 2026. Current v26.0 examples support tokenless public post/profile oEmbed requests; do not rely on obsolete generic App Review/token requirements for basic public embedding. Embed metadata/content is for front-end display, not persistent ingestion or derived analytics.
2. Instagram Help, [“Embed an Instagram post or profile”](https://help.instagram.com/620154495870484/). Private accounts/content and Embeds-disabled profiles are unsupported.
3. Discord, [“Add the Discord widget to your site”](https://discord.com/blog/add-the-discord-widget-to-your-site). Owner-enabled widgets and invitation settings.
4. Discord Developers, [“Guild Resource”](https://docs.discord.com/developers/resources/guild). Public widget/image endpoints are distinct from authenticated guild/member/private-channel operations.
