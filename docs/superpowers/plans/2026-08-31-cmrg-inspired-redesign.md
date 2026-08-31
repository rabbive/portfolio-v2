# cmrg-inspired redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the visual system and live-data flourishes of https://www.cmrg.me onto `rabbive.dev` — warm palette, three-font typography, hand-drawn marker underlines, amber glow highlights, a verb nav, a "things that stayed" shelf, and four live data blocks — without adding a framework, a backend, or a runtime dependency.

**Architecture:** The site stays a single static `index.html` with one inline `<script>`. Two new build-time pieces support that: `scripts/csp-hashes.js` (auto-syncs the hash-based CSP in `_headers`, removing the plan's biggest footgun) and `scripts/site-helpers.js` (pure functions — haversine, timezone lookup, weather labels, relative time — unit-tested with `node:test` and inlined into `index.html` at build time by an extended `scripts/inline-css.js`). Everything else is Tailwind utilities plus a handful of rules in `src/input.css`.

**Tech Stack:** Tailwind CSS v3.4.13 (`darkMode: 'class'`), vanilla ES2020, Node 22 with `node:test`, Prettier 3, `pyftsubset` (fontTools) for font subsetting, Cloudflare Pages for hosting.

**Spec:** `docs/superpowers/specs/2026-08-31-cmrg-inspired-redesign.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Tailwind v3.4.13, `darkMode: 'class'`.** Not v4. No `@theme`, no v4-only utilities (`rounded-xs`, `text-shadow-*`, `mask-*` do not exist — add them via `theme.extend` or `src/input.css`).
- **Both themes.** Every new custom CSS rule needs an explicit `.dark` override. Every new markup element needs `dark:` variants.
- **Build and commit together.** After any change to `index.html`, `src/input.css`, `tailwind.config.js`, or `scripts/site-helpers.js`, run `npm run build` and commit the regenerated `dist/output.css` **and** `index.html` in the same commit. CI runs `npm run build && git diff --exit-code dist/output.css index.html`.
- **Never hand-edit** the `<style data-inline-css>` block or the `<!-- site-helpers -->` block in `index.html`. Both are generated.
- **CSP is hash-based.** After Task 1, `npm run build` auto-fixes `_headers`; commit `_headers` alongside. Never hand-edit a `sha256-` value.
- **New network origins:** `https://api.open-meteo.com` and `https://api.github.com` go in `connect-src` (Task 12 and Task 14 respectively).
- **No runtime dependencies.** No new entries under `dependencies`. Dev deps only.
- **Live-data blocks fail silently.** On error, hide the block. Never render an error string.
- **`prefers-reduced-motion: reduce`** disables every new animation.
- **Copy is all lowercase**, matching the existing page.
- **Prettier:** 4-space indent, single quotes, 120 columns. Run `npm run format` before every commit.
- **Palette hexes are exact.** Copy them verbatim from Task 2; do not "improve" them.
- **`404.html` links `dist/output.css?v=N`.** Bump `N` once, in Task 17.

## File Structure

| File                           | Responsibility                                                                                                 | Status                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `scripts/csp-hashes.js`        | Pure functions: extract inline scripts, hash them, rewrite `_headers` CSP lines.                               | Create (Task 1)          |
| `scripts/csp-hashes.test.js`   | `node:test` unit tests for the above.                                                                          | Create (Task 1)          |
| `scripts/check-csp-hashes.js`  | CLI wrapper: verify (CI) or `--fix` (build).                                                                   | Create (Task 1)          |
| `scripts/site-helpers.js`      | Pure runtime helpers inlined into the page. Source of truth.                                                   | Create (Task 12)         |
| `scripts/site-helpers.test.js` | `node:test` unit tests for the helpers.                                                                        | Create (Task 12)         |
| `scripts/inline-css.js`        | Extended to also inline `site-helpers.js`.                                                                     | Modify (Task 12)         |
| `tailwind.config.js`           | Warm palette, three font families, `rounded-xs`.                                                               | Modify (Tasks 2, 3, 8)   |
| `src/input.css`                | `@font-face` rules, `.mark-u`, `.hl`, `.aside-note`, `.rule-dashed`, `.skeleton`, `.fade-edges`, shelf styles. | Modify (Tasks 3–11)      |
| `index.html`                   | All markup and the single inline behaviour script.                                                             | Modify (most tasks)      |
| `404.html`                     | Palette + font parity, `?v=` bump.                                                                             | Modify (Task 17)         |
| `_headers`                     | `connect-src` additions; CSP hashes auto-managed.                                                              | Modify (Tasks 1, 12, 14) |
| `package.json`                 | `test`, `check:csp` scripts; `build` gains the `--fix` step.                                                   | Modify (Tasks 1, 12)     |
| `.github/workflows/ci.yml`     | Run `npm test` and `npm run check:csp`.                                                                        | Modify (Task 1)          |
| `fonts/`                       | Subset Instrument Serif + Caveat woff2.                                                                        | Create (Task 3)          |

---

## Task 0: Create the working branch

**Files:** none

- [ ] **Step 1: Branch off main**

```bash
git fetch origin
git checkout -b feat/cmrg-redesign origin/main
git log --oneline -1
```

Expected: HEAD is at `6256c3d Wire up resume download and drop stale CI exclusion` (or newer `origin/main`).

- [ ] **Step 2: Confirm a clean baseline build**

```bash
npm install
npm run build
git diff --exit-code dist/output.css index.html && echo BASELINE_CLEAN
```

Expected: prints `BASELINE_CLEAN`. If it does not, stop — the committed CSS was already stale and that must be resolved before anything else.

---

## Task 1: CSP hash tooling (the safety net)

Every later task edits an inline `<script>`, which invalidates its SHA-256 in `_headers`. A stale hash does not error — the script silently stops running. Build this first so the rest of the plan cannot go wrong quietly.

**Files:**

- Create: `scripts/csp-hashes.js`
- Create: `scripts/csp-hashes.test.js`
- Create: `scripts/check-csp-hashes.js`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: nothing.
- Produces:
    - `collectInlineScripts(html: string) => string[]` — bodies of attribute-less `<script>` blocks, in document order.
    - `sha256Base64(text: string) => string` — returns `"sha256-<base64>"`.
    - `hashesFor(html: string) => string[]`
    - `rewriteHeaders(headers: string, hashesByPath: Record<string, string[]>) => string`
    - CLI: `node scripts/check-csp-hashes.js [--fix]`, exit 1 on mismatch when not fixing.

- [ ] **Step 1: Write the failing tests**

Create `scripts/csp-hashes.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { collectInlineScripts, sha256Base64, hashesFor, rewriteHeaders } = require('./csp-hashes.js');

const root = path.join(__dirname, '..');

test('collectInlineScripts ignores <script> tags that carry attributes', () => {
    const html = '<script type="application/ld+json">{"a":1}</script><script>let a = 1;</script>';
    assert.deepStrictEqual(collectInlineScripts(html), ['let a = 1;']);
});

test('collectInlineScripts returns bodies in document order', () => {
    const html = '<script>one</script>\n<script src="x.js"></script>\n<script>two</script>';
    assert.deepStrictEqual(collectInlineScripts(html), ['one', 'two']);
});

test('sha256Base64 matches the format openssl produces', () => {
    // printf 'let a = 1;' | openssl dgst -sha256 -binary | base64
    assert.strictEqual(sha256Base64('let a = 1;'), 'sha256-xY6QKfH9PRsQnLz56nj6MBwiK5oHg+im1Jkpdp1x/Ck=');
});

test('the committed _headers already covers every inline script (baseline guard)', () => {
    const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
    for (const file of ['index.html', '404.html']) {
        const html = fs.readFileSync(path.join(root, file), 'utf8');
        for (const hash of hashesFor(html)) {
            assert.ok(headers.includes(hash), `${file}: ${hash} missing from _headers`);
        }
    }
});

test('rewriteHeaders replaces sha256 tokens only in the matching path block', () => {
    const headers = [
        '/',
        "  Content-Security-Policy: script-src 'self' 'sha256-OLD1' 'sha256-OLD2'; img-src 'self'",
        '/404',
        "  Content-Security-Policy: script-src 'self' 'sha256-OLD1'; img-src 'self'",
    ].join('\n');
    const out = rewriteHeaders(headers, { '/': ['sha256-A', 'sha256-B'], '/404': ['sha256-A'] });
    assert.ok(out.includes("script-src 'self' 'sha256-A' 'sha256-B'; img-src 'self'"));
    assert.ok(out.includes("script-src 'self' 'sha256-A'; img-src 'self'"));
    assert.ok(!out.includes('OLD1'));
});

test('rewriteHeaders leaves CSP lines with no script-src untouched', () => {
    const headers = ['/og-image', "  Content-Security-Policy: default-src 'self'; img-src 'self' data:"].join('\n');
    assert.strictEqual(rewriteHeaders(headers, { '/og-image': ['sha256-A'] }), headers);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/csp-hashes.test.js`

Expected: FAIL — `Cannot find module './csp-hashes.js'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/csp-hashes.js`:

```js
// Computes the SHA-256 hashes that _headers' hash-based `script-src` needs, and
// rewrites those hashes in place. A stale hash never errors -- it silently stops
// the inline script from running -- so this is automated rather than manual.
const { createHash } = require('crypto');

// Only attribute-less <script> blocks: the JSON-LD block carries a type= and is
// never subject to script-src.
const INLINE_SCRIPT_RE = /<script>([\s\S]*?)<\/script>/g;

function collectInlineScripts(html) {
    return [...html.matchAll(INLINE_SCRIPT_RE)].map((m) => m[1]);
}

function sha256Base64(text) {
    return 'sha256-' + createHash('sha256').update(text, 'utf8').digest('base64');
}

function hashesFor(html) {
    return collectInlineScripts(html).map(sha256Base64);
}

// _headers is a flat file: an unindented path line, then indented header lines
// that apply to it. Walk it line by line, tracking the current path, and swap
// the sha256 tokens inside each script-src directive.
function rewriteHeaders(headers, hashesByPath) {
    let currentPath = null;
    return headers
        .split('\n')
        .map((line) => {
            if (line.length && !/^\s/.test(line) && !line.startsWith('#')) {
                currentPath = line.trim();
                return line;
            }
            if (!currentPath || !hashesByPath[currentPath]) return line;
            if (!/script-src\s/.test(line)) return line;
            const tokens = hashesByPath[currentPath].map((h) => `'${h}'`).join(' ');
            return line.replace(/(script-src[^;]*?)('sha256-[^;]*?)(?=\s*;|\s*$)/, (_, head) => {
                return head.replace(/\s+$/, '') + ' ' + tokens;
            });
        })
        .join('\n');
}

module.exports = { collectInlineScripts, sha256Base64, hashesFor, rewriteHeaders };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/csp-hashes.test.js`

Expected: PASS, 6/6.

- [ ] **Step 5: Write the CLI**

Create `scripts/check-csp-hashes.js`:

```js
// Verify (CI) or repair (--fix, run by `npm run build`) the hash-based
// script-src entries in _headers. See CLAUDE.md for why these matter.
const fs = require('fs');
const path = require('path');
const { hashesFor, rewriteHeaders } = require('./csp-hashes.js');

const root = path.join(__dirname, '..');
const fix = process.argv.includes('--fix');

// Cloudflare Pages serves these documents at both the clean URL and the .html
// path, so both blocks carry a CSP and both need the same hashes.
const PATH_TO_FILE = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/404': '404.html',
    '/404.html': '404.html',
};

const htmlCache = {};
const readHtml = (file) => (htmlCache[file] ??= fs.readFileSync(path.join(root, file), 'utf8'));

const hashesByPath = {};
for (const [urlPath, file] of Object.entries(PATH_TO_FILE)) {
    hashesByPath[urlPath] = hashesFor(readHtml(file));
}

const headersPath = path.join(root, '_headers');
const headers = fs.readFileSync(headersPath, 'utf8');

if (fix) {
    const next = rewriteHeaders(headers, hashesByPath);
    if (next !== headers) {
        fs.writeFileSync(headersPath, next);
        console.log('csp: updated script-src hashes in _headers');
    }
    process.exit(0);
}

let failed = false;
for (const [urlPath, hashes] of Object.entries(hashesByPath)) {
    for (const hash of hashes) {
        if (headers.includes(hash)) continue;
        failed = true;
        console.error(`csp: ${urlPath} (${PATH_TO_FILE[urlPath]}) is missing '${hash}' in _headers`);
    }
}

if (failed) {
    console.error('\nA stale hash does not error -- it silently stops the inline script from running.');
    console.error('Run `npm run build` (which fixes _headers) and commit the result.');
    process.exit(1);
}
console.log('csp: all inline script hashes present in _headers');
```

- [ ] **Step 6: Verify the CLI passes against the untouched repo, and catches a real break**

```bash
node scripts/check-csp-hashes.js
# Expected: "csp: all inline script hashes present in _headers", exit 0

cp _headers /tmp/_headers.bak
sed -i '' "s/sha256-zC+Trz8oSyv8EYao+zLHHAhyA2xpfaERiH5\/vGcreg8=/sha256-BROKEN/g" _headers
node scripts/check-csp-hashes.js; echo "exit=$?"
# Expected: two "missing" lines (/ and /index.html, plus /404 and /404.html), exit=1

node scripts/check-csp-hashes.js --fix
node scripts/check-csp-hashes.js
git diff --exit-code _headers && echo REPAIRED_TO_ORIGINAL
# Expected: "csp: updated ...", then a pass, then REPAIRED_TO_ORIGINAL
```

If `REPAIRED_TO_ORIGINAL` does not print, restore with `cp /tmp/_headers.bak _headers` and fix `rewriteHeaders` before continuing.

- [ ] **Step 7: Wire the scripts into package.json**

Replace the `scripts` block in `package.json` with:

```json
    "scripts": {
        "build": "npm run build:css && node scripts/inline-css.js && node scripts/check-csp-hashes.js --fix",
        "build:css": "tailwindcss -i ./src/input.css -o ./dist/output.css --minify",
        "watch:css": "tailwindcss -i ./src/input.css -o ./dist/output.css --watch",
        "check:csp": "node scripts/check-csp-hashes.js",
        "test": "node --test scripts/*.test.js",
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    },
```

- [ ] **Step 8: Wire the checks into CI**

In `.github/workflows/ci.yml`, change the CSS verification step to also cover `_headers`, and add a test step. Replace the `Verify committed CSS is up to date` step with:

```yaml
# dist/output.css, the inlined CSS in index.html, and the CSP hashes
# in _headers are all committed on purpose (see CLAUDE.md) -- fail if
# sources changed without a rebuild.
- name: Verify committed build output is up to date
  run: |
      npm run build
      git diff --exit-code dist/output.css index.html _headers

- name: Unit tests
  run: npm test

- name: Verify CSP hashes
  run: npm run check:csp
```

- [ ] **Step 9: Verify the full local pipeline**

```bash
npm run format
npm test && npm run check:csp && npm run build && git diff --exit-code dist/output.css index.html _headers && echo ALL_GREEN
```

Expected: `ALL_GREEN`.

- [ ] **Step 10: Commit**

```bash
git add scripts/csp-hashes.js scripts/csp-hashes.test.js scripts/check-csp-hashes.js package.json .github/workflows/ci.yml
git commit -m "build: automate CSP script-src hash sync in _headers"
```

---

## Task 2: Warm neutral palette

**Files:**

- Modify: `tailwind.config.js`
- Modify: `index.html` (body background/text classes)

**Interfaces:**

- Produces: the `neutral` scale below, plus `ember` and `amber` accents, available as Tailwind colour utilities to every later task.

- [ ] **Step 1: Replace the colour scale**

In `tailwind.config.js`, replace the entire `colors` block inside `theme.extend` with:

```js
            colors: {
                // Warm brown-tinted neutrals, ported from cmrg.me. Every step is
                // hue-shifted toward orange, so a "grey" here never reads cold.
                neutral: {
                    50: '#fef8f2',
                    100: '#f6f0eb',
                    150: '#f6ece4',
                    200: '#e9dfd7',
                    300: '#cfc3b9',
                    400: '#b7a89b',
                    500: '#948475',
                    600: '#6c6158',
                    700: '#3b3229',
                    800: '#2e2821',
                    850: '#28231f',
                    900: '#231e1a',
                    950: '#13110f',
                },
                // Burnt orange: hand-drawn marker underlines only.
                ember: {
                    300: '#f1b798',
                    400: '#e89068',
                    500: '#f1733d',
                },
                // Muted gold: highlights, ::selection, star ratings.
                amber: {
                    300: '#d4b98a',
                    400: '#ca9e66',
                    500: '#ba9659',
                    600: '#8e7347',
                },
            },
```

- [ ] **Step 2: Warm the page background**

In `index.html`, on the `<body>` element (line ~74), change `bg-white` to `bg-neutral-50` and `dark:bg-neutral-950` stays as-is (it now resolves to the warm `#13110f`). The full class list becomes:

```html
class="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100
text-sm antialiased selection:bg-amber-400/20 dark:selection:bg-amber-400/20"
```

- [ ] **Step 3: Update the theme-color meta tags**

In `index.html` (lines 33–34), replace both `<meta name="theme-color">` tags:

```html
<meta name="theme-color" content="#fef8f2" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#13110f" media="(prefers-color-scheme: dark)" />
```

- [ ] **Step 4: Sweep the remaining hard-coded whites**

```bash
grep -n 'bg-white\|dark:bg-neutral-950/80\|bg-white/80' index.html
```

For each hit, replace `bg-white` → `bg-neutral-50` and `bg-white/80` → `bg-neutral-50/80`. Leave `dark:` variants alone — they already point at the (now warm) `neutral` scale.

- [ ] **Step 5: Update the heatmap's hard-coded hexes**

The heatmap cells in `src/input.css` use literal cool-grey hexes that bypass the Tailwind scale. Replace them so the heatmap matches the new palette:

```css
.heatmap-cell {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background-color: #e9dfd7;
}

.heatmap-cell[data-level='1'] {
    background-color: #cfc3b9;
}
.heatmap-cell[data-level='2'] {
    background-color: #b7a89b;
}
.heatmap-cell[data-level='3'] {
    background-color: #948475;
}
.heatmap-cell[data-level='4'] {
    background-color: #3b3229;
}
```

and the dark block:

```css
.dark .heatmap-cell {
    background-color: #2e2821;
}
.dark .heatmap-cell[data-level='1'] {
    background-color: #3b3229;
}
.dark .heatmap-cell[data-level='2'] {
    background-color: #6c6158;
}
.dark .heatmap-cell[data-level='3'] {
    background-color: #b7a89b;
}
.dark .heatmap-cell[data-level='4'] {
    background-color: #f6f0eb;
}
```

Also update the two hover outline colours:

```css
.heatmap-cell[data-date]:hover,
.heatmap-cell[data-date]:focus-visible {
    outline-color: rgba(35, 30, 26, 0.5);
}

.dark .heatmap-cell[data-date]:hover,
.dark .heatmap-cell[data-date]:focus-visible {
    outline-color: rgba(246, 240, 235, 0.5);
}
```

- [ ] **Step 6: Build and verify visually**

```bash
npm run format && npm run build && npm run check:csp
```

Then open the page in a browser and confirm in **both** themes: the light background is warm cream (not white), the dark background is warm near-black (not blue-black), and the heatmap cells match. Toggle with the theme control in the top-right.

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js src/input.css index.html dist/output.css _headers
git commit -m "style: replace cool neutral scale with warm palette"
```

---

## Task 3: Self-host Instrument Serif and Caveat

**Files:**

- Create: `fonts/instrument-serif-400.v1.woff2`
- Create: `fonts/caveat-400.v1.woff2`
- Modify: `src/input.css`
- Modify: `tailwind.config.js`
- Modify: `index.html` (preloads)

**Interfaces:**

- Produces: Tailwind `font-display` (Instrument Serif) and `font-hand` (Caveat) utilities, used by Tasks 4 and 7.

- [ ] **Step 1: Download the upstream TTFs**

```bash
mkdir -p /tmp/fontsrc && cd /tmp/fontsrc
curl -sL -o InstrumentSerif-Regular.ttf \
  https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf
curl -sL -o 'Caveat[wght].ttf' \
  'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf'
ls -la
```

Expected: both files present and non-trivial in size (Instrument Serif ~70KB, Caveat ~180KB). Both are SIL Open Font License — no attribution is required in the page, but do not modify the licence terms.

- [ ] **Step 2: Pin Caveat's variable weight axis to 400**

Caveat ships as a variable font; we only ship one weight.

```bash
cd /tmp/fontsrc
python3 -m fontTools.varLib.instancer 'Caveat[wght].ttf' wght=400 -o Caveat-400.ttf
ls -la Caveat-400.ttf
```

Expected: `Caveat-400.ttf` created.

- [ ] **Step 3: Subset both to the Latin glyphs the site uses**

Match the existing Inter subsetting approach (latin only, no unused glyphs):

```bash
cd /tmp/fontsrc
REPO=/Users/ashwanthkumaravel/.bb/worktrees/env_qzizyrwx46/portfolio-v2
UNICODES='U+0020-007E,U+00A0,U+00B0,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026'

pyftsubset InstrumentSerif-Regular.ttf \
  --unicodes="$UNICODES" --layout-features='kern,liga' \
  --flavor=woff2 --output-file="$REPO/fonts/instrument-serif-400.v1.woff2"

pyftsubset Caveat-400.ttf \
  --unicodes="$UNICODES" --layout-features='kern,liga' \
  --flavor=woff2 --output-file="$REPO/fonts/caveat-400.v1.woff2"

ls -la "$REPO/fonts/"
```

Expected: both `.woff2` files under 20KB each. If either exceeds 30KB, narrow `--unicodes` to `U+0020-007E` and re-run.

- [ ] **Step 4: Add the `@font-face` rules**

In `src/input.css`, immediately after the two existing Inter `@font-face` blocks (before the `/* NOTE: only 400/500 ship ... */` comment), add:

```css
/* Display serif — headings and the name. Instrument Serif, SIL OFL, 400 only. */
@font-face {
    font-family: 'Instrument Serif';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/instrument-serif-400.v1.woff2') format('woff2');
}

/* Handwritten asides. Caveat, SIL OFL, variable axis instanced to 400. */
@font-face {
    font-family: 'Caveat';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/caveat-400.v1.woff2') format('woff2');
}
```

- [ ] **Step 5: Register the families with Tailwind**

In `tailwind.config.js`, replace the `fontFamily` block inside `theme.extend`:

```js
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
                hand: ['Caveat', 'ui-serif', 'cursive'],
            },
