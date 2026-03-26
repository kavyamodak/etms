/**
 * Geocoding Service
 * Converts address strings to coordinates using OpenRouteService
 * Implements caching to minimize API calls
 */

interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
  source: 'cache' | 'api' | 'fallback';
}

// In-memory cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult>();

// Mock fallback coordinates for common locations (India)
const FALLBACK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'offices': { lat: 28.5481, lng: 77.0841 }, // Dwarka, Delhi
  'office': { lat: 28.5481, lng: 77.0841 },
  'dwarka': { lat: 28.5481, lng: 77.0841 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
};

// Initialize cache from localStorage on module load
const initializeCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('geocode_cache');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        geocodeCache.set(key, value);
      });
    }
  } catch (err) {
    console.warn('Failed to load geocode cache from storage:', err);
  }
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  try {
    const cacheObj = Object.fromEntries(geocodeCache);
    localStorage.setItem('geocode_cache', JSON.stringify(cacheObj));
  } catch (err) {
    console.warn('Failed to save geocode cache:', err);
  }
};

// Initialize cache on module load
initializeCacheFromStorage();

/**
 * Geocode an address using OpenRouteService
 * Returns cached result if available, otherwise calls API
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || !address.trim()) {
    return {
      lat: 28.7041,
      lng: 77.1025,
      address: 'Default (Delhi)',
      source: 'fallback',
    };
  }

  const normalizedAddress = address.toLowerCase().trim();
  const cacheKey = normalizedAddress;

  // Check in-memory cache first
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey)!;
    return { ...cached, source: 'cache' };
  }

  // Check fallback coordinates
  const fallbackKey = normalizedAddress.split(',')[0].toLowerCase().trim();
  for (const [key, coords] of Object.entries(FALLBACK_COORDINATES)) {
    if (normalizedAddress.includes(key) || normalizedAddress.startsWith(key)) {
      const result: GeocodingResult = {
        lat: coords.lat,
        lng: coords.lng,
        address: address,
        source: 'fallback',
      };
      geocodeCache.set(cacheKey, { ...result, source: 'fallback' });
      saveCacheToStorage();
      return result;
    }
  }

  // Try OpenRouteService API
  try {
    const apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI0NTVhMTAyNGJkZDRjODk5ZTQyZjc1MDVmMzhlYTJhIiwiaCI6Im11cm11cjY0In0';
    
    const response = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&layers=address&size=1`
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.geometry.coordinates;

      const result: GeocodingResult = {
        lat,
        lng,
        address: feature.properties.name || address,
        source: 'api',
      };

      geocodeCache.set(cacheKey, result);
      saveCacheToStorage();
      return result;
    }

    // API returned no results, use fallback
    const fallback: GeocodingResult = {
      lat: 28.7041,
      lng: 77.1025,
      address: address,
      source: 'fallback',
    };
    geocodeCache.set(cacheKey, fallback);
    saveCacheToStorage();
    return fallback;
  } catch (error) {
    console.error('Geocoding API error:', error);

    // Fallback to mock coordinates
    const fallback: GeocodingResult = {
      lat: 28.7041,
      lng: 77.1025,
      address: address,
      source: 'fallback',
    };
    geocodeCache.set(cacheKey, fallback);
    saveCacheToStorage();
    return fallback;
  }
}

/**
 * Geocode multiple addresses in batch
 * Returns array of GeocodingResult
 */
export async function geocodeMultiple(addresses: string[]): Promise<GeocodingResult[]> {
  return Promise.all(addresses.map(addr => geocodeAddress(addr)));
}

/**
 * Clear cache and reset
 */
export function clearGeocodeCache() {
  geocodeCache.clear();
  localStorage.removeItem('geocode_cache');
}

/**
 * Get cache statistics
 */
export function getGeocodeStats() {
  return {
    cacheSize: geocodeCache.size,
    cachedAddresses: Array.from(geocodeCache.keys()),
  };
}

export default {
  geocodeAddress,
  geocodeMultiple,
  clearGeocodeCache,
  getGeocodeStats,
};
