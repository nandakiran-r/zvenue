/**
 * Mappls (MapmyIndia) geocoding service with OAuth2 authentication.
 *
 * Uses Mappls REST APIs — best Indian address coverage.
 * Automatically handles token generation and caching.
 *
 * Set VITE_MAPPLS_CLIENT_ID and VITE_MAPPLS_CLIENT_SECRET in admin/.env
 */

const CLIENT_ID = import.meta.env.VITE_MAPPLS_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_MAPPLS_CLIENT_SECRET || '';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export interface MapplsAutosuggestResult {
  eLoc: string;
  placeName: string;
  placeAddress: string;
  latitude: number;
  longitude: number;
  type: string;
  orderIndex: number;
}

export interface MapplsReverseResult {
  formatted_address: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  locality: string;
  subLocality: string;
  street: string;
  houseNumber: string;
  lat: string;
  lng: string;
}

/**
 * Get OAuth2 access token from Mappls. Cached until expiry.
 */
async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Mappls credentials missing. Set VITE_MAPPLS_CLIENT_ID and VITE_MAPPLS_CLIENT_SECRET');
    return null;
  }

  try {
    const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!res.ok) {
      console.error('Mappls token error:', res.status);
      return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000; // refresh 5min early
    return cachedToken;
  } catch (err) {
    console.error('Mappls token fetch failed:', err);
    return null;
  }
}

/**
 * Search for places/addresses in India using Mappls Autosuggest.
 * Returns up to 20 results with excellent Indian address coverage.
 */
export async function searchAddress(query: string): Promise<MapplsAutosuggestResult[]> {
  if (!query || query.trim().length < 3) return [];

  const token = await getToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      region: 'IND',
      tokenizeAddress: 'true',
    });

    const res = await fetch(`https://atlas.mappls.com/api/places/search/json?${params}`, {
      headers: { 'Authorization': `bearer ${token}`, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 401) { cachedToken = null; tokenExpiresAt = 0; }
      console.error('Mappls search error:', res.status);
      return [];
    }

    const data = await res.json();
    const results = data.suggestedLocations || [];

    return results.slice(0, 20).map((item: any, index: number) => ({
      eLoc: item.eLoc || '',
      placeName: item.placeName || '',
      placeAddress: item.placeAddress || '',
      latitude: parseFloat(item.latitude || '0'),
      longitude: parseFloat(item.longitude || '0'),
      type: item.type || '',
      orderIndex: index,
    }));
  } catch (err) {
    console.error('Mappls search failed:', err);
    return [];
  }
}

/**
 * Reverse geocode: Get address from coordinates using Mappls.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<MapplsReverseResult | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://apis.mappls.com/advancedmaps/v1/${token}/rev_geocode?lat=${lat}&lng=${lng}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) {
      console.error('Mappls reverse geocode error:', res.status);
      return null;
    }

    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) return null;

    const r = results[0];
    return {
      formatted_address: r.formatted_address || '',
      area: r.area || '',
      city: r.city || r.district || '',
      district: r.district || '',
      state: r.state || '',
      pincode: r.pincode || '',
      locality: r.locality || '',
      subLocality: r.subLocality || r.sub_locality || '',
      street: r.street || '',
      houseNumber: r.houseNumber || r.house_number || '',
      lat: String(lat),
      lng: String(lng),
    };
  } catch (err) {
    console.error('Mappls reverse geocode failed:', err);
    return null;
  }
}