```

- [ ] **Step 6: Preload the display font only**

Instrument Serif is above the fold (the name); Caveat is not, so it stays unpreloaded. In `index.html`, after the two existing Inter preloads (line ~74), add:

```html
<link rel="preload" href="/fonts/instrument-serif-400.v1.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 7: Verify the fonts load**

```bash
npm run build
python3 -m http.server 8080 >/dev/null 2>&1 &
sleep 1
curl -sI http://localhost:8080/fonts/instrument-serif-400.v1.woff2 | head -1
curl -sI http://localhost:8080/fonts/caveat-400.v1.woff2 | head -1
kill %1
```

Expected: both return `200 OK`.

- [ ] **Step 8: Commit**

```bash
git add fonts/ src/input.css tailwind.config.js index.html dist/output.css _headers
git commit -m "feat: self-host Instrument Serif and Caveat"
```

---

## Task 4: Display serif on the name and section headings

**Files:**

- Modify: `index.html:282` (the `<h1>`), and every section `<h2>`

**Interfaces:**

- Consumes: `font-display` from Task 3.

- [ ] **Step 1: Restyle the name**

In `index.html`, replace the `<h1>` (line ~282):

```html
<h1 class="font-display text-3xl leading-none tracking-tight text-neutral-900 dark:text-neutral-100">
    ashwanth kumaravel
</h1>
```

