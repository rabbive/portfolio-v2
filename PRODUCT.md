# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters and hiring managers screening candidates for systems, security, and general SWE roles. Their situation: a fast scan (tens of seconds), usually arriving from LinkedIn, GitHub, X, or a resume link. Their job: decide whether this candidate is worth a conversation — depth, shipped work, and credibility must be legible immediately.

Secondary (confirmed): engineering peers and the open-source community arriving via GitHub and X; the site should still read as credible builder-to-builder.

## Product Purpose

A personal portfolio for Ashwanth Kumaravel at https://rabbive.dev — a single static page. It exists to convert a brief recruiter visit into interview shortlisting, and to signal availability correctly: **open to internships now, converting to full-time on graduation.** Success means the visitor remembers a credible mix of depth + shipped work + certification and makes contact (email or LinkedIn).

## Positioning

The differentiator is the _combination_, confirmed by the owner as "a mix of all":

1. Systems & security depth — post-quantum cryptography, distributed systems, beyond typical new-grad scope;
2. Ships real projects end-to-end — working, public, deployed software;
3. Cloud & DevOps strength — AZ-400 and AWS DVA-C02 certified;
4. Research orientation — reinforcement learning and cryptography interests.

A neighboring new-grad portfolio can usually claim one of these; this product must keep all four visible and never over-rotate to a single axis.

## Operating Context

Recruiter journey: lands on the page from a profile or resume link → scans the hero line → skims Projects and Certifications → optionally checks the live GitHub contribution heatmap as proof of sustained activity → reaches out via email or LinkedIn. The site is served as static files on Cloudflare Pages; there is no backend, CMS, or analytics pipeline. Content updates are manual edits to `index.html`, deployed by pushing to `main`.

## Capabilities and Constraints

Confirmed functionality and content:

- Sections in order: About, Projects (echod, ops-env, schrodinger-mail, devsignal — each with collapsible detail), Experiments, Activity (live GitHub contribution heatmap via a third-party API), Certifications (AZ-400, AWS Certified Developer – Associate, both linked to issuer pages), Links, Footer.
- Theme toggle (system / light / dark) persisted in localStorage; dark mode throughout.
- Single static page: no framework, no bundler; Tailwind compiled at build time and inlined; vanilla JS only.
- Strict hash-based CSP and hardened Cloudflare Pages security headers — inline event handlers are deliberately impossible; behavior wires via `addEventListener`.
- Self-hosted subset fonts, immutable asset caching, self-contained SVG icon set.

Terminology the site uses and future copy must stay fluent in: post-quantum cryptography, distributed systems, RL agents, Python, TypeScript, Rust.

Open / undecided product facts (do not invent):

- Graduation year: 2027 (stated in the site copy and the header availability line).
- Target geography (India, global remote, relocation) is unspecified.
- `resume.pdf` is a known TODO — it is not on the site yet; nothing may link to it as if it exists.

## Brand Commitments

- Name: Ashwanth Kumaravel. Handle identity: **rabbive** — domain rabbive.dev, GitHub @rabbive.
- Social: LinkedIn /in/ashwanthk, X @ashwaanthh, email ashwanthkumaravel@gmail.com.
- Voice: all-lowercase, terse, technical ("ashwanth kumaravel — systems & security"). Confirmed by the shipped copy; keep it unless the owner redirects.

## Evidence on Hand

- Four featured project repos with per-project tech-icon breakdowns, plus three experiment repos — all public under github.com/rabbive.
- Two certifications with issuer verification links (Microsoft AZ-400, AWS DVA-C02).
- Live GitHub contribution heatmap (fetched client-side, cached 6h, silent on failure by design).
- Social card image (`og.png`, rendered from `og-image.html` at build time).

Absences future work must not fabricate: no resume.pdf, no testimonials, no metrics/benchmarks, no employment history.

## Product Principles

1. **Signal density over decoration.** Every element must raise hiring credibility — shipped repos, issuer-verified certs, live activity. Anything that doesn't is a candidate for removal.
2. **Evidence, not claims.** Prefer verifiable artifacts (repos, issuer pages, live data) over adjectives; never invent numbers, employers, or endorsements.
3. **The mix is the message.** Keep depth, shipped work, cloud certification, and research interest all visible; no single axis may swallow the page.
4. **Availability stays explicit.** The internship-now → full-time-on-graduation signal must remain findable without scrolling forensics.
5. **Craft is proof.** For a systems & security candidate the site itself is a work sample: performance, accessibility (WCAG AA contrast, reduced-motion support), and security posture are part of the pitch.

## Accessibility & Inclusion

Established practice, to be preserved: WCAG AA text contrast in both themes, `prefers-reduced-motion` fallbacks for all animation, keyboard-operable interactive elements (heatmap cells, collapsibles, theme toggle) with correct ARIA state.
