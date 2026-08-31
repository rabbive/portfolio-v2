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