- [ ] **Step 2: Restyle every section heading**

Each section `<h2>` currently reads:

```html
<h2 class="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 font-medium text-sm mb-4"></h2>
```

Replace **every** occurrence with:

```html
<h2 class="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 font-display text-xl mb-4"></h2>
```

```bash
# There are 6 of them (about, projects, experiments, activity, links, plus any added later).
grep -c 'font-display text-xl mb-4' index.html
```

Expected: `6`. If fewer, find the stragglers with `grep -n 'font-medium text-sm mb-4' index.html`.

- [ ] **Step 3: Size the heading icons to match**

The inline SVG inside each `<h2>` is `h-3.5 w-3.5`, sized for 14px text. Against a 20px serif heading it now looks undersized. Replace every occurrence of:

```html
class="h-3.5 w-3.5 shrink-0 text-neutral-600 dark:text-neutral-400"
```

with:

```html
class="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-500"
```

- [ ] **Step 4: Build and verify**

```bash
npm run format && npm run build && npx --yes htmlhint index.html 404.html
```

Then reload the page and confirm: the name and all six headings render in a high-contrast serif, not Inter, in both themes. If they render in Inter, the `@font-face` `src` path is wrong — check the browser devtools Network tab for a 404 on the woff2.

- [ ] **Step 5: Commit**

```bash
git add index.html dist/output.css _headers
git commit -m "style: set headings and name in Instrument Serif"
```

---

## Task 5: Hand-drawn marker underlines

**Files:**

- Modify: `src/input.css`
- Modify: `index.html` (About section prose)

**Interfaces:**

- Produces: `.mark-u`, `.mark-u-b`, `.mark-u-c` — decorative underline classes. Never apply to an `<a>`; real links keep `text-decoration`.

- [ ] **Step 1: Add the marker classes**

Append to `src/input.css`, after the `.theme-transition-off` block:

```css
/* Hand-drawn marker underlines. These are decorative background images, not
   text-decoration: the stroke wobbles off the baseline the way a real pen does,
   which underline-offset cannot express. Three variants so a paragraph with
   several marked phrases doesn't look copy-pasted. Never use on an <a> —
   links keep a real text-decoration so they stay recognisable as links. */
.mark-u,
.mark-u-b,
.mark-u-c {
    background-repeat: no-repeat;
    background-size: 100% 0.42em;
    background-position: 0 88%;
    padding-bottom: 0.06em;
}

.mark-u {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 12' preserveAspectRatio='none'%3E%3Cpath d='M2 8.5C34 5.4 76 4.2 120 5.1c28 .6 54 2.1 78 3.9' fill='none' stroke='%23f1733d' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E");
}

.mark-u-b {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 12' preserveAspectRatio='none'%3E%3Cpath d='M3 6.4C40 9.1 82 9.8 128 8.2c24-.8 46-2.2 69-4.1' fill='none' stroke='%23f1733d' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E");
}

.mark-u-c {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 12' preserveAspectRatio='none'%3E%3Cpath d='M2 7.2C46 4.1 90 3.6 134 5.4c22 .9 42 2.4 64 4.4' fill='none' stroke='%23e89068' stroke-width='2.6' stroke-linecap='round'/%3E%3C/svg%3E");
}

/* The stroke is a fixed orange in the SVG data URI (data URIs can't read CSS
   custom properties), so dark mode lightens it with a filter instead. */
.dark .mark-u,
.dark .mark-u-b,
.dark .mark-u-c {
    filter: saturate(0.85) brightness(1.08);
}
```

- [ ] **Step 2: Apply the marks to the About prose**

In `index.html`, in the About section (lines ~333–375), wrap key phrases. Replace the three prose paragraphs with:

```html
<p>
    tldr; final-year cs @ vit (grad 2027), <span class="mark-u">building systems + security infra</span>. open to
    new-grad sde roles.
</p>
<p>
    i like things that <span class="mark-u-b">hold up under load</span>, so i build them that way — a raft-inspired
    consensus protocol running across heterogeneous iot edge nodes, a post-quantum email client with a signed kem-dem
    architecture on nist-standardized algorithms, and an openenv-compatible eval harness with deterministic graders for
    agents.
</p>
<p>
    python, typescript, rust — whichever fits.
    <span class="mark-u-c">i write tests, i benchmark, i ship</span>.
</p>
```

- [ ] **Step 3: Build and verify**

```bash
npm run format && npm run build
```

Reload and confirm: three orange hand-drawn strokes appear under those phrases, each with a slightly different shape, and they sit just below the baseline rather than on it. Check both themes — in dark the stroke should read slightly brighter, not muddy.

- [ ] **Step 4: Verify the marks are not on links**

```bash
grep -n '<a[^>]*mark-u' index.html
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/input.css index.html dist/output.css _headers
git commit -m "feat: add hand-drawn marker underlines"
```

---

## Task 6: Amber glow highlight and selection colour

**Files:**

- Modify: `src/input.css`
- Modify: `index.html` (one highlighted phrase in About)

**Interfaces:**

- Produces: `.hl` — inline highlight with a soft amber glow.

- [ ] **Step 1: Add the highlight class**

Append to `src/input.css`, after the marker-underline block:

