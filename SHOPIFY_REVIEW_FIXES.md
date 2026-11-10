# Shopify review fix receipt

At08:14UTC on10November2026, F1–F3 were corrected in the new canonical source. Clear uses the actual returned state and preserves remaining lines/warnings; update rejects same-variant aggregate overflow before a provider mutation; initial create/add performs a same-origin read-back and blocks repeated blind creates after missing/mismatched secure-cookie continuity. No plaintext/private-ID storage or mutation retries were added.

The focused final fixture run passes157cases across5files, including22added cases and one corrected old static clear assumption. Source and test-source types pass. The fixes used only fake provider transports and isolated cookie jars, not live Shopify/DB writes or a second broad review.

The parent separately diagnosed a new development-only public-page500 as `React is not defined` under the inherited JSX-preserve setting. The source now uses React’s automatic JSX compiler runtime; the affected rendering path is rechecked before the final build/checkpoint. Combined build/HTTP/browser/publication evidence belongs in VERIFICATION.md, not inferred from this receipt.
