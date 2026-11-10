# Visual verification — Isomorphic Labs / Planhat refresh

- The exact user-provided Planhat-style image is now used as the landing hero from `/manus-storage/planhat-reference-hero_ee4ad5e3.webp`.
- The hero uses a strong mint-to-transparent wash so the supplied image remains visible on the right while its embedded reference headline does not compete with Bioupgrade copy on the left.
- The mobile landing page stacks cleanly: hero, source strip, thesis, three image cards, consultation, member voices, manifesto, CTA, and footer.
- The mobile `/book` page keeps the recap and calendar readable, with the collaborators image, white booking surface, and green metadata accents.
- Desktop `/` and `/book` are responsive with no visible horizontal overflow; the two-column booking layout is preserved at wide widths.
- Consultation image uses eager loading to avoid an empty framed panel during full-page capture.
- TypeScript check and production build completed successfully after the restyle. Remaining build note is only the existing large JS chunk warning.

## Design decision

Keep the visual system light mint / forest / signal green, while allowing the hero and section images to carry the warmer golden Planhat atmosphere. This preserves the requested Isomorphic Labs palette without flattening the supplied reference image.