```css
/* Amber glow highlight. Translucent fill, a 1px ring, and a soft outer bloom —
   reads as emphasis without the flat highlighter-pen look of a plain
   background-color. Light mode needs a heavier fill to stay visible on cream. */
.hl {
    background-color: rgba(202, 158, 102, 0.22);
    border-radius: 0.25rem;
    padding: 0 0.2rem 0.1rem;
    box-shadow:
        0 0 0 1px rgba(202, 158, 102, 0.3),
        0 0 10px rgba(202, 158, 102, 0.2);
}

.dark .hl {
    background-color: rgba(202, 158, 102, 0.125);
    box-shadow:
        0 0 0 1px rgba(202, 158, 102, 0.19),
        0 0 10px rgba(202, 158, 102, 0.125);
}
```

- [ ] **Step 2: Highlight one phrase**

In `index.html`, in the About section's first paragraph, wrap the availability line — the one thing a recruiter should not miss:

```html
tldr; final-year cs @ vit (grad 2027), <span class="mark-u">building systems + security infra</span>.
<span class="hl">open to new-grad sde roles</span>.
```

- [ ] **Step 3: Build and verify**

```bash
npm run format && npm run build
```

Reload and confirm in both themes: the phrase sits in a rounded amber block with a visible ring and a soft glow, legible on cream and on near-black. The `::selection` colour (set in Task 2 via `selection:bg-amber-400/20`) should also read amber when you drag-select text.

- [ ] **Step 4: Commit**

```bash
git add src/input.css index.html dist/output.css _headers
git commit -m "feat: add amber glow highlight"
```

---

## Task 7: Handwritten margin notes

**Files:**

- Modify: `src/input.css`
- Modify: `index.html` (one note beside the About section)

**Interfaces:**

- Consumes: `font-hand` from Task 3.
- Produces: `.aside-note` — a Caveat annotation that floats into the right gutter on wide screens and falls back to an indented inline block below `1280px`.

- [ ] **Step 1: Add the aside class**

Append to `src/input.css`:

```css
/* Handwritten margin notes. The content column is max-w-xl (36rem) and centred,
   so a real gutter only exists on wide viewports — below 1280px the note falls
   back to an indented inline block rather than overlapping the prose. */
.aside-note {
    display: block;
    margin-top: 0.75rem;
    padding-left: 1rem;
    border-left: 1px solid #cfc3b9;
    font-family: 'Caveat', ui-serif, cursive;
    font-size: 1.125rem;
    line-height: 1.35;
    color: #948475;
}

.dark .aside-note {
    border-left-color: #3b3229;
    color: #b7a89b;
}

@media (min-width: 1280px) {
    .aside-note {
        position: absolute;
        left: calc(100% + 3rem);
        top: 0;
        width: 14rem;
        margin-top: 0;
        padding-left: 1rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .aside-note {
        transition: none;
    }
}
```

- [ ] **Step 2: Add the note**

The About `<section>` needs `relative` so the absolutely-positioned note anchors to it. In `index.html`, change the About section's opening tag (line ~333):

```html
<section class="relative mb-12"></section>
```

Then, immediately before that section's closing `</section>`, add:

```html
<span class="aside-note" aria-hidden="true"> yes, i really do read the raft paper for fun </span>
```

- [ ] **Step 3: Build and verify at two widths**

```bash
npm run format && npm run build
```

Reload at 1440px wide: the note sits in the right gutter, in handwriting, with a thin vertical rule. Narrow to 1000px: it drops below the prose as an indented block and does **not** overlap anything. Check both themes.

- [ ] **Step 4: Commit**

```bash
git add src/input.css index.html dist/output.css _headers
git commit -m "feat: add handwritten margin notes"
```

---

## Task 8: Dashed section rules, squared corners, and the 1px hover lift

**Files:**

- Modify: `tailwind.config.js`
- Modify: `src/input.css`
- Modify: `index.html`

**Interfaces:**

- Produces: `rounded-xs` Tailwind utility, `.rule-dashed` element, `.lift` interaction class.

- [ ] **Step 1: Add the `xs` radius to Tailwind**

In `tailwind.config.js`, inside `theme.extend`, add:

```js
            borderRadius: {
                xs: '0.125rem',
            },
```

- [ ] **Step 2: Add the dashed rule and lift classes**

Append to `src/input.css`:

```css
/* Full-bleed dashed rules between sections — graph-paper feel. The negative
   inline margin lets the rule run past the max-w-xl content column. */
.rule-dashed {
    height: 0;
    border: 0;
    border-top: 1px dashed #e9dfd7;
    margin: 2.5rem -1.5rem;
}

.dark .rule-dashed {
    border-top-color: #2e2821;
}

@media (min-width: 768px) {
    .rule-dashed {
        margin-left: -4rem;
        margin-right: -4rem;
    }
}

/* One-pixel lift on interactive cards. Deliberately tiny: it reads as a
   response, not an animation. */
.lift {
    transition:
        transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
        filter 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.lift:hover {
    transform: translateY(-1px);
}

.lift:active {
    transform: translateY(1px);
    filter: brightness(0.75);
}

@media (prefers-reduced-motion: reduce) {
    .lift {
        transition: none;
    }
    .lift:hover,
    .lift:active {
        transform: none;
    }
}
```

- [ ] **Step 3: Place the rules between sections**

In `index.html`, insert `<hr class="rule-dashed" />` immediately after the closing `</section>` of the About, Projects, Experiments, and Activity sections (four rules total — not after Links, which is followed by the footer, and not after the footer).

```bash
grep -c 'rule-dashed' index.html
```

Expected: `4`.

- [ ] **Step 4: Apply the lift to the two header buttons**

In `index.html`, on both the resume link and the "get in touch" link (lines ~287 and ~309), remove `active:scale-[0.98]` and `transition-all duration-200`, and add `lift`. The resume link's class becomes:

```html
class="lift inline-flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-2 font-medium text-neutral-900 shadow-sm
hover:bg-neutral-300"
```

and the "get in touch" link's:

```html
class="lift inline-flex items-center gap-2 rounded-full bg-neutral-50 dark:bg-neutral-900 px-4 py-2 font-medium
text-neutral-800 dark:text-neutral-100 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm hover:bg-neutral-100
hover:ring-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:ring-neutral-700"
```

- [ ] **Step 5: Build and verify**

```bash
npm run format && npm run build && npx --yes htmlhint index.html 404.html
```

Reload and confirm: four dashed rules run wider than the text column; both buttons lift 1px on hover and press down on click; the transition still respects reduced motion (test with macOS System Settings → Accessibility → Display → Reduce motion, or Chrome DevTools → Rendering → Emulate `prefers-reduced-motion`).

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js src/input.css index.html dist/output.css _headers
git commit -m "style: add dashed section rules and 1px hover lift"
```

---

## Task 9: Skeleton loading state

**Files:**

- Modify: `src/input.css`

**Interfaces:**

- Produces: `.skeleton` — applied by Tasks 12 and 14 to async blocks, removed once data lands.

- [ ] **Step 1: Add the skeleton class**

Append to `src/input.css`:

```css
/* Placeholder for the three async blocks (weather, distance, commit). Hides its
   own text and children so the real content can already be in the DOM. */
.skeleton {
    animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background-color: #e9dfd7;
    border-radius: 0.25rem;
    color: transparent;
    cursor: progress;
    user-select: none;
}

.dark .skeleton {
    background-color: #231e1a;
}

.skeleton > * {
    visibility: hidden;
}

@keyframes skeleton-pulse {
    50% {
        opacity: 0.5;
    }
}

@media (prefers-reduced-motion: reduce) {
    .skeleton {
        animation: none;
    }
}
```

- [ ] **Step 2: Verify it compiles into the bundle**

```bash
npm run build
grep -c 'skeleton-pulse' dist/output.css
```

Expected: `2` (the `animation:` reference and the `@keyframes` block).

- [ ] **Step 3: Commit**

```bash
git add src/input.css dist/output.css index.html _headers
git commit -m "feat: add skeleton loading state"
```

---

## Task 10: Verb navigation pill

**Files:**

- Modify: `index.html`

**Interfaces:**

- Produces: section `id` attributes `am`, `built`, `tried`, `did`, `reach` — anchor targets for the nav.

- [ ] **Step 1: Give the sections ids**

In `index.html`, add an `id` to each section's opening tag, matching the verb nav:

| Section (existing heading) | New opening tag                            |
| -------------------------- | ------------------------------------------ |
| About                      | `<section id="am" class="relative mb-12">` |
| Projects                   | `<section id="built" class="mb-16">`       |
| Experiments                | `<section id="tried" class="mb-16">`       |
| Activity                   | `<section id="did" class="mb-16">`         |
| Links                      | `<section id="reach" class="mb-16">`       |

```bash
grep -c 'section id="' index.html
```

Expected: `5`.

- [ ] **Step 2: Add the nav**

In `index.html`, immediately before `</body>` (before the closing `<script>` tag at line ~1423), add:

```html
<nav
    class="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-6"
    aria-label="sections"
>
    <ul
        class="flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 text-xs backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/80"
    >
        <li>
            <a
                class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                href="#am"
                >am</a
            >
        </li>
        <li aria-hidden="true" class="text-neutral-300 dark:text-neutral-700">/</li>
        <li>
            <a
                class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                href="#built"
                >built</a
            >
        </li>
        <li aria-hidden="true" class="text-neutral-300 dark:text-neutral-700">/</li>
        <li>
            <a
                class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                href="#tried"
                >tried</a
            >
        </li>
        <li aria-hidden="true" class="text-neutral-300 dark:text-neutral-700">/</li>
        <li>
            <a
                class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                href="#did"
                >did</a
            >
        </li>
        <li aria-hidden="true" class="text-neutral-300 dark:text-neutral-700">/</li>
        <li>
            <a
                class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                href="#reach"
                >reach</a
            >
        </li>
    </ul>
