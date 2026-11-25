import type React from "react";
import { ArrowUpRight, Clapperboard, Instagram, MessagesSquare } from "lucide-react";
import Reveal from "@/components/Reveal";
import { getCommunityConfig } from "@/lib/community";
import {
  COMMUNITY_FEED,
  COMMUNITY_STATS,
  TIKTOK_PROFILE_URL,
} from "@/lib/community-feed";

/* §07 — The Collective: the community and founders, plus the live social channels.
 * Channels, figures and posts render only once the owner has confirmed them.
 */
export default function Collective() {
  const config = getCommunityConfig();
  const posts = COMMUNITY_FEED.slice(0, 6);
  return (
    <section
      id="collective"
      className="scroll-mt-20 border-t border-accent/20 bg-[#e3f3e5]"
    >
      <div className="container py-28 md:py-36">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="mono text-xs tracking-[0.22em] text-accent">
                <span className="text-foreground/35">§07 / </span>THE COLLECTIVE
                <span className="ml-3 text-foreground/30">// makers, not spectators</span>
              </p>
              <h2 className="mt-4 text-[clamp(2rem,5vw,3.6rem)] leading-[1.02]">
                A crucible for the curious.
                <br />
                <span className="text-accent">Growing every day.</span>
              </h2>
            </Reveal>
            <Reveal delay={90}>
              <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-foreground/70 md:text-[17px]">
                Bioupgrade is H+ in practice: a fast-growing community of
                chemonauts, bio-engineers, athletes, founders and academic nerds
                who dive deep into the science to reach their excellence. We
                share papers, compare results, build with AI and push each other
                past what we thought was possible. Every new study gets read,
                argued over and stress-tested in the open.
              </p>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-foreground/70 md:text-[17px]">
                It was founded by avant-garde biotechnologists, biochemists,
                neurologists and pharmacologists with a single aim: bring the most
                advanced technologies, from AI to molecular design, together with
                the most curious minds, and work out what the next evolutionary
                step for humans looks like.
              </p>
            </Reveal>
            {COMMUNITY_STATS.length > 0 && (
              <Reveal delay={140}>
                <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
                  {COMMUNITY_STATS.map(stat => (
                    <div key={stat.label}>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd className="text-[clamp(2rem,4vw,3rem)] leading-none text-foreground">
                        {stat.value}
                      </dd>
                      <p className="mono mt-2 text-[11px] tracking-[0.18em] text-foreground/55">
                        {stat.label.toUpperCase()}
                      </p>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </div>
          <div className="flex flex-col gap-4 md:col-span-5 md:pt-10">
            <Reveal delay={120}>
              <ChannelCard
                icon={<Clapperboard aria-hidden="true" className="h-6 w-6 text-accent" />}
                title="TikTok"
                body="The daily signal: new papers, mechanisms and results, broken down fast."
                href={TIKTOK_PROFILE_URL}
                cta="Follow on TikTok"
              />
            </Reveal>
            <Reveal delay={180}>
              <ChannelCard
                icon={<MessagesSquare aria-hidden="true" className="h-6 w-6 text-accent" />}
                title="Bioscience Discord"
                body="Where the deep dives happen: protocol threads, paper clubs and direct access to the team."
                href={config.discordInviteUrl}
                cta="Join the Discord"
              />
            </Reveal>
            {config.instagramProfileUrl && (
              <Reveal delay={220}>
                <ChannelCard
                  icon={<Instagram aria-hidden="true" className="h-6 w-6 text-accent" />}
                  title="Instagram"
                  body="Visual breakdowns of molecules, mechanisms and new research."
                  href={config.instagramProfileUrl}
                  cta={config.instagramHandle ? `Follow ${config.instagramHandle}` : "Follow us"}
                />
              </Reveal>
            )}
          </div>
        </div>
        {posts.length > 0 && (
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-6">
            {posts.map((post, index) => (
              <Reveal key={post.href} delay={index * 50}>
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-[12px] border border-accent/25 bg-white"
                >
                  <img
                    src={post.image}
                    alt={post.alt}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <p className="line-clamp-2 p-3 text-xs leading-snug text-foreground/70">
                    {post.caption}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ChannelCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string | null;
  cta: string;
}) {
  return (
    <article className="rounded-2xl border border-accent/30 bg-white p-6 md:p-7">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-[20px]">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/70">{body}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-5 inline-flex min-h-11 items-center gap-2 px-5 text-[13px]"
        >
          {cta} <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      ) : (
        <p className="mono mt-5 text-[11px] tracking-[0.16em] text-foreground/45">
          LINK OPENING SOON
        </p>
      )}
    </article>
  );
}
