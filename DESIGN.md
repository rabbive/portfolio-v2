---
name: rabbive.dev
description: Personal portfolio designed as an engineer's field notebook — quiet, dense, precise, monochrome.
colors:
    paper: '#ffffff'
    night-page: '#0a0a0a'
    ink: '#171717'
    entry-ink: '#262626'
    graphite: '#404040'
    pencil: '#525252'
    ash: '#737373'
    fog: '#a3a3a3'
    mist: '#e5e5e5'
    mist-deep: '#d4d4d4'
    moonlight: '#f5f5f5'
typography:
    title:
        fontFamily: 'Inter, sans-serif'
        fontSize: '14px'
        fontWeight: 500
        lineHeight: 1.5
    body:
        fontFamily: 'Inter, sans-serif'
        fontSize: '14px'
        fontWeight: 400
        lineHeight: 1.625
    label:
        fontFamily: 'Inter, sans-serif'
        fontSize: '14px'
        fontWeight: 500
    meta:
        fontFamily: 'IBM Plex Mono, monospace'
        fontSize: '12px'
        fontWeight: 400
rounded:
    cell: '2px'
    soft: '6px'
    pill: '9999px'
spacing:
    row: '8px'
    cluster: '10px'
    header-gap: '16px'
    page-x: '24px'
    section: '48px'
    section-major: '64px'
    page-top: '96px'
components:
    button-primary:
        backgroundColor: '{colors.mist}'
        textColor: '{colors.ink}'
        rounded: '{rounded.pill}'
        padding: '8px 16px'
        typography: '{typography.label}'
    button-primary-hover:
        backgroundColor: '{colors.mist-deep}'
    button-secondary:
        backgroundColor: '{colors.paper}'
        textColor: '{colors.entry-ink}'
        rounded: '{rounded.pill}'
        padding: '8px 16px'
        typography: '{typography.label}'
    link-inline:
        textColor: '{colors.graphite}'
        typography: '{typography.body}'
    tooltip:
        backgroundColor: '{colors.entry-ink}'
        textColor: '{colors.moonlight}'
        rounded: '{rounded.soft}'
        padding: '4px 8px'
        typography: '{typography.meta}'
---

# Design System: rabbive.dev

## Overview

**Creative North Star: "The Engineer's Field Notebook"**

The site reads as a working engineer's log: dense lowercase entries, evidence-first content, hairline structure, and nothing decorative that isn't also information. One column, one ink, essentially one type size — the confidence of the design is that it never raises its voice. Recruiters scan a page that behaves like a well-kept notebook: name and location stamped at the top, entries grouped under small labeled headings, every claim a click away from its proof (a repo, an issuer page, a live contribution graph).

The atmosphere is quiet, dense, precise. Ornament is limited to ambient gestures — a star field drifting behind the page with a rare shooting star on a 45-second loop, cross-marks at an entry's corners on hover or focus, and the mono log-annotations in the meta register. Motion is disabled for reduced motion; hover ornament is suppressed on touch. Dark mode is not an inversion but a second page stock: near-black paper, pale ink, and a barely-warm stone tint on the owner's name and inline links, like pencil under lamplight.

Confirmed anti-references: hero banners, gradients, marketing copy, and card grids. If a change moves the page toward any of those, it is moving away from the product.

**Key Characteristics:**

- Single centered measure (576px) at every viewport — no grids, no cards
- Monochrome neutral palette; hierarchy by ink tone, never by hue
- Headings set at body size (14px); weight and tone carry structure
- Capsule controls, hairline rings, flat surfaces; shadow reserved for floating elements
- Lowercase, terse, technical voice in all copy
- Motion as ambience (stars, 0.2s control transitions, 0.4s collapsibles) with full reduced-motion parity

## Colors

The palette is a single neutral ramp plus white paper; color temperature shifts (stone tints in dark mode) are sub-perceptual, not accents.

### Primary

