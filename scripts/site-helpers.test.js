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

test('coordsForTimeZone does not leak Object.prototype members', () => {
    for (const key of ['toString', 'constructor', 'valueOf', '__proto__']) {
        assert.strictEqual(coordsForTimeZone(key), null, `expected null for ${key}`);
    }
});

test('weatherLabel does not leak Object.prototype members', () => {
    for (const key of ['toString', 'constructor', 'valueOf', '__proto__']) {
        assert.strictEqual(weatherLabel(key), 'weather of some kind', `expected fallback for ${key}`);
    }
});

test('relativeTime describes recent, hourly, and daily gaps', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    assert.strictEqual(relativeTime(new Date('2026-08-31T11:59:30Z'), now), 'just now');
    assert.strictEqual(relativeTime(new Date('2026-08-31T11:00:00Z'), now), '1 hour ago');
    assert.strictEqual(relativeTime(new Date('2026-08-31T09:00:00Z'), now), '3 hours ago');
    assert.strictEqual(relativeTime(new Date('2026-08-30T12:00:00Z'), now), '1 day ago');
    assert.strictEqual(relativeTime(new Date('2026-08-19T12:00:00Z'), now), '12 days ago');
});

test('relativeTime covers the minutes branch and its boundaries', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    // 59s stays under the 60s "just now" threshold.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 59 * 1000), now), 'just now');
    // 60s rolls over into whole minutes.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 60 * 1000), now), '1 minute ago');
    // Mid-range minutes value -- Task 14's most common real-world case.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 20 * 60 * 1000), now), '20 minutes ago');
    // 59m stays in the minutes branch.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 59 * 60 * 1000), now), '59 minutes ago');
    // 60m rolls over into whole hours.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 60 * 60 * 1000), now), '1 hour ago');
});

test('relativeTime covers the hours/days boundary', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    // 23h59m stays in the hours branch.
    assert.strictEqual(relativeTime(new Date(now.getTime() - (23 * 60 + 59) * 60 * 1000), now), '23 hours ago');
    // 24h rolls over into whole days.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), now), '1 day ago');
});

test('relativeTime covers the days/months boundary', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    // 29d stays in the days branch.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), now), '29 days ago');
    // 30d rolls over into whole (30-day) months.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now), '1 month ago');
});

test('relativeTime covers the months branch and its 12-month boundary', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    // 5 months (150 days) stays in the months branch.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000), now), '5 months ago');
    // 2 months (60 days) exercises the plural switch at >1.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now), '2 months ago');
    // 12 months (360 days) rolls over into whole years, singular.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000), now), '1 year ago');
});

test('relativeTime covers the years branch and its plural switch', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    // 25 months (750 days) -- a years value beyond the singular case.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 750 * 24 * 60 * 60 * 1000), now), '2 years ago');
    // 24 months (720 days) exercises the plural switch at >1 year.
    assert.strictEqual(relativeTime(new Date(now.getTime() - 720 * 24 * 60 * 60 * 1000), now), '2 years ago');
});

test('relativeTime clamps a future date (then after now) to "just now"', () => {
    // Intended behaviour: a negative delta (then is after now) is clamped to 0
    // seconds elapsed, so it reads as "just now" rather than a negative duration
    // or an error. This is a deliberate decision, not an accident.
    const now = new Date('2026-08-31T12:00:00Z');
    const future = new Date('2026-08-31T13:00:00Z');
    assert.strictEqual(relativeTime(future, now), 'just now');
});
