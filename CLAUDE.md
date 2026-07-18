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
- `robots.txt` and `sitemap.xml` contain a `https://REPLACE_WITH_YOUR_DOMAIN` placeholder to be swapped for the real domain before going live.

## Architecture

- **`index.html`** — the entire site: head/meta, all page sections (in order: Theme Toggle, Header, About, Projects, Experiments, Activity, Links, Footer), and one inline `<script>` at the bottom containing all JavaScript (vanilla, no dependencies).
- **`src/input.css`** — Tailwind entrypoint plus the handful of custom styles Tailwind utilities can't express: the `slideFadeUp` animation, the collapsible-entry transition (`.exp-body` / `.exp-chevron`, grid-rows animation), the contribution heatmap grid/cells/legend (`.heatmap-*`, with explicit `.dark` variants), and `prefers-reduced-motion` fallbacks.
- **`tailwind.config.js`** — content is only `./index.html`; dark mode is class-based (`class` on `<html>`); extends Inter as the sans font and a custom `neutral` palette.

### JavaScript behaviors (inline in `index.html`)

- **Theme toggle** — `setTheme('system' | 'light' | 'dark')` sets/removes the `dark` class on `<html>` and persists the choice in `localStorage` under `theme`; "system" follows `prefers-color-scheme`.
- **Collapsible entries** — `toggleExp(btn)` toggles `.open` on the nearest `.exp-body` and `.rotated` on the chevron; expansion animates via `grid-template-rows: 0fr → 1fr`.
- **GitHub contribution heatmap** — an IIFE fetches `https://github-contributions-api.jogruber.de/v4/rabbive?y=last`, renders a GitHub-style week/day grid sized to the available width (recomputed on resize, debounced), with a tooltip on hover/focus and cells linking to the profile. The section starts `hidden` and stays hidden if the fetch fails — the heatmap is supplementary, so failures are silent by design.

## Styling conventions

- Everything is styled with Tailwind utility classes directly in the HTML; only add rules to `src/input.css` when a utility genuinely can't express it (animations, the heatmap grid).
- Dark mode uses `dark:` variants throughout; any new custom CSS needs explicit `.dark` overrides (see the heatmap cells for the pattern).
- Icons are inline SVGs (Lucide-style, `stroke="currentColor"`, `aria-hidden="true"`) — no icon library.
- Motion should respect `prefers-reduced-motion` (existing animations already do).
