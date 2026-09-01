// Inlines dist/output.css into index.html's <style data-inline-css> block.
// Run via `npm run build` (after build:css). Removes the one render-blocking
// stylesheet request from the critical path; dist/output.css stays committed
// because 404.html still links it.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'dist', 'output.css'), 'utf8').trim();
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const marker = /<style data-inline-css>[\s\S]*?<\/style>/;
if (!marker.test(html)) {
    console.error('error: <style data-inline-css> block not found in index.html');
    process.exit(1);
}

// Inline scripts/site-helpers.js into its marker block. The helpers are unit
// tested as a CommonJS module, but ship as part of the page's single inline
// <script> budget rather than as another request.
const helpers = fs.readFileSync(path.join(root, 'scripts', 'site-helpers.js'), 'utf8').trim();
const helpersMarker = /(<!-- site-helpers:start[\s\S]*?<script>)[\s\S]*?(<\/script>)/;
if (!helpersMarker.test(html)) {
    console.error('error: site-helpers marker block not found in index.html');
    process.exit(1);
}

// Write-then-rename: atomic, and sidesteps macOS EPERM quirks where an
// iCloud-evicted file refuses open-for-write but directory rename works.
const tmpPath = htmlPath + '.inline-tmp';
const next = html
    .replace(marker, `<style data-inline-css>${css}</style>`)
    .replace(helpersMarker, (_, open, close) => open + helpers + close);
fs.writeFileSync(tmpPath, next);
fs.renameSync(tmpPath, htmlPath);
console.log(`inlined ${css.length} bytes of CSS into index.html`);
