import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { resolveCommunityConfig } from "../shared/community-config";
import { createDiscussionPrompt } from "../shared/discussion-prompt";
import { CONSULTING_PROFILES } from "../shared/consulting";
import { PRODUCTS } from "../shared/products";
import CommunityBridge from "../client/src/components/community/CommunityBridge";
import ShareReadingPrompt from "../client/src/components/community/ShareReadingPrompt";

const source = {
  title: "A public research paper",
  url: "https://doi.org/10.1000/example",
  doi: "10.1000/example",
  finding: "A bounded reported finding",
  limitation: "A different model is not equivalent",
};
describe("public social destination boundaries", () => {
  it("has no guessed account, invite, follower count or widget by default", () => {
    expect(resolveCommunityConfig()).toEqual({
      instagramProfileUrl: null,
      instagramEmbedUrl: null,
      instagramHandle: null,
      discordInviteUrl: null,
      discordWidgetUrl: null,
    });
  });
  it("normalises configured HTTPS profile destinations without tracking query data", () => {
    const config = resolveCommunityConfig({
      instagramProfileUrl:
        "https://instagram.com/confirmed_science/?utm_source=test#about",
    });
    expect(config.instagramProfileUrl).toBe(
      "https://www.instagram.com/confirmed_science/"
    );
    expect(config.instagramHandle).toBe("@confirmed_science");
    expect(config.instagramEmbedUrl).toBe(config.instagramProfileUrl);
  });
  it("does not present a post as a profile or allow executable/unrelated destinations", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://instagram.com/science/",
      "https://instagram.com.evil.test/science/",
      "https://user:pass@instagram.com/science/",
      "https://instagram.com:8443/science/",
      "https://instagram.com/p/abc/",
      "https://instagram.com/accounts/",
      "https://example.com/science/",
    ])
      expect(
        resolveCommunityConfig({ instagramProfileUrl: url }).instagramProfileUrl
      ).toBeNull();
  });
  it("requires a valid profile before offering a configured post embed", () => {
    expect(
      resolveCommunityConfig({
        instagramEmbedUrl: "https://www.instagram.com/p/abc123/",
      }).instagramEmbedUrl
    ).toBeNull();
    expect(
      resolveCommunityConfig({
        instagramProfileUrl: "https://instagram.com/confirmed_science/",
        instagramEmbedUrl: "https://instagram.com/reel/abc123/?tracking=1",
      }).instagramEmbedUrl
    ).toBe("https://www.instagram.com/reel/abc123/");
  });
  it("accepts only Discord invite hosts and normalises explicit invite paths", () => {
    expect(
      resolveCommunityConfig({
        discordInviteUrl:
          "https://discord.com/invite/ConfirmedCode?utm_source=test",
      }).discordInviteUrl
    ).toBe("https://discord.gg/ConfirmedCode");
    for (const url of [
      "https://discord.gg.evil.test/abc",
      "https://discord.com/channels/123/456",
      "javascript:alert(1)",
      "https://user:pass@discord.gg/abc",
    ])
      expect(
        resolveCommunityConfig({ discordInviteUrl: url }).discordInviteUrl
      ).toBeNull();
  });
  it("requires both a real invite configuration and well-formed server ID for the widget", () => {
    expect(
      resolveCommunityConfig({ discordServerId: "123456789012345678" })
        .discordWidgetUrl
    ).toBeNull();
    expect(
      resolveCommunityConfig({
        discordInviteUrl: "https://discord.gg/ConfirmedCode",
        discordServerId: "not-an-id",
      }).discordWidgetUrl
    ).toBeNull();
    expect(
      resolveCommunityConfig({
        discordInviteUrl: "https://discord.gg/ConfirmedCode",
        discordServerId: "123456789012345678",
      }).discordWidgetUrl
    ).toBe("https://discord.com/widget?id=123456789012345678&theme=light");
  });
});
describe("manual discussion and public rendering", () => {
  it("keeps the original source, finding and limitation together", () => {
    const text = createDiscussionPrompt(source, "Which endpoint matters?");
    for (const value of [
      source.title,
      source.url,
      source.doi,
      source.finding,
      source.limitation,
      "Which endpoint matters?",
    ])
      expect(text).toContain(value);
    expect(text).toContain("not personal treatment");
  });
  it("rejects unsafe source links rather than creating a working share action", () => {
    expect(() =>
      createDiscussionPrompt({ title: "bad", url: "javascript:alert(1)" })
    ).toThrow();
    expect(() =>
      createDiscussionPrompt({
        title: "bad",
        url: "https://user:pass@example.test/",
      })
    ).toThrow();
  });
  it("bounds the local user question without sending it anywhere", () => {
    expect(createDiscussionPrompt(source, "x".repeat(1600))).toContain(
      `Question: ${"x".repeat(1200)}`
    );
    expect(createDiscussionPrompt(source, "x".repeat(1600))).not.toContain(
      "x".repeat(1201)
    );
  });
  it("has no third-party iframe/script in the initial community markup", () => {
    const markup = renderToStaticMarkup(
      createElement(Router, {
        ssrPath: "/community",
        ssrSearch: "",
        children: createElement(CommunityBridge),
      })
    );
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("<script");
    expect(markup).toContain("Third-party previews load only after you click");
    expect(markup).not.toContain("25k");
    expect(markup).not.toContain("instagram.com/bio.science");
  });
  it("renders explicit share buttons and no posted/awarded success claim", () => {
    const markup = renderToStaticMarkup(
      createElement(ShareReadingPrompt, { source })
    );
    expect(markup).toContain("Copy discussion prompt");
    expect(markup).toContain("Share source");
    expect(markup).toContain("manus-no-record");
    expect(markup).toContain("No automatic posting");
    expect(markup).not.toContain("Prompt copied");
  });
  it("keeps the four existing offer IDs, prices and quote-only flags separate from public consulting copy", () => {
    expect(CONSULTING_PROFILES.map(p => p.id)).toEqual(PRODUCTS.map(p => p.id));
    expect(PRODUCTS.map(p => p.amountEur)).toEqual([200, 850, 2800, 1200]);
    expect(PRODUCTS.map(p => p.checkoutEnabled)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    for (const profile of CONSULTING_PROFILES) {
      expect(profile.prework.length).toBeGreaterThan(0);
      expect(profile.outcomes.length).toBeGreaterThan(0);
      expect(
        profile.scopeLimits.some(
          limit => /^No\b/i.test(limit) && /diagnosis/i.test(limit)
        )
      ).toBe(true);
    }
  });
});