</nav>
```

- [ ] **Step 2b: Keep the nav from covering the last section**

The nav is fixed, so the page needs bottom padding. On `<main>` (line ~278), change `pt-24 px-6 md:px-0` to `pt-24 pb-32 px-6 md:px-0`.

- [ ] **Step 3: Smooth-scroll the anchors, respecting reduced motion**

Append to `src/input.css`:

```css
html {
    scroll-behavior: smooth;
    /* Fixed nav is at the bottom, but anchored headings still want breathing
       room above them when jumped to. */
    scroll-padding-top: 2rem;
}

@media (prefers-reduced-motion: reduce) {
    html {
        scroll-behavior: auto;
    }
}
```

- [ ] **Step 4: Build and verify**

```bash
npm run format && npm run build && npx --yes htmlhint index.html 404.html
```

Reload and confirm: a pill sits at the bottom centre in both themes; every verb scrolls to its section; the pill does not cover the Links section at the bottom of the page; on a phone-sized viewport the pill clears the home indicator.

- [ ] **Step 5: Commit**

```bash
git add index.html src/input.css dist/output.css _headers
git commit -m "feat: add fixed verb navigation"
```

---

## Task 11: "things that stayed" shelf section

**Files:**

- Modify: `index.html`
- Modify: `src/input.css`

**Interfaces:**

- Consumes: `.rule-dashed`, `.lift`, `rounded-xs` (Task 8); `font-display` (Task 3).
- Produces: SVG symbol `#icon-star-pixel`; section `id="kept"` (added to the Task 10 nav).

- [ ] **Step 1: Add the pixel star symbol**

In `index.html`, inside the existing hidden `<svg>` `<defs>` block (which ends around line 195, after `#icon-tailwindcss`), add:

```html
<symbol id="icon-star-pixel" viewBox="0 0 10 10">
    <path
        d="M4 0h2v2h2v1h1v1h1v2H8v1H7v1H6v1H4V8H3V7H2V6H0V4h1V3h1V2h2V0z"
        fill="currentColor"
        shape-rendering="crispEdges"
    />
</symbol>
```

- [ ] **Step 2: Add the shelf styles**

Append to `src/input.css`:

```css
/* Soft mask on the shelf grid instead of a hard edge, matching the scroll-fade
   idea on cmrg.me. Purely decorative — content stays fully readable. */
.fade-edges {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 2rem, #000 calc(100% - 2rem), transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0, #000 2rem, #000 calc(100% - 2rem), transparent 100%);
}
```

- [ ] **Step 3: Add the section markup**

In `index.html`, insert this section — plus a `<hr class="rule-dashed" />` after it — immediately before the Links section (`<section id="reach" ...>`):

```html
<section id="kept" class="mb-16">
    <h2 class="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 font-display text-xl mb-4">
        <svg
            class="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        things that stayed
    </h2>
    <p class="mb-4 text-neutral-600 dark:text-neutral-400">
        books and shows i remember for the question they left behind, not the plot.
    </p>
    <ul class="fade-edges grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <li class="lift rounded-xs">
            <p class="font-display text-lg text-neutral-900 dark:text-neutral-100">
                the pragmatic programmer<span class="text-neutral-500 dark:text-neutral-500">, 1999</span>
            </p>
            <p class="mt-0.5 text-neutral-600 dark:text-neutral-400">
                read it before i had written anything worth maintaining. reread it after, and it was a different book.
            </p>
            <p class="mt-1.5 flex items-center gap-1 text-amber-500" aria-label="rated 5 out of 5">
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
            </p>
        </li>
        <li class="lift rounded-xs">
            <p class="font-display text-lg text-neutral-900 dark:text-neutral-100">
                designing data-intensive applications<span class="text-neutral-500 dark:text-neutral-500">, 2017</span>
            </p>
            <p class="mt-0.5 text-neutral-600 dark:text-neutral-400">
                the reason the consensus protocol exists. chapter 9 cost me a semester and was worth it.
            </p>
            <p class="mt-1.5 flex items-center gap-1 text-amber-500" aria-label="rated 5 out of 5">
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
            </p>
        </li>
        <li class="lift rounded-xs">
            <p class="font-display text-lg text-neutral-900 dark:text-neutral-100">
                mr. robot<span class="text-neutral-500 dark:text-neutral-500">, 2015–2019</span>
            </p>
            <p class="mt-0.5 text-neutral-600 dark:text-neutral-400">
                the only show that got the terminal right, and the loneliness of it too.
            </p>
            <p class="mt-1.5 flex items-center gap-1 text-amber-500" aria-label="rated 4 out of 5">
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3 text-neutral-300 dark:text-neutral-800" aria-hidden="true">
                    <use href="#icon-star-pixel" />
                </svg>
            </p>
        </li>
        <li class="lift rounded-xs">
            <p class="font-display text-lg text-neutral-900 dark:text-neutral-100">
                the little prince<span class="text-neutral-500 dark:text-neutral-500">, 1943</span>
            </p>
            <p class="mt-0.5 text-neutral-600 dark:text-neutral-400">
                one of the first books i remember finishing in one sitting, and the only one i still quote at people.
            </p>
            <p class="mt-1.5 flex items-center gap-1 text-amber-500" aria-label="rated 4 out of 5">
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3" aria-hidden="true"><use href="#icon-star-pixel" /></svg>
                <svg class="h-3 w-3 text-neutral-300 dark:text-neutral-800" aria-hidden="true">
                    <use href="#icon-star-pixel" />
                </svg>
            </p>
        </li>
    </ul>
</section>

<hr class="rule-dashed" />
```

> Replace the four entries with your own if these aren't right — the markup shape is what matters, and each entry is self-contained.

- [ ] **Step 4: Add `kept` to the verb nav**

In the `<nav>` from Task 10, insert between the `tried` and `did` items:

```html
<li aria-hidden="true" class="text-neutral-300 dark:text-neutral-700">/</li>
<li>
    <a
        class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        href="#kept"
        >kept</a
    >
</li>
```

- [ ] **Step 5: Build and verify**

```bash
npm run format && npm run build && npx --yes htmlhint index.html 404.html
grep -c 'icon-star-pixel' index.html
```

Expected: `21` (1 symbol definition + 20 `<use>` references). Reload and confirm: two columns on desktop, one on mobile; stars render as blocky pixel shapes, gold for filled and faint for empty; the top and bottom of the grid fade softly; the `kept` verb appears in the nav and scrolls correctly.

- [ ] **Step 6: Commit**

```bash
git add index.html src/input.css dist/output.css _headers
git commit -m "feat: add 'things that stayed' shelf section"
```

---

## Task 12: Pure runtime helpers, unit-tested and inlined at build time

The "now" paragraph (Task 13) and the footer commit line (Task 14) need real logic — haversine distance, timezone lookup, WMO weather labels, relative time. That logic lives in a tested module and is inlined into `index.html` by the build, so it stays under test without adding a runtime script request.

**Files:**

- Create: `scripts/site-helpers.js`
- Create: `scripts/site-helpers.test.js`
- Modify: `scripts/inline-css.js`
- Modify: `index.html` (add the marker block)

**Interfaces:**

- Produces, on `window.helpers` in the browser and via `module.exports` in tests:
    - `haversineKm(a: {lat, lon}, b: {lat, lon}) => number` — great-circle km, unrounded.
    - `coordsForTimeZone(tz: string) => {lat, lon} | null`
    - `weatherLabel(code: number) => string` — WMO code to lowercase English.
    - `relativeTime(then: Date, now: Date) => string` — e.g. `'12 days ago'`, `'3 hours ago'`, `'just now'`.
    - `CHENNAI = { lat: 13.0827, lon: 80.2707 }`

- [ ] **Step 1: Write the failing tests**

Create `scripts/site-helpers.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { haversineKm, coordsForTimeZone, weatherLabel, relativeTime, CHENNAI } = require('./site-helpers.js');

test('haversineKm is zero for a point against itself', () => {
    assert.strictEqual(Math.round(haversineKm(CHENNAI, CHENNAI)), 0);
});

test('haversineKm matches a known distance (chennai to london, ~8250km)', () => {
    const london = { lat: 51.5074, lon: -0.1278 };
    const km = haversineKm(CHENNAI, london);
    assert.ok(km > 8000 && km < 8500, `expected ~8250, got ${km}`);
});

test('haversineKm is symmetric', () => {
    const tokyo = { lat: 35.6762, lon: 139.6503 };
    assert.strictEqual(haversineKm(CHENNAI, tokyo).toFixed(6), haversineKm(tokyo, CHENNAI).toFixed(6));
});

test('coordsForTimeZone resolves a known zone', () => {
    assert.deepStrictEqual(coordsForTimeZone('Asia/Kolkata'), { lat: 22.5726, lon: 88.3639 });
});

test('coordsForTimeZone returns null for an unknown zone', () => {
    assert.strictEqual(coordsForTimeZone('Mars/Olympus_Mons'), null);
});

test('weatherLabel maps the WMO codes the site can receive', () => {
    assert.strictEqual(weatherLabel(0), 'clear sky');
    assert.strictEqual(weatherLabel(2), 'partly cloudy');
    assert.strictEqual(weatherLabel(61), 'light rain');
    assert.strictEqual(weatherLabel(95), 'a thunderstorm');
});

test('weatherLabel falls back for an unrecognised code', () => {
    assert.strictEqual(weatherLabel(999), 'weather of some kind');
});

test('relativeTime describes recent, hourly, and daily gaps', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    assert.strictEqual(relativeTime(new Date('2026-08-31T11:59:30Z'), now), 'just now');
    assert.strictEqual(relativeTime(new Date('2026-08-31T11:00:00Z'), now), '1 hour ago');
    assert.strictEqual(relativeTime(new Date('2026-08-31T09:00:00Z'), now), '3 hours ago');
    assert.strictEqual(relativeTime(new Date('2026-08-30T12:00:00Z'), now), '1 day ago');
    assert.strictEqual(relativeTime(new Date('2026-08-19T12:00:00Z'), now), '12 days ago');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/site-helpers.test.js`

