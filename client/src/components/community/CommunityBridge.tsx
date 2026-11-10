import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Instagram,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { getCommunityConfig } from "@/lib/community";

function requestInstagramScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const instagramWindow = window as typeof window & {
      instgrm?: { Embeds?: { process?: () => void } };
    };
    if (instagramWindow.instgrm?.Embeds?.process) {
      resolve();
      return;
    }
    const existing = document.getElementById(
      "bioupgrade-instagram-embed"
    ) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    const timeout = window.setTimeout(
      () => reject(new Error("Instagram embed did not respond.")),
      10000
    );
    script.addEventListener(
      "load",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        clearTimeout(timeout);
        reject(new Error("Instagram embed was blocked."));
      },
      { once: true }
    );
    if (!existing) {
      script.id = "bioupgrade-instagram-embed";
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export default function CommunityBridge({
  compact = false,
}: {
  compact?: boolean;
}) {
  const config = getCommunityConfig();
  const [instagramConsent, setInstagramConsent] = useState(false);
  const [discordConsent, setDiscordConsent] = useState(false);
  const [instagramState, setInstagramState] = useState<
    "idle" | "loading" | "requested" | "error"
  >("idle");
  useEffect(() => {
    if (!instagramConsent || !config.instagramEmbedUrl) return;
    let current = true;
    setInstagramState("loading");
    requestInstagramScript()
      .then(() => {
        if (!current) return;
        (
          window as typeof window & {
            instgrm?: { Embeds?: { process?: () => void } };
          }
        ).instgrm?.Embeds?.process?.();
        setInstagramState("requested");
      })
      .catch(() => {
        if (current) setInstagramState("error");
      });
    return () => {
      current = false;
    };
  }, [instagramConsent, config.instagramEmbedUrl]);
  if (compact)
    return (
      <div className="mt-5 flex flex-wrap gap-x-5 text-xs">
        <Link
          href="/community#community-network"
          className="inline-flex min-h-11 items-center text-accent"
        >
          Instagram & Bioscience Discord →
        </Link>
        {config.instagramProfileUrl && (
          <a
            href={config.instagramProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-accent"
          >
            {config.instagramHandle}
          </a>
        )}
        {config.discordInviteUrl && (
          <a
            href={config.discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-accent"
          >
            Join Bioscience Discord
          </a>
        )}
      </div>
    );
  return (
    <section
      id="community-network"
      className="scroll-mt-24"
      aria-labelledby="community-network-title"
    >
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-accent">
        THE BIOSCIENCE NETWORK
      </p>
      <h2
        id="community-network-title"
        className="mt-4 text-[clamp(2rem,4vw,3rem)]"
      >
        Discover the signal.
        <br />
        Discuss the source.
      </h2>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
        Instagram is the entry point. Bioscience Discord is the place for longer
        conversations. Bioupgrade keeps the papers and offers structured
        educational work when a question needs a deeper, documented answer.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-border bg-white p-6 md:p-8">
          <Instagram aria-hidden="true" className="h-6 w-6 text-accent" />
          <h3 className="mt-5 text-2xl">Follow the research conversation.</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Short-form discoveries should lead to a paper—not replace one. Bring
            a post’s question into the library and check its methods and limits.
          </p>
          {config.instagramProfileUrl ? (
            <a
              href={config.instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 items-center gap-2 text-accent"
            >
              Open {config.instagramHandle}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : (
            <p
              role="status"
              className="mt-5 rounded-lg bg-background p-4 text-xs text-muted-foreground"
            >
              The official Instagram destination is awaiting confirmation. No
              unrelated account or follower count is presented as yours.
            </p>
          )}
          {config.instagramEmbedUrl && (
            <div className="mt-5 border-t border-border pt-5">
              {!instagramConsent ? (
                <button
                  type="button"
                  onClick={() => setInstagramConsent(true)}
                  className="btn-ghost min-h-12 px-5 text-xs"
                >
                  Load Instagram preview
                </button>
              ) : (
                <>
                  <blockquote
                    className="instagram-media min-w-0"
                    data-instgrm-permalink={config.instagramEmbedUrl}
                    data-instgrm-version="14"
                  >
                    <a
                      href={config.instagramEmbedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View the configured Instagram content
                    </a>
                  </blockquote>
                  <p
                    role="status"
                    className="mt-3 text-xs text-muted-foreground"
                  >
                    {instagramState === "loading"
                      ? "Requesting Instagram…"
                      : instagramState === "error"
                        ? "Instagram could not load. Use the direct link above."
                        : "Instagram may limit previews or disable embeds. The direct link remains available."}
                  </p>
                </>
              )}
            </div>
          )}
        </article>
        <article className="min-w-0 rounded-2xl border border-border bg-white p-6 md:p-8">
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-accent" />
          <h3 className="mt-5 text-2xl">Continue in Bioscience Discord.</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Bring the original citation, a specific question and the limitation
            worth discussing. Website paper cards can prepare a source-linked
            prompt for you to share yourself.
          </p>
          {config.discordInviteUrl ? (
            <a
              href={config.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 items-center gap-2 text-accent"
            >
              Join Bioscience Discord
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : (
            <p
              role="status"
              className="mt-5 rounded-lg bg-background p-4 text-xs text-muted-foreground"
            >
              The permanent Bioscience invite is not configured yet. We never
              guess an invite or display private conversations.
            </p>
          )}
          {config.discordWidgetUrl && (
            <div className="mt-5 border-t border-border pt-5">
              {!discordConsent ? (
                <button
                  type="button"
                  onClick={() => setDiscordConsent(true)}
                  className="btn-ghost min-h-12 px-5 text-xs"
                >
                  Load public Discord widget
                </button>
              ) : (
                <iframe
                  src={config.discordWidgetUrl}
                  title="Bioscience public Discord server widget"
                  width="350"
                  height="420"
                  className="h-[420px] w-full rounded-xl border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              )}
            </div>
          )}
        </article>
      </div>
      <p className="mt-5 flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
        />
        Third-party previews load only after you click. They contact Instagram
        or Discord and may use their cookies. This is not account linking, bot
        posting, private-channel access or a Signal Points mission.
      </p>
      <div className="mt-7 flex flex-wrap gap-5">
        <Link
          href="/research"
          className="inline-flex min-h-11 items-center text-sm text-accent"
        >
          Read the original papers →
        </Link>
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center text-sm text-accent"
        >
          Turn a question into scoped consulting →
        </Link>
      </div>
    </section>
  );
}
