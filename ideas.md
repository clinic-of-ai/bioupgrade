# Bioupgrade — Design Spec (Reference-Driven)

This is a **reference-driven** build. The Planhat layout (`home.webp`) is the skeleton, and the
attached `DESIGN-getdesign-md.md` + `design-tokens-getdesign-md.json` are the **ground-truth design
system**. Fidelity to those tokens and the cinematic Planhat mood OVERRIDES any generic styling
instinct. The subject, however, is a **biopunk human-enhancement community**, not a SaaS tool.

## Ground-Truth Tokens (non-negotiable)

- **Background** `#000000` · **Text** `#ededed` · **Muted** `#999999` · **Border** `#0a0a0a`
- **Single accent** `#f5a623` (warm amber) — CTAs / highlights ONLY, used sparingly so it stays loud
- **Secondary accent** `#ffb1ee` — used very sparingly (hover/complement), never competes with amber
- **Heading font** `GeistPixel-Square` (pixel/square mono display), weight 400, letter-spacing -0.32px
- **Body font** `Geist` (variable, 100–900)
- **Mono** `Geist Mono` — for tags, meta lines, small labels (tag energy)
- 4px spacing grid; corners 6–16px on every interactive element
- Tinted/chromatic warm shadow `rgba(245,166,35,0.35) 0 2px 10px` for elevation; deep `rgba(0,0,0,0.16) 0 10px 28px` for hero layers
- NO bright white surfaces; NO sharp corners; NO badges/ribbons/ornaments not in the reference

### Fonts (self-hosted via @font-face, uploaded to webdev storage)
- GeistPixel-Square: `/manus-storage/GeistPixel-Square_9109d699.woff2`
- Geist (variable): `/manus-storage/Geist-Variable_060ac0de.woff2`
- Geist Mono (variable): `/manus-storage/GeistMono-Variable_6fb0e3fc.woff2`

## Vibe

Dark, cinematic, premium, editorial, a little subversive — frontier energy. **Avoid the sterile
clinical lab look at all costs**: no test-tubes, no blue medical gradients, no microscope clichés.
The visual language is *cinematic human close-ups, organic textures, wet-lab-meets-cyberpunk, film
grain, warm amber light against black*. The hero is a striking human portrait with an enhancement
edge (matching the energy of the Planhat goggles hero — mood, not content).

## Brand

- **Wordmark**: "Bioupgrade" in GeistPixel-Square, lowercase tracking, with a small amber square mark.
- **Signature color**: amber `#f5a623` on pure black — unmistakable.
- **Voice**: terse, confident, research-literate, a little defiant. No filler ("Welcome to our
  website" is banned). Headlines read like a changelog / lab note.

## Page Skeleton (landing, in order)

1. Nav — wordmark left; ghost links (Brief · Community · The Meta) + amber pill CTA "Book a call".
2. Hero — full-bleed cinematic portrait, dark overlay, mono "this week" tag, two-line oversized
   headline, subhead, amber primary CTA + ghost secondary.
3. Source strip — quiet credibility row (journals we read), mono type, muted.
4. Statement — two-tone headline ("Biofluency." in amber) + paragraph.
5. Three pillars — The Weekly Meta · The Lab · The Circle (dark cards, hover lift, amber index).
6. The Consultation — the offer; meta line; amber CTA → /book; supporting cinematic image.
7. Member voices — 2 large-quote testimonials.
8. Manifesto moment — full-width oversized editorial line, mostly type.
9. Final CTA band — headline + amber button → /book.
10. Footer — wordmark, link columns, copyright, educational disclaimer.

## /book page
Same theme. Slim nav. Left: recap "Research Strategy Session" + body + meta + 3 bullets. Right:
Cal.com inline embed (dark theme, brand color #f5a623), `data-cal-link="CAL_LINK_PLACEHOLDER"`.
Below embed: muted Stripe/Cal.com + educational disclaimer note.

## Interaction & Motion
- ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; UI transitions < 300ms.
- Buttons: `scale(0.97)` on active. Entrance: fade + 12px rise, staggered 40–70ms.
- Hero: slow grain/parallax feel; subtle amber glow behind focal point.
- Respect prefers-reduced-motion.

## Style Decisions
- Heading scale is intentionally LARGER than the token H1 (32px) for hero/manifesto editorial impact —
  the tokens describe the source's dense app UI; this is a marketing landing page, so display sizes
  scale up while keeping the GeistPixel-Square face, weight 400, and -0.32px tracking.

- Testimonials must never show placeholder names; when identities are private, use
  intentional anonymized attributions (e.g. "Founder, longevity startup · member since 2025").
- Every page, including /book, must carry at least one cinematic Bioupgrade atmosphere signal:
  warm amber glow, grain/texture, human/lab imagery, or dossier-style mono metadata.
- The wordmark is always lowercase `bioupgrade` in GeistPixel-Square with the amber square mark;
  it should never read like ordinary navigation text.
- A "lab note / changelog" dossier motif runs across the system: mono section coordinates
  (§01 THE THESIS, §02 WHAT YOU JOIN / THE STACK, §03 THE CONSULTATION, §04 MEMBER VOICES /
  FIELD NOTES, §05 THE MANIFESTO, §06 JOIN THE FRONTIER), amber numerals, restrained mono metadata.
