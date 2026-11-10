# Consulting and community extension: implementation review

**Date:** 8 November 2026  
**Scope:** One read-only source pass of `/home/ubuntu/bioupgrade-recovered`, covering the final plan/TODO sections, requested community/consulting components and shared data, navigation/footer/research integration, public rendering and configuration example. Supporting calendar, checkout, eligibility and regression-test source was inspected. No project files were changed.

## Confirmed bugs

**None confirmed within this bounded review.** No corrective patch is proposed. This is a source-review result, not production or browser acceptance.

## Confirmed source behavior

- **Public destinations and consent:** `shared/community-config.ts:15–76` restricts destinations to canonical HTTPS Instagram profile/post/Reel and Discord invite/widget forms, rejects credentials and unrelated hosts, removes query/hash tracking and requires an invite plus a numeric server ID for the widget. Defaults and `.env.example:23–30` contain no active mismatched profile, guessed invite or follower counter. `CommunityBridge.tsx:59–84,165–253` starts with both consent flags false; Instagram script and Discord iframe are gated by visitor action. Instagram script failure/timeout retains a direct-link fallback. No supplied oEmbed HTML is injected.
- **Manual sharing and privacy:** `shared/discussion-prompt.ts:12–32` produces plain text with the original source, finding, limitation and educational boundary. All **21 current paper records** have HTTPS source URLs without credentials and nonempty limitations, confirmed by local JSON inspection. Clipboard/native sharing and manual-copy fallback use that same prompt (`ShareReadingPrompt.tsx:19–51`). No automatic posting or verified-post/reward claim is made. Share fallback text, community questions/drafts and the consulting worksheet are enclosed by `manus-no-record` ancestors; the parent’s worksheet correction is present at `ConsultingFit.tsx:194–197`.
- **Consulting selection and scope:** Both client routes derive selection from the URL, resolve absent/unknown IDs to the existing session and disclose unknown links. Prework and proposed outputs remain educational, explicitly subject to scope, capability and terms; human-performance protocols are excluded. Project routes show scope preparation without sending an enquiry or claiming a quote/reservation.
- **Billing and scheduling separation:** The four IDs and EUR amounts remain **200 / 850 / 2800 / 1200**, with only the session checkout-enabled (`shared/products.ts:20–73`). Server checkout uses shared authoritative pricing and rejects quote-only services (`server/checkout.ts:24–52`; `server/commerceRules.ts:41–50`). `Book.tsx:141–205` renders `CalEmbed` only for the session, never for a selected quoted project. Missing calendar/payment/intake services retain explicit unavailable states; no successful transaction is inferred.
- **Initial public HTML:** `server/public-pages.tsx:138–140,247–254` preserves the selected Book offer from the query, with deterministic fallback, readable scope/price and quote conditions. React text rendering and escaped document metadata avoid HTML injection; `/account` returns no public account body.

## Limits, not confirmed bugs

The owned Instagram URL and Discord invite/widget remain owner inputs; URL validation is not ownership, invitation-validity or account-size verification. Third-party previews were not exercised: Instagram has a script error/timeout state, while Discord retains the direct invite but does not detect cross-origin widget failure. No live connection, actual booking, payment, posting, bot/private-channel access or reward synchronization was verified or claimed.

No external calls, browser QA, migrations, live database/auth/payment operations, full suite or build were run by this reviewer. Existing test source was read, not re-executed; parent-reported check results and the parallel final check/build remain the parent’s evidence. The recovered source is still not attached to the original managed site, and this review does not establish publication.
