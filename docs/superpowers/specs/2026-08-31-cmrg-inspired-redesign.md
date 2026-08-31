# cmrg-inspired redesign — spec

**Date:** 2026-08-31
**Reference site:** https://www.cmrg.me (Rafael Camargo). Dark-only, Next.js + Tailwind v4.
**Target:** `rabbive.dev` — static single-page site, Tailwind v3.4, light + dark.

## Why

The current site is correct but cold and generic: cool-grey `neutral` ramp, one font
(Inter) at two weights, flat `text-decoration` underlines, no personality beyond the
star field. cmrg.me solves the same "one-page personal site" problem with a warm
palette, a three-font system, hand-drawn marker underlines, and a handful of live
"this is a real person, right now" data points. We adopt those, in our own content.

## Decisions already made (do not re-litigate)

| Question | Decision |
| --- | --- |
| Dark-only, like cmrg? | **No.** Keep the theme toggle. Warm palette applies to **both** light and dark. |
| Guestbook | **Skipped.** Requires a datastore; site stays 100% static. |
| Attention map (app-usage tracking) | **Skipped.** The existing GitHub contribution heatmap already covers "what I've been doing". |
| Fonts | **Instrument Serif** (display) + **Inter** (body, unchanged) + **Caveat** (handwritten asides). All OFL, self-hosted, subset with `pyftsubset`. |
| Cover art in the shelf section | **Skipped.** Text-only entries + pixel star ratings. Avoids committing copyrighted images and keeps `img-src 'self'`. |

## In scope

### A. Visual system

1. **Warm neutral palette.** Replace the cool `neutral` scale in `tailwind.config.js`
   with cmrg's warm brown-tinted ramp, extended to 12 steps. Light mode background
   becomes warm cream (`#fef8f2`), dark stays near-black but warm (`#13110f`).
2. **Three-font system.** Instrument Serif for the name and section headings; Inter
   400/500 for body (unchanged); Caveat for handwritten margin notes.
3. **Hand-drawn marker underlines.** A `.mark-u` utility that draws a rough,
   slightly-off-baseline burnt-orange stroke under a phrase mid-paragraph. Three
   stroke variants so repeated use doesn't look cloned. Not `text-decoration`.
4. **Amber glow highlight.** A `.hl` utility: translucent amber background, 1px amber
   ring, soft outer glow. Same amber drives `::selection`.
5. **Link treatment.** Real links keep a plain underline, but the decoration colour
   moves to the warm ramp. Marker underlines are decorative only and never used on
   an `<a>`.
6. **Dashed section rules.** Full-bleed 1px dashed horizontal rules between major
   sections, in the graph-paper spirit of cmrg's grid lines.
7. **Squared corners + 1px lift.** `rounded-xs` (0.125rem) as the default radius for
   new components; interactive cards get `hover:-translate-y-px active:translate-y-px`
   at 150ms.
8. **Skeleton loading state.** A `.skeleton` class (pulsing warm block, transparent
   text, `cursor: progress`) for the three async blocks: weather, distance, commit.
9. **Scroll fade mask.** Soft top/bottom mask on the shelf grid instead of a hard cut.

### B. Structure

10. **Verb nav.** A fixed bottom pill replacing noun navigation with verbs, matching
    the site's existing sections: `am / built / tried / did / reach`. Respects
    `env(safe-area-inset-bottom)`.
11. **Shelf section — "things that stayed".** Books, records, films, shows: title,
    year, one personal line, media-type icon, pixel-art 5-star rating. Static markup.

### C. Live data

12. **"now" paragraph.** Chennai local time (no network), current weather via
    Open-Meteo (no API key), the visitor's rough distance from Chennai derived from
    their IANA timezone (no network, no IP geolocation), and their viewport size
    echoed back.
13. **Footer commit line.** Latest commit age and `+N −M` diffstat from the GitHub API.
14. **Live tab title.** A status emoji prefix (`🟢` / `🌙`) on `document.title`,
    driven by Chennai local hour.
15. **Doubled-letter tagline.** The tagline renders doubled (`ii mmaakkee`) and
    resolves to normal on load, staggered per character.

## Out of scope

- Guestbook, attention map, cover art (see decisions table).
- Any backend, Cloudflare Pages Function, KV namespace, or `wrangler` dependency.
- Any third-party runtime script, iframe, analytics, or font CDN.
- Restructuring `index.html` into multiple files or introducing a framework.

## Non-functional requirements

- **No new runtime dependencies.** Build-time dev deps only.
- **CSP stays hash-based.** Every edit to an inline `<script>` invalidates its
  SHA-256 in `_headers`. A stale hash does not error — it silently kills the script.
  This is the single largest footgun in the whole change, so the plan ships an
  automated checker before touching any script.
- **New network origins must be added to `connect-src`:** `https://api.open-meteo.com`
  and `https://api.github.com`.
- **Every live-data block fails silently.** They are supplementary; a failed fetch
  hides the block rather than showing an error, matching the existing heatmap.
- **`prefers-reduced-motion` is honoured** by every new animation.
- **Both themes.** Every new custom CSS rule needs an explicit `.dark` override.
- **Copy style:** all-lowercase, matching the existing page.
- **Accessibility:** decorative marks are `aria-hidden`; the verb nav is a real
  `<nav>` with anchor links; async blocks are `aria-live="polite"` where they
  replace skeleton text.

## Success criteria

`npm run build && git diff --exit-code dist/output.css index.html`,
`npx htmlhint index.html 404.html`, `npm run format:check`, `npm test`, and
`npm run check:csp` all pass, and the page renders correctly in both themes at
375px and 1440px with JavaScript disabled (live blocks simply absent).