Expected: FAIL — `Cannot find module './site-helpers.js'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/site-helpers.js`. Note the UMD-ish tail: the same file is `require`d by tests and inlined verbatim into the page, where it attaches to `window.helpers`.

```js
// Pure helpers for the "now" paragraph and the footer commit line.
//
// This file is BOTH a CommonJS module (unit-tested with node:test) and the exact
// text that scripts/inline-css.js injects into index.html's <!-- site-helpers -->
// block. Keep it dependency-free and side-effect-free apart from the export tail.
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.helpers = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const CHENNAI = { lat: 13.0827, lon: 80.2707 };

    const EARTH_RADIUS_KM = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;

    function haversineKm(a, b) {
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lon - a.lon);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
    }

    // Coordinates of each IANA zone's namesake city. Deliberately coarse: this
    // exists so a visitor sees roughly how far away they are, and using the
    // timezone means no IP geolocation service, no extra request, and nothing
    // that could be called tracking.
    const TZ_COORDS = {
        'Asia/Kolkata': { lat: 22.5726, lon: 88.3639 },
        'Asia/Calcutta': { lat: 22.5726, lon: 88.3639 },
        'Asia/Dubai': { lat: 25.2048, lon: 55.2708 },
        'Asia/Karachi': { lat: 24.8607, lon: 67.0011 },
        'Asia/Dhaka': { lat: 23.8103, lon: 90.4125 },
        'Asia/Bangkok': { lat: 13.7563, lon: 100.5018 },
        'Asia/Singapore': { lat: 1.3521, lon: 103.8198 },
        'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694 },
        'Asia/Shanghai': { lat: 31.2304, lon: 121.4737 },
        'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 },
        'Asia/Seoul': { lat: 37.5665, lon: 126.978 },
        'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137 },
        'Australia/Sydney': { lat: -33.8688, lon: 151.2093 },
        'Australia/Melbourne': { lat: -37.8136, lon: 144.9631 },
        'Australia/Perth': { lat: -31.9523, lon: 115.8613 },
        'Pacific/Auckland': { lat: -36.8485, lon: 174.7633 },
        'Europe/London': { lat: 51.5074, lon: -0.1278 },
        'Europe/Dublin': { lat: 53.3498, lon: -6.2603 },
        'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
        'Europe/Berlin': { lat: 52.52, lon: 13.405 },
        'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041 },
        'Europe/Madrid': { lat: 40.4168, lon: -3.7038 },
        'Europe/Rome': { lat: 41.9028, lon: 12.4964 },
        'Europe/Zurich': { lat: 47.3769, lon: 8.5417 },
        'Europe/Stockholm': { lat: 59.3293, lon: 18.0686 },
        'Europe/Warsaw': { lat: 52.2297, lon: 21.0122 },
        'Europe/Moscow': { lat: 55.7558, lon: 37.6173 },
        'Europe/Lisbon': { lat: 38.7223, lon: -9.1393 },
        'America/New_York': { lat: 40.7128, lon: -74.006 },
        'America/Toronto': { lat: 43.6532, lon: -79.3832 },
        'America/Chicago': { lat: 41.8781, lon: -87.6298 },
        'America/Denver': { lat: 39.7392, lon: -104.9903 },
        'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
        'America/Vancouver': { lat: 49.2827, lon: -123.1207 },
        'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333 },
        'America/Mexico_City': { lat: 19.4326, lon: -99.1332 },
        'America/Bogota': { lat: 4.711, lon: -74.0721 },
        'Africa/Lagos': { lat: 6.5244, lon: 3.3792 },
        'Africa/Cairo': { lat: 30.0444, lon: 31.2357 },
        'Africa/Johannesburg': { lat: -26.2041, lon: 28.0473 },
        'Africa/Nairobi': { lat: -1.2921, lon: 36.8219 },
    };

    function coordsForTimeZone(tz) {
        return TZ_COORDS[tz] || null;
    }

    // WMO weather interpretation codes, as returned by Open-Meteo's `weather_code`.
    const WEATHER_LABELS = {
        0: 'clear sky',
        1: 'mostly clear',
        2: 'partly cloudy',
        3: 'overcast',
        45: 'fog',
        48: 'freezing fog',
        51: 'light drizzle',
        53: 'drizzle',
        55: 'heavy drizzle',
        61: 'light rain',
        63: 'rain',
        65: 'heavy rain',
        66: 'freezing rain',
        67: 'heavy freezing rain',
        71: 'light snow',
        73: 'snow',
        75: 'heavy snow',
        77: 'snow grains',
        80: 'light showers',
        81: 'showers',
        82: 'violent showers',
        85: 'light snow showers',
        86: 'snow showers',
        95: 'a thunderstorm',
        96: 'a thunderstorm with hail',
        99: 'a thunderstorm with heavy hail',
    };

    function weatherLabel(code) {
        return WEATHER_LABELS[code] || 'weather of some kind';
    }

    function relativeTime(then, now) {
        const seconds = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
        if (seconds < 60) return 'just now';
        const plural = (n, unit) => n + ' ' + unit + (n === 1 ? '' : 's') + ' ago';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return plural(minutes, 'minute');
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return plural(hours, 'hour');
        const days = Math.floor(hours / 24);
        if (days < 30) return plural(days, 'day');
        const months = Math.floor(days / 30);
        if (months < 12) return plural(months, 'month');
        return plural(Math.floor(months / 12), 'year');
    }

    return { CHENNAI, haversineKm, coordsForTimeZone, weatherLabel, relativeTime };
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/site-helpers.test.js`

Expected: PASS, 8/8.

- [ ] **Step 5: Add the marker block to index.html**

In `index.html`, immediately **before** the existing behaviour `<script>` at line ~1423, add:

```html
<!-- Generated by scripts/inline-css.js from scripts/site-helpers.js — do not hand-edit. -->
<!-- prettier-ignore -->
<script data-site-helpers></script>
```

Note the `data-site-helpers` attribute: it keeps this block out of `collectInlineScripts`'s attribute-less `<script>` match, so it needs its own hash. Handle that by making it attribute-less instead — change the tag to a plain `<script>` and rely on a distinct surrounding comment:

```html
<!-- site-helpers:start — generated by scripts/inline-css.js from scripts/site-helpers.js; do not hand-edit. -->
<!-- prettier-ignore -->
<script></script>
<!-- site-helpers:end -->
```

- [ ] **Step 6: Extend the build to inline the helpers**

In `scripts/inline-css.js`, after the existing CSS marker replacement and **before** the write-then-rename block, add:

```js
// Inline scripts/site-helpers.js into its marker block. The helpers are unit
// tested as a CommonJS module, but ship as part of the page's single inline
// <script> budget rather than as another request.
const helpers = fs.readFileSync(path.join(root, 'scripts', 'site-helpers.js'), 'utf8').trim();
const helpersMarker = /(<!-- site-helpers:start[\s\S]*?<script>)[\s\S]*?(<\/script>)/;
if (!helpersMarker.test(html)) {
    console.error('error: site-helpers marker block not found in index.html');
    process.exit(1);
}
```

Then, wherever the existing code produces the output string, chain the helpers replacement onto it. Read the file first (`cat scripts/inline-css.js`) and apply the same `.replace(marker, ...)` pattern already in use, e.g.:

```js
const next = html.replace(marker, `<style data-inline-css>${css}</style>`).replace(helpersMarker, `$1${helpers}$2`);
```

Use `(_, open, close) => open + helpers + close` as the replacer if the helper source contains `$` sequences — `String.replace` treats `$&`, `$1` etc. specially in a string replacement.

- [ ] **Step 7: Verify the build inlines the helpers and fixes the CSP hash**

```bash
npm run build
grep -c 'haversineKm' index.html
npm run check:csp
git diff --stat _headers
```

Expected: `grep` returns a non-zero count (the helper source is now in the page), `check:csp` passes, and `_headers` shows a modification — the new third inline script's hash was added automatically.

- [ ] **Step 8: Verify the helpers are live in the browser**

Open the page and run in the console:

```js
Math.round(helpers.haversineKm(helpers.CHENNAI, { lat: 51.5074, lon: -0.1278 }));
```

Expected: a number around `8250`.

- [ ] **Step 9: Commit**

```bash
npm run format && npm run build
git add scripts/site-helpers.js scripts/site-helpers.test.js scripts/inline-css.js index.html dist/output.css _headers
git commit -m "feat: add tested runtime helpers inlined at build time"
```

---

## Task 13: The "now" paragraph — time, weather, distance, viewport

**Files:**

- Modify: `index.html` (new section + behaviour script)
- Modify: `_headers` (`connect-src`)

**Interfaces:**

- Consumes: `helpers.CHENNAI`, `helpers.haversineKm`, `helpers.coordsForTimeZone`, `helpers.weatherLabel` (Task 12); `.skeleton` (Task 9).
- Produces: element ids `now-time`, `now-weather`, `now-distance`, `now-viewport`; section `id="now"`.

- [ ] **Step 1: Allow the weather API in the CSP**

In `_headers`, in **both** the `/` and `/index.html` blocks, extend `connect-src`:

```
connect-src 'self' https://github-contributions-api.jogruber.de https://api.open-meteo.com;
```

Do not touch the `/404`, `/404.html`, or `/og-image` blocks.

- [ ] **Step 2: Preconnect to the weather API**

In `index.html`, next to the existing heatmap `preconnect` (line ~76), add:

