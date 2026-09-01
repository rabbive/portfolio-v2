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
    const TZ_COORDS = Object.assign(Object.create(null), {
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
    });

    function coordsForTimeZone(tz) {
        return TZ_COORDS[tz] || null;
    }

    // WMO weather interpretation codes, as returned by Open-Meteo's `weather_code`.
    const WEATHER_LABELS = Object.assign(Object.create(null), {
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
    });

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
