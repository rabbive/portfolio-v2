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
    // Expected inline-script counts. Task 12 raised index.html's count to 3 (added
    // the site-helpers script) -- update the number here, don't delete the
    // assertion. Without this, hashesFor returning [] would make the loop below
    // pass vacuously.
    const expectedCounts = { 'index.html': 3, '404.html': 1 };
    for (const file of ['index.html', '404.html']) {
        const html = fs.readFileSync(path.join(root, file), 'utf8');
        const hashes = hashesFor(html);
        assert.strictEqual(
            hashes.length,
            expectedCounts[file],
            `${file}: expected ${expectedCounts[file]} inline scripts`,
        );
        for (const hash of hashes) {
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

test('rewriteHeaders bootstraps a script-src directive with zero existing sha256 tokens', () => {
    const headers = ['/', "  Content-Security-Policy: script-src 'self'; img-src 'self'"].join('\n');
    const out = rewriteHeaders(headers, { '/': ['sha256-A', 'sha256-B'] });
    assert.ok(out.includes("script-src 'self' 'sha256-A' 'sha256-B'; img-src 'self'"));
});

test('rewriteHeaders leaves an already-correct script-src directive unchanged', () => {
    const headers = ['/', "  Content-Security-Policy: script-src 'self' 'sha256-A' 'sha256-B'; img-src 'self'"].join(
        '\n',
    );
    assert.strictEqual(rewriteHeaders(headers, { '/': ['sha256-A', 'sha256-B'] }), headers);
});