```html
<link rel="preconnect" href="https://api.open-meteo.com" crossorigin />
```

- [ ] **Step 3: Add the section markup**

Insert immediately before the Footer section (`<!-- Footer -->`), followed by a `<hr class="rule-dashed" />` before it:

```html
<section id="now" class="mb-16">
    <div class="flex flex-col gap-3 text-neutral-800 dark:text-neutral-400 leading-relaxed">
        <p>
            on my side of the screen it is
            <span id="now-time" class="font-medium text-neutral-900 dark:text-neutral-200">—</span> in chennai<span
                id="now-weather"
                hidden
            ></span
            >.
        </p>
        <p id="now-distance-wrap" hidden>
            you're roughly
            <span id="now-distance" class="font-medium text-neutral-900 dark:text-neutral-200">—</span> from me, reading
            this at <span id="now-viewport" class="font-medium text-neutral-900 dark:text-neutral-200">—</span>. neither
            number is especially useful, but here they are.
        </p>
    </div>
</section>
```

- [ ] **Step 4: Add the behaviour**

Append inside the existing behaviour `<script>` in `index.html` (before its closing `</script>`, after the star-field IIFE):

```js
// "now" paragraph: local time, weather, rough visitor distance, viewport.
// Every piece is supplementary — anything that fails just stays hidden.
(function () {
    const timeEl = document.getElementById('now-time');
    const weatherEl = document.getElementById('now-weather');
    const distWrap = document.getElementById('now-distance-wrap');
    const distEl = document.getElementById('now-distance');
    const viewportEl = document.getElementById('now-viewport');
    if (!timeEl) return;

    // Local time in Chennai — no network needed.
    const timeFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const paintTime = () => (timeEl.textContent = timeFmt.format(new Date()));
    paintTime();
    setInterval(paintTime, 30000);

    // Visitor distance, derived from their IANA timezone rather than
    // their IP — no third-party geolocation call, nothing to track.
    const paintViewport = () => (viewportEl.textContent = window.innerWidth + '×' + window.innerHeight);
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const here = window.helpers && window.helpers.coordsForTimeZone(tz);
        if (here) {
            const km = window.helpers.haversineKm(window.helpers.CHENNAI, here);
            distEl.textContent = km < 1 ? 'no distance at all' : Math.round(km).toLocaleString('en-US') + 'km';
            paintViewport();
            distWrap.hidden = false;
        }
    } catch (e) {
        /* no timezone available — leave the line hidden */
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(paintViewport, 150);
    });

    // Weather. Cached for 30 minutes; a stale cache beats a blank line.
    const WEATHER_KEY = 'weather-v1';
    const WEATHER_TTL = 30 * 60 * 1000;
    const WEATHER_URL =
        'https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707' +
        '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code' +
        '&timezone=Asia%2FKolkata';

    function paintWeather(current) {
        if (!current || !window.helpers) return;
        weatherEl.innerHTML =
            ', where it is <span class="font-medium text-neutral-900 dark:text-neutral-200">' +
            current.temperature_2m +
            '°C</span> and feels like <span class="font-medium text-neutral-900 dark:text-neutral-200">' +
            current.apparent_temperature +
            '°C</span>, with ' +
            current.relative_humidity_2m +
            '% humidity and ' +
            window.helpers.weatherLabel(current.weather_code);
        weatherEl.hidden = false;
    }

    let cached = null;
    try {
        cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');
    } catch (e) {
        /* corrupt cache — ignore */
    }
    if (cached && Date.now() - cached.at < WEATHER_TTL) {
        paintWeather(cached.current);
    } else {
        fetch(WEATHER_URL)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('weather ' + r.status))))
            .then((data) => {
                paintWeather(data.current);
                try {
                    localStorage.setItem(WEATHER_KEY, JSON.stringify({ at: Date.now(), current: data.current }));
                } catch (e) {
                    /* storage full or blocked — the render already happened */
                }
            })
            .catch(() => {
                if (cached) paintWeather(cached.current);
            });
    }
})();
```

- [ ] **Step 5: Add `now` to the verb nav**

In the `<nav>`, insert before the `reach` item:

```html
<li aria-hidden="true" class="text-neutral-300 dark:text-neutral-700">/</li>
<li>
    <a
        class="lift block rounded-xs px-2 py-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        href="#now"
        >now</a
    >
</li>
```

- [ ] **Step 6: Build and verify**

```bash
npm run format && npm run build && npm run check:csp && npx --yes htmlhint index.html 404.html
```

Reload with the devtools Console and Network tabs open. Confirm:

- The time renders immediately and ticks.
- The weather clause appears after the Open-Meteo request resolves; **no CSP violation** appears in the console. A `Refused to connect` error means Step 1 was missed.
- The distance line shows a plausible number (Chennai visitors see roughly `1,360km`, since the zone resolves to Kolkata).
- Resizing the window updates the viewport figure after a short pause.
- With the network throttled to Offline and `localStorage` cleared, the weather clause stays hidden and nothing else breaks.

- [ ] **Step 7: Commit**

```bash
git add index.html _headers dist/output.css
git commit -m "feat: add live 'now' paragraph"
```

---

## Task 14: Footer commit line

**Files:**

- Modify: `index.html`
- Modify: `_headers` (`connect-src`)

**Interfaces:**

- Consumes: `helpers.relativeTime` (Task 12); `.skeleton` (Task 9).
- Produces: element id `commit-line`.

**API shape (verified 2026-08-31):** `GET https://api.github.com/repos/rabbive/portfolio-v2/commits?per_page=1` returns an array whose `[0].sha` and `[0].commit.author.date` are needed; `GET .../commits/{sha}` returns `stats: { total, additions, deletions }`. Unauthenticated rate limit is 60 requests/hour/IP, hence the 6-hour cache.

- [ ] **Step 1: Allow the GitHub API in the CSP**

In `_headers`, in both the `/` and `/index.html` blocks, extend `connect-src` again:

```
connect-src 'self' https://github-contributions-api.jogruber.de https://api.open-meteo.com https://api.github.com;
```

- [ ] **Step 2: Add the markup**

In `index.html`, in the Footer section (line ~1408), add a second paragraph after the existing one:

```html
<p id="commit-line" class="mt-2 text-neutral-500 dark:text-neutral-500 text-xs" hidden></p>
```

- [ ] **Step 3: Add the behaviour**

Append inside the behaviour `<script>`, after the "now" IIFE:

```js
// Footer commit line. Two unauthenticated GitHub API calls (list, then
// the single commit for its diffstat), cached for six hours because the
// anonymous rate limit is 60/hour per IP. Silent on failure.
(function () {
    const el = document.getElementById('commit-line');
    if (!el || !window.helpers) return;

    const KEY = 'commit-v1';
    const TTL = 6 * 60 * 60 * 1000;
    const REPO = 'https://api.github.com/repos/rabbive/portfolio-v2';

    function paint(info) {
        if (!info) return;
        el.textContent =
            'latest commit ' +
            window.helpers.relativeTime(new Date(info.date), new Date()) +
            ': +' +
            info.additions +
            ' −' +
            info.deletions;
        el.hidden = false;
    }

    let cached = null;
    try {
        cached = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
        /* corrupt cache — ignore */
    }
    if (cached && Date.now() - cached.at < TTL) {
        paint(cached.info);
        return;
    }

    fetch(REPO + '/commits?per_page=1')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('commits ' + r.status))))
        .then((list) => {
            const head = list && list[0];
            if (!head) throw new Error('no commits');
            return fetch(REPO + '/commits/' + head.sha)
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error('commit ' + r.status))))
                .then((full) => ({
                    date: head.commit.author.date,
                    additions: full.stats.additions,
                    deletions: full.stats.deletions,
                }));
        })
        .then((info) => {
            paint(info);
            try {
                localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), info: info }));
            } catch (e) {
                /* storage blocked — the render already happened */
            }
        })
        .catch(() => {
            if (cached) paint(cached.info);
        });
})();
```

- [ ] **Step 4: Build and verify**

```bash
npm run format && npm run build && npm run check:csp
```

Reload and confirm the footer shows something like `latest commit 2 hours ago: +140 −12`, with no CSP violation in the console. Then set the browser to Offline, clear `localStorage`, reload, and confirm the line is simply absent.

- [ ] **Step 5: Commit**

```bash
git add index.html _headers dist/output.css
git commit -m "feat: show latest commit and diffstat in the footer"
```

---

## Task 15: Live status emoji in the tab title

**Files:**

- Modify: `index.html`

- [ ] **Step 1: Add the behaviour**

Append inside the behaviour `<script>`, after the commit-line IIFE:

```js
// Status dot in the tab title, driven by Chennai local hour. Purely a
// "there is a person behind this" signal — no presence tracking.
(function () {
    const base = document.title;
    function paint() {
        const hour = Number(
            new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                hour12: false,
            }).format(new Date()),
        );
        document.title = (hour >= 9 && hour < 24 ? '🟢 ' : '🌙 ') + base;
    }
    paint();
    setInterval(paint, 5 * 60 * 1000);
})();
```

- [ ] **Step 2: Build and verify**

```bash
npm run format && npm run build && npm run check:csp
```

Reload and confirm the tab title gains a leading `🟢` or `🌙` depending on the current hour in Chennai, and that the emoji does not accumulate on repeated repaints (wait 5 minutes, or temporarily lower the interval to 2000 to check).

- [ ] **Step 3: Commit**

```bash
git add index.html dist/output.css _headers
git commit -m "feat: add live status emoji to the tab title"
```

---

## Task 16: Doubled-letter tagline

**Files:**

- Modify: `index.html`
- Modify: `src/input.css`

- [ ] **Step 1: Add the tagline markup**

In `index.html`, replace the location line under the `<h1>` (line ~283):

