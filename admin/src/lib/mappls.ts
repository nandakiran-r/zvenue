/**
 * Geocoding service client — calls backend proxy which handles Mappls OAuth2.
 * 
 * The browser can't call Mappls directly (CORS blocked), so we proxy through
 * our own server at /api/geocode/search and /api/geocode/reverse.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
 * Search for places/addresses in India via backend proxy → Mappls.
 * Returns up to 20 results.
 */
export async function searchAddress(query: string): Promise<MapplsAutosuggestResult[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/geocode/search?query=${encodeURIComponent(query.trim())}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Geocode search error:', res.status);
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
    console.error('Geocode search failed:', err);
    return [];
  }
}

/**
 * Reverse geocode: Get address from coordinates via backend proxy → Mappls.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<MapplsReverseResult | null> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Reverse geocode error:', res.status);
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
    console.error('Reverse geocode failed:', err);
    return null;
  }
}
