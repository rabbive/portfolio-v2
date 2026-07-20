# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal portfolio site for Ashwanth Kumaravel. It is a single static page — all markup, content, and JavaScript live in `index.html`. There is no framework, no bundler, no tests, and no lint setup. The only build step is compiling Tailwind CSS.

## Commands

```bash
npm install
npm run watch:css   # rebuild dist/output.css on change (development)
npm run build:css   # one-shot purged + minified build
```

Preview by opening `index.html` directly in a browser or serving the repo root with any static file server.

## Build & deploy conventions

- **`dist/output.css` is committed on purpose.** Static hosts serve the repo as-is without running `npm install`, so after any change to `index.html` (new Tailwind classes) or `src/input.css`, run `npm run build:css` and commit the regenerated `dist/output.css` alongside it.
- **Cache busting:** the stylesheet is linked as `dist/output.css?v=N` in `index.html`. Bump the version query when the CSS changes meaningfully.
- `robots.txt` and `sitemap.xml` point at the production domain `https://rabbive.dev`.
- **Fonts are self-hosted** in `fonts/` (Inter latin subsets, woff2) with `@font-face` rules in `src/input.css`; `index.html` preloads the 400/500 weights. Do not re-add Google Fonts links.
- **`_headers`** configures Cloudflare Pages caching (immutable for `dist/` + `fonts/`, one day for `og.png`) and security headers/CSP. The heatmap's contributions API origin must stay in `connect-src`, and `og-image.html` keeps its own relaxed CSP.
- **CI** (`.github/workflows/ci.yml`) runs on every push: fails if `dist/output.css` is stale vs. sources, then htmlhint + lychee link checks. LinkedIn/X are excluded from link checks (bot-blocked, flaky) — verify them manually. The `resume.pdf` exclusion is a TODO until the PDF is added.

## Architecture

- **`index.html`** — the entire site: head/meta (including OG/Twitter card tags and JSON-LD `Person` schema), all page sections (in order: Theme Toggle, Header, About, Projects, Experiments, Activity, Links, Footer), and one inline `<script>` at the bottom containing all JavaScript (vanilla, no dependencies).
- **`404.html`** — the Cloudflare Pages not-found page (minimal, same design language). `tailwind.config.js` scans `./*.html`, so its classes are included in the build.
- **`og.png` / `og-image.html`** — the 1200×630 social card and its HTML source; re-render with headless Chrome (`--screenshot --window-size=1200,630`) if it ever needs changes.
- **`src/input.css`** — Tailwind entrypoint plus the handful of custom styles Tailwind utilities can't express: the collapsible-entry transition (`.exp-body` / `.exp-chevron`, grid-rows animation), the contribution heatmap grid/cells/legend (`.heatmap-*`, with explicit `.dark` variants), and `prefers-reduced-motion` fallbacks.
- **`tailwind.config.js`** — content is only `./index.html`; dark mode is class-based (`class` on `<html>`); extends Inter as the sans font and a custom `neutral` palette.

### JavaScript behaviors (inline in `index.html`)

- **Theme toggle** — a small inline script in `<head>` applies the `dark` class before first paint (avoids a light-mode flash); `setTheme('system' | 'light' | 'dark')` handles clicks and persists the choice in `localStorage` under `theme`. "System" follows `prefers-color-scheme` and tracks live OS theme changes via a `matchMedia` listener.
- **Collapsible entries** — `toggleExp(btn)` toggles `.open` on the nearest `.exp-body` and `.rotated` on the chevron, and keeps the button's `aria-expanded` in sync; expansion animates via `grid-template-rows: 0fr → 1fr`.
- **GitHub contribution heatmap** — an IIFE fetches `https://github-contributions-api.jogruber.de/v4/rabbive?y=last` (cached in `localStorage` under `heatmap-v1` for 6 hours; stale cache is used as a fallback if the fetch fails), renders a GitHub-style week/day grid sized to the available width (recomputed on resize, debounced), with a tooltip on hover/focus and cells linking to the profile. The section starts `hidden` and stays hidden if there's no data — the heatmap is supplementary, so failures are silent by design.

## Styling conventions

- Everything is styled with Tailwind utility classes directly in the HTML; only add rules to `src/input.css` when a utility genuinely can't express it (animations, the heatmap grid).
- Dark mode uses `dark:` variants throughout; any new custom CSS needs explicit `.dark` overrides (see the heatmap cells for the pattern).
- Icons are inline SVGs (Lucide-style, `stroke="currentColor"`, `aria-hidden="true"`) — no icon library.
- Motion should respect `prefers-reduced-motion` (existing animations already do).
