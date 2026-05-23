/**
 * GeoIP Lookup
 * Uses ipapi.co (free tier) or GEO_IP_API_KEY for ip-api.com Pro.
 * Results are cached in-memory for 24h to minimise outbound calls.
 * Falls back gracefully if the service is unavailable.
 */

import axios from 'axios';

const cache = new Map();   // ip -> { country, city, isp, isTor, cachedAt }
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24h
const TIMEOUT_MS = 3000;

// Known private IP ranges — skip lookups for these
const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^localhost$/,
];

function isPrivateIp(ip) {
  return PRIVATE_RANGES.some(re => re.test(ip));
}

export async function geoLookup(ip) {
  if (!ip || isPrivateIp(ip)) {
    return { country: 'LOCAL', countryCode: 'XX', city: 'Local', isp: 'private', isTor: false };
  }

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    let result;
    const apiKey = process.env.GEO_IP_API_KEY;

    if (apiKey) {
      // ip-api.com Pro (higher rate limits)
      const { data } = await axios.get(
        `https://pro.ip-api.com/json/${encodeURIComponent(ip)}?key=${apiKey}&fields=status,country,countryCode,city,isp,proxy,hosting`,
        { timeout: TIMEOUT_MS }
      );
      result = {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        city: data.city || 'Unknown',
        isp: data.isp || 'Unknown',
        isTor: !!(data.proxy || data.hosting),
        cachedAt: Date.now(),
      };
    } else {
      // Free fallback: ipapi.co (1000 req/day, no key needed)
      const { data } = await axios.get(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
        { timeout: TIMEOUT_MS }
      );
      result = {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        city: data.city || 'Unknown',
        isp: data.org || 'Unknown',
        isTor: false,
        cachedAt: Date.now(),
      };
    }

    cache.set(ip, result);
    return result;
  } catch {
    // Return unknown on failure — never block the request
    return { country: 'Unknown', countryCode: 'XX', city: 'Unknown', isp: 'Unknown', isTor: false };
  }
}

export function clearGeoCache() {
  cache.clear();
}

export function getGeoCacheSize() {
  return cache.size;
}
