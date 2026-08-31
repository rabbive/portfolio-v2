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
