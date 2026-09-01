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
