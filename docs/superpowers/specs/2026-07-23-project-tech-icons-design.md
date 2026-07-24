# Per-project technology icons

## Context

The Projects and Experiments sections list each repo with a title, one-line description, and an expandable longer description, but give no visual indication of what each project is built with. The goal is a small, minimal row of monochrome technology icons under each entry's description, styled to match the site's existing neutral palette rather than each brand's real colors.

## Icon source

[Simple Icons](https://simpleicons.org) — the standard monochrome brand-logo SVG set. Icons are fetched once at build time and their raw `path` data is embedded directly in `index.html` (no CDN reference, no new runtime dependency, consistent with the site's self-hosted-everything convention and its `default-src 'self'` CSP).

## Per-project mapping

Derived from each repo's actual language breakdown and dependency manifests (`gh api repos/rabbive/<repo>/languages`, `pyproject.toml`/`requirements.txt`/`Cargo.toml`/`package.json`), not just the site's prose description:

| Project                  | Icons                            | Evidence                                                          |
| ------------------------ | -------------------------------- | ----------------------------------------------------------------- |
| echod                    | Python, Raspberry Pi, Espressif  | `esp32/` (ESP-IDF C firmware), `rpi/` (Python leaf/coordinator)   |
| ops-env                  | Python, FastAPI, Docker          | `pyproject.toml` deps; repo has a `Dockerfile`                    |
| schrodinger-mail         | Python, Flask, PostgreSQL        | `requirements.txt`: flask, sqlalchemy + psycopg2                  |
| devsignal                | Rust, Discord, Apple             | Cargo workspace; `discord-rich-presence` + `objc2-app-kit` crates |
| OpSignal                 | Python                           | Pure Python CLI/TUI, no framework deps                            |
| hybrid-movie-recommender | Python, scikit-learn, Next.js    | `scikit-surprise` core; `frontend/` is a Next.js app              |
| CogniZap                 | Svelte, TypeScript, Tailwind CSS | `package.json`: SvelteKit + TypeScript + Tailwind                 |

15 unique icons across 19 usage sites (Python repeats 5×).

## Implementation approach

Define each of the 15 unique icons once as an SVG `<symbol>` inside a single hidden sprite block (`<svg style="display:none" aria-hidden="true"><defs>...</defs></svg>`) placed near the top of `<body>`, alongside the existing `#star-field` container. Each usage site references its icon via `<svg class="h-3.5 w-3.5"><use href="#icon-<slug>"/></svg>`.

This avoids repeating the same icon's path data at every usage site (Python alone would otherwise repeat ~1.5KB five times, ~38KB total raw markup across all 19 instances vs. ~32KB with dedup) while staying pure static HTML — no JS, no build step, no new dependency. It's a small, deliberate deviation from the site's existing "duplicate inline SVG per instance" convention (e.g. the repeated chevron per list item), justified here specifically because of the repeat count.

## Markup and styling

Under each project's one-line description (`<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">...</p>`), add:

```html
<div class="mt-2 flex items-center gap-2.5 text-neutral-400 dark:text-neutral-500">
    <svg class="h-3.5 w-3.5">
        <title>Python</title>
        <use href="#icon-python"></use>
    </svg>
    <svg class="h-3.5 w-3.5">
        <title>FastAPI</title>
        <use href="#icon-fastapi"></use>
    </svg>
    <svg class="h-3.5 w-3.5">
        <title>Docker</title>
        <use href="#icon-docker"></use>
    </svg>
</div>
```

- Icons render at `h-3.5 w-3.5` (an existing size already used elsewhere on the site) in `text-neutral-400 dark:text-neutral-500` — muted, matching the site's secondary-text tone rather than each brand's real color, per the "minimal, matches our palette" requirement.
- Each `<svg>` carries a `<title>` child, giving it both a native hover tooltip and an accessible name — no extra `aria-label` needed.
- No layout shift risk: the row sits below the existing description text, doesn't affect the collapsible `.exp-body` mechanics.

## Verification

1. `npm run build` succeeds (rebuild + inline CSS — no CSS changes expected here since only Tailwind utility classes already in use are added, but run it to keep `index.html`'s inline `<style>` block in sync if anything shifts).
2. Visual check in browser, light + dark mode: icon rows appear under all 7 entries, correctly muted, no color bleed from brand palettes.
3. Hover each icon and confirm the native tooltip shows the tech name.
4. `npm run format:check` and `htmlhint index.html` pass.