```html
<p
    id="tagline"
    class="mt-1.5 font-sans text-neutral-600 dark:text-neutral-400 text-sm"
    data-text="chennai, in. i build things that hold under load"
>
    chennai, in. i build things that hold under load
</p>
```

- [ ] **Step 2: Add the animation styles**

Append to `src/input.css`:

```css
/* Doubled-letter reveal: every character starts duplicated and the duplicate
   collapses away, left to right. The final text is in the DOM from the start,
   so this degrades to plain text with JS off or reduced motion on. */
.tagline-char {
    display: inline-block;
    white-space: pre;
}

.tagline-char.ghost {
    max-width: 1ch;
    overflow: hidden;
    transition: max-width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.tagline-char.ghost.collapsed {
    max-width: 0;
}

@media (prefers-reduced-motion: reduce) {
    .tagline-char.ghost {
        display: none;
    }
}
```

- [ ] **Step 3: Add the behaviour**

Append inside the behaviour `<script>`, after the tab-title IIFE:

```js
// Doubled-letter tagline reveal. Skipped entirely under reduced motion —
// the element already contains the final text.
(function () {
    const el = document.getElementById('tagline');
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const text = el.dataset.text || el.textContent.trim();
    el.textContent = '';
    const ghosts = [];
    for (const ch of text) {
        const real = document.createElement('span');
        real.className = 'tagline-char';
        real.textContent = ch;
        el.appendChild(real);
        if (ch === ' ') continue;
        const ghost = document.createElement('span');
        ghost.className = 'tagline-char ghost';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.textContent = ch;
        el.appendChild(ghost);
        ghosts.push(ghost);
    }

    requestAnimationFrame(() => {
        ghosts.forEach((ghost, i) => {
            setTimeout(() => ghost.classList.add('collapsed'), 260 + i * 11);
        });
    });
})();
```

- [ ] **Step 4: Build and verify**

```bash
npm run format && npm run build && npm run check:csp && npx --yes htmlhint index.html 404.html
```

Reload and confirm: the tagline renders doubled for a beat, then the duplicates collapse left to right into the real sentence. Enable `prefers-reduced-motion` in DevTools → Rendering and reload — the tagline should appear plain and correct immediately. Disable JavaScript and reload — the tagline should still read correctly.

- [ ] **Step 5: Commit**

```bash
git add index.html src/input.css dist/output.css _headers
git commit -m "feat: add doubled-letter tagline reveal"
```

---

## Task 17: 404 parity, cache bust, docs, and full verification

**Files:**

- Modify: `404.html`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Bring 404.html onto the warm palette**

```bash
grep -n 'bg-white\|neutral-\|output.css' 404.html
```

Replace `bg-white` with `bg-neutral-50`. The `neutral-*` classes need no edit — they now resolve to the warm scale automatically. Set the heading in the display serif by adding `font-display` to its class list and removing `font-medium`.

- [ ] **Step 2: Bump the stylesheet cache-buster**

In `404.html`, increment the `?v=N` on the `dist/output.css` link (e.g. `?v=3` → `?v=4`).

- [ ] **Step 3: Update CLAUDE.md**

Add to the "Build & deploy conventions" section:

```markdown
- **CSP hashes are automated.** `npm run build` runs `scripts/check-csp-hashes.js --fix`, which rewrites the `'sha256-...'` values in `_headers` to match the current inline `<script>` blocks. Never hand-edit a hash. CI runs the same script without `--fix` plus `git diff --exit-code _headers`.
- **`scripts/site-helpers.js` is the source of truth for the page's pure helpers** (haversine distance, timezone→coords, WMO weather labels, relative time). It is unit-tested with `node --test` and inlined into `index.html`'s `<!-- site-helpers -->` block by `scripts/inline-css.js` — never hand-edit the inlined copy.
- **Tests:** `npm test` runs `node --test scripts/*.test.js`. There are no browser tests; visual changes are verified by hand in both themes at 375px and 1440px.
```

Add to the "JavaScript behaviors" section:

```markdown
- **"now" paragraph** — Chennai local time (`Intl`, no network), current weather from Open-Meteo (cached 30 min under `weather-v1`), the visitor's rough distance from Chennai derived from their IANA timezone (no IP geolocation), and their viewport size. Every piece hides itself on failure.
- **Footer commit line** — latest commit age and `+N −M` diffstat from the GitHub API, cached 6 h under `commit-v1` (the anonymous rate limit is 60 req/h/IP).
- **Tab title status** — a `🟢`/`🌙` prefix on `document.title` driven by Chennai local hour.
- **Doubled-letter tagline** — the tagline renders doubled and collapses to the real text; skipped entirely under `prefers-reduced-motion`, and the final text is in the DOM so it degrades cleanly with JS off.
```

Update the fonts bullet to mention the two new families and their subsetting.

- [ ] **Step 4: Run the full CI pipeline locally**

```bash
npm run format
npm test
npm run check:csp
npm run build
git diff --exit-code dist/output.css index.html _headers && echo BUILD_CLEAN
npx --yes htmlhint index.html 404.html
npm run format:check
```

Expected: tests pass, `csp: all inline script hashes present in _headers`, `BUILD_CLEAN`, htmlhint reports no errors, Prettier reports no unformatted files.

- [ ] **Step 5: Manual verification matrix**

Serve the site and walk through every combination. All must pass before merging.

```bash
python3 -m http.server 8080
```

| Check                                                                               | Light | Dark |
| ----------------------------------------------------------------------------------- | ----- | ---- |
| Warm background, warm text, no cold grey anywhere                                   | ☐     | ☐    |
| Name + 7 headings in Instrument Serif                                               | ☐     | ☐    |
| Three marker underlines visible, distinct shapes, below baseline                    | ☐     | ☐    |
| Amber highlight legible with visible ring and glow                                  | ☐     | ☐    |
| Margin note in Caveat, in the gutter at 1440px, inline at 1000px, never overlapping | ☐     | ☐    |
| 5 dashed rules run wider than the text column                                       | ☐     | ☐    |
| Buttons and shelf entries lift 1px on hover                                         | ☐     | ☐    |
| Verb nav visible, all 7 anchors scroll correctly, clears the last section           | ☐     | ☐    |
| Shelf: 2 columns desktop / 1 mobile, pixel stars gold + faint, edges fade           | ☐     | ☐    |
| "now" paragraph: time ticks, weather resolves, distance + viewport shown            | ☐     | ☐    |
| Footer commit line resolves                                                         | ☐     | ☐    |
| Tab title carries 🟢 or 🌙                                                          | ☐     | ☐    |
| Tagline doubles then resolves                                                       | ☐     | ☐    |
| Heatmap still renders and matches the palette                                       | ☐     | ☐    |
| Theme toggle switches cleanly with no flash                                         | ☐     | ☐    |

Additional passes:

- **375px viewport:** nothing overflows horizontally; the verb nav fits or wraps without clipping.
- **`prefers-reduced-motion` on:** no tagline animation, no lift transition, no skeleton pulse, no smooth scroll, no star field.
- **JavaScript disabled:** the page reads correctly; the "now" and commit lines are absent, not broken.
- **Console:** zero CSP violations, zero errors.

- [ ] **Step 6: Commit**

```bash
git add 404.html CLAUDE.md dist/output.css index.html _headers
git commit -m "docs: document the redesign; bring 404 onto the warm palette"
```

- [ ] **Step 7: Push and open the PR**

```bash
git push -u origin feat/cmrg-redesign
gh pr create --base main --title "cmrg-inspired redesign" --body "$(cat <<'EOF'
Ports the visual system and live-data flourishes of cmrg.me onto the site.

**Visual:** warm neutral palette (both themes), Instrument Serif headings, Caveat margin notes, hand-drawn marker underlines, amber glow highlights, dashed section rules, squared corners, 1px hover lift.

**Structure:** fixed verb nav, "things that stayed" shelf section.

**Live data:** Chennai time + Open-Meteo weather, visitor distance from timezone (no IP geolocation), viewport echo, GitHub commit diffstat, tab-title status emoji, doubled-letter tagline.

**Build:** CSP `script-src` hashes are now auto-synced by `scripts/check-csp-hashes.js --fix` during `npm run build`, and verified in CI. Pure runtime helpers live in `scripts/site-helpers.js` under `node --test` and are inlined at build time.

Skipped from the reference site: guestbook (needs a datastore), attention map (needs a usage tracker), cover art (copyright + `img-src 'self'`).

See `docs/superpowers/specs/2026-08-31-cmrg-inspired-redesign.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 8: Wait for CI, then merge**

```bash
gh pr checks --watch
```

Expected: all checks green. Only then merge.

---

## Self-review notes

**Spec coverage.** All 15 numbered spec items map to tasks: 1→T2, 2→T3/T4, 3→T5, 4→T6, 5→T2/T5 (links keep `text-decoration`; marker classes are barred from `<a>` and Task 5 Step 4 verifies it), 6→T8, 7→T8, 8→T9, 9→T11, 10→T10, 11→T11, 12→T13, 13→T14, 14→T15, 15→T16. Non-functional requirements are enforced by Task 1 (CSP), Tasks 13/14 Step 1 (`connect-src`), and Task 17 Steps 4–5 (full verification).

**Known sharp edges for the executor:**

- Task 12 Step 5 walks back its own first suggestion. Use the **second** markup block (attribute-less `<script>` between `site-helpers:start`/`:end` comments). An attribute-carrying `<script>` would slip past `collectInlineScripts` and end up with no CSP hash — which fails closed, silently.
- Task 12 Step 6 must use a function replacer, not a string, if the helper source ever contains `$&` or `$1`.
- Every task that edits `index.html`'s inline script changes a CSP hash. `npm run build` fixes it, but `_headers` must be staged in that commit. Every commit block in this plan already includes it.
