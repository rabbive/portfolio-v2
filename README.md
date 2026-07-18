# portfolio-v2

Personal portfolio site. Single static `index.html` — Tailwind (compiled via CLI, not the CDN script), Inter font, vanilla JS for theme toggle (light/dark/system) and collapsible experience entries.

## Develop

```bash
npm install
npm run watch:css   # rebuilds dist/output.css on change
```

Open `index.html` directly in a browser, or serve it with any static file server.

## Build

```bash
npm install
npm run build:css   # outputs dist/output.css (purged, minified)
```

`dist/output.css` is committed so the site works without a build step on static hosts that don't run `npm install`.

## Before going live

- Replace placeholder content (name, bio, experience, links) in `index.html`.
- Update `https://REPLACE_WITH_YOUR_DOMAIN` in `robots.txt` and `sitemap.xml` to your real domain.
- Point your domain's DNS at your chosen static host (Vercel/Netlify/Cloudflare Pages/GitHub Pages).

## Status

Content is placeholder and will be replaced.