- **Ink** (#171717): primary text on light paper — the owner's name, section emphasis, primary pill label.
- **Moonlight** (#f5f5f5): primary text on the night page — headings and strong emphasis in dark mode.

### Neutral

- **Paper** (#ffffff): the light canvas; also the fill of the secondary pill.
- **Night Page** (#0a0a0a): the dark canvas; the star field's sky.
- **Entry Ink** (#262626): body text on paper; hairline rings and tonal fills in dark mode; the tooltip's fill in both themes.
- **Graphite** (#404040): secondary text and inline-link color on paper; hairline emphasis in dark mode.
- **Pencil** (#525252): supporting text on paper — location line, icon strokes, metadata.
- **Ash** (#737373): quiet metadata on paper — legend labels, timestamps.
- **Fog** (#a3a3a3): the container's resting text color and dark-mode body text; the lightest text that still reads on both papers.
- **Mist** (#e5e5e5): fills and hairline rings on paper — primary pill fill, divider strokes.
- **Mist Deep** (#d4d4d4): hover state of the primary pill; hover hairlines on paper.

### Named Rules

**The One Ink Rule.** There is no chromatic accent anywhere in the system — not for links, not for focus, not for the heatmap (a five-step gray ramp). Emphasis is always a darker or lighter step of the same neutral. If a design needs a "pop", it gets a tonal step, never a hue.

**The Two Papers Rule.** Light and dark modes are parallel stocks, not inversions. Dark-mode headings take a barely-warm stone tint (#f5f5f4 on the name, #d6d3d1 on prose links) — the only place the strict neutral ramp bends.

## Typography

**Display Font:** none — the system has no display role.
**Body & UI Font:** Inter (self-hosted latin subset, weights 400 and 500 only, `sans-serif` fallback, `font-display: swap`).
**Mono Font:** IBM Plex Mono (self-hosted subset, weight 400 only) — the log-annotation voice for the meta register: dates, legend, tooltip, footer, availability line.

**Character:** a single quiet voice. Inter at one reading size with two weights; the lowercase copy and tight measure make the page feel noted-down rather than published.

### Hierarchy

- **Title** (500, 14px, 1.5): the owner's name, section headings, project entry titles, button labels. Section headings pair the words with a small inline icon (14px square, pencil-toned).
- **Body** (400, 14px, 1.625): all prose. Relaxed leading is the one luxury in an otherwise dense system.
- **Label** (500, 14px): pill buttons — same size as body, medium weight.
- **Meta** (IBM Plex Mono 400, 12px): the heatmap legend and summary, the floating tooltip, footnote-grade text, the availability line. Dates and years are set in mono at body size (14px). The only smaller size in the system.

### Named Rules

**The Same-Size Rule.** Headings render at body size (14px). Hierarchy is produced by weight (400 vs 500) and ink tone (fog → pencil → ink), never by scale. A new "bigger heading" is a design-system change, not a local decision.

**The Two Sizes Rule.** The system ships exactly two sizes: 14px for everything read, 12px for everything glanced (legend, tooltip). Do not introduce a third.

## Layout

One centered column holds the entire page: a single reading measure (max 576px) with generous top clearance (96px) so the name lands like a stamp on the first page of a notebook. On narrow screens the column pads inward (24px); from the medium breakpoint up it sits flush. The column never reflows, splits, or grids at any viewport — responsive design here means protecting the measure, not rearranging it.

Rhythm: sections separate by one of two gaps (48px for the header and about block, 64px between major sections). Inside a section, the heading stands 16px off its entries; entries are rows with 8px of vertical air and 4px between rows. Inline clusters (the header buttons, icon-and-label pairs) sit 10px or 8px apart. Nothing else: no side margins inside the measure, no boxed sections, no dividers — separation is whitespace alone.

Ornament density adapts, not layout: the ambient star field halves its star count under 640px, and hover-only flourishes (corner marks) are suppressed on touch devices entirely.

## Elevation & Depth

The system is flat by default. Depth is conveyed by tonal layering on the neutral ramp and hairline rings (1px, mist on paper / entry-ink on the night page), not by shadows.

### Shadow Vocabulary

- **Pill lift** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — the `shadow-sm` utility): only on the two page-level pill buttons. Gives the primary actions a faint physical press.
- **Tooltip float** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` — `shadow-lg`): only on the floating heatmap tooltip, the one element that lives above the page.
- **Star glow** (`box-shadow: 0 0 4px rgba(255, 255, 255, 0.6)`): dark mode only, on star-field points — glow as light, not elevation.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow means "this floats": pills that act, a tooltip that hovers, stars that shine. Never add a shadow to a static surface; use a tonal step or a hairline instead.

## Shapes

Two form families and nothing between: fully rounded capsules for controls that respond to a click (pill buttons, theme-toggle housing, star points, all 9999px), and square-to-near-square for everything informational (heatmap cells at 2px, the tooltip at 6px). Entry rows, sections, and the page itself have no radius at all.

Borders are hairline rings (1px) rather than `border` strokes, and appear on the secondary pill, the toggle housing, and the tooltip. The one recurring mark is the corner cross: a 10px crosshair at the top-left and bottom-right corners of a hovered or keyboard-focused entry — a drafting-table registration mark, desktop-pointer-only. A single pseudo-element paints both crosses; no markup.

**The Capsule-or-Square Rule.** Interactive = capsule, information = square. A radius between 6px and full (e.g. a 12px card corner) belongs to a card grid, which is an anti-reference; don't introduce one.

## Components

### Buttons

Pill capsules with a faint lift, used only for the two page-level actions (resume, contact).

- **Shape:** capsule (9999px), padded 8px × 16px, leading icon at 16px square.
- **Primary:** Mist fill (#e5e5e5) with ink label; hover deepens one step (to #d4d4d4).
- **Secondary:** paper fill with a hairline ring (1px, Mist); hover shifts the fill a half-step and darkens the ring. Dark mode inverts the recipe: entry-ink fill, entry-ink ring, hover at 60% opacity fill.
- **Press:** both scale to 98% on `:active`; transitions run 200ms.
- **Character:** tactile and restrained — they should feel like the only two buttons the page needed.

### Inline links

Two registers, both underlined — links are evidence, so they look like citations.

- **Prose link:** graphite text with a hairline underline (0.5px, ash-toned, offset 4px); hover darkens to ink. Used inside paragraphs.
- **Entry title link:** medium weight, entry-ink, hairline underline at 50% opacity (offset 3px) that darkens with the surrounding group hover. Used for project, experiment, and contact rows.

### Section headings

Lowercase label at title weight, led by a small stroke icon (14px, pencil-toned, 8px gap), standing 16px above its entries. The icon identifies the section; the words stay quiet.

### Entry rows

All list rows — projects, experiments, certifications, links — share one grammar: an entry-title link, a mono year at the trailing edge, a visible one-line description, and a row of tech-icon glyphs where relevant. Project descriptions state the strongest evidence inline; nothing hides behind a disclosure. Hover raises the corner cross-marks plus a hairline outline (0.5px, offset 6px); keyboard focus shows the identical state (crosses on `:focus-within`, outline on `:focus-visible`). Certifications link to the issuer and carry a mono year.

### Contribution heatmap

A GitHub-style grid of near-square cells (10px, 2px radius, 3px gap) on a five-step tonal ramp — light-to-ink on paper, ink-to-light on the night page. Cells are keyboard-focusable buttons; hover/focus raises a hairline outline. The floating tooltip is inverted in both themes (entry-ink fill, moonlight text, 6px radius, hairline ring, large float shadow). A right-aligned legend in meta size closes the block. Failure is silent by design: no data, no section.

### Theme toggle

A fixed capsule (top-right) that rests collapsed showing one icon and fans open on hover to reveal system / light / dark. Frosted fill (80% paper, backdrop blur) with a hairline ring. It is the only chrome that floats over content, and the only place zinc — a fractionally cooler gray — appears in the palette.

### Star field

A fixed ambient layer behind everything: 50 capsule points (25 under 640px) falling and twinkling on randomized 15–35s and 1.5–3.5s loops. Pencil-toned on paper, moonlit with a faint glow on the night page. Fully removed under reduced motion. It is atmosphere, not content — it must never obscure or distract.

## Do's and Don'ts

### Do:

- **Do** keep all copy lowercase, terse, and technical — the voice is part of the identity.
- **Do** build hierarchy from weight and ink tone (fog → pencil → ink); the Same-Size Rule is the system.
- **Do** use hairline rings (1px tonal) instead of borders, and whitespace instead of dividers.
- **Do** give every interactive element a keyboard path and a visible focus state — focus must look exactly like hover (cross-marks on `:focus-within`, hairline outline on `:focus-visible`).
- **Do** honor reduced motion with full parity — disable the star field and transitions, never partially.
- **Do** ship both themes together; every new custom rule needs an explicit dark variant, WCAG AA contrast included.
- **Do** keep the two-size type scale (14px / 12px) and the two-weight subset (400/500).

### Don't:

- **Don't** add chromatic accents — no brand blue links, no colored badges, no syntax-highlight hues (One Ink Rule).
- **Don't** introduce cards, card grids, hero banners, or gradients — confirmed anti-references.
- **Don't** put shadows on static surfaces; shadow means floating (Flat-By-Default Rule).
- **Don't** add a radius between 6px and full capsule (Capsule-or-Square Rule).
- **Don't** add a third type size, a display role, or a third typeface — the system is Inter plus IBM Plex Mono for the meta register (owner-approved 2026-07-28); don't re-add Google Fonts — all faces are self-hosted on purpose.
- **Don't** use borders where a hairline ring reads cleaner, or marketing copy anywhere — entries state facts and link their proof.
- **Don't** enlarge text below AA on either paper; the muted tones (ash, fog) are for metadata and ornament, not body copy.
