import { showError } from '../lib/toast';

// Constants
export const MAX_SUGGESTIONS = 8;
export const GEOCODING_CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Cache for geocoding results
const geocodingCache = new Map<string, { lat: number; lng: number; timestamp: number }>();
const reverseGeocodingCache = new Map<string, { cityName: string; timestamp: number }>();

// Debounce utility
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Simple reverse geocoding function using Open-Meteo's geocoding API
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseGeocodingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GEOCODING_CACHE_DURATION) {
    return cached.cityName;
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lng}&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const cityName = result.name || `${result.admin1 || ''}${result.country ? `, ${result.country}` : ''}`.trim() || 'Unknown Location';

      reverseGeocodingCache.set(cacheKey, { cityName, timestamp: Date.now() });
      return cityName;
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    showError('Failed to lookup location name. Please check your connection.');
    return 'Location Lookup Failed';
  }
};

// Simple geocoding function using Open-Meteo's geocoding API
export const geocode = async (city: string): Promise<{ lat: number; lng: number }> => {
  const cacheKey = city.toLowerCase().trim();
  const cached = geocodingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GEOCODING_CACHE_DURATION) {
    return { lat: cached.lat, lng: cached.lng };
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const coords = { lat: result.latitude, lng: result.longitude };

      geocodingCache.set(cacheKey, { ...coords, timestamp: Date.now() });
      return coords;
    }
    throw new Error('City not found');
  } catch (error) {
    console.error('Geocoding failed:', error);
    showError(`Failed to find coordinates for "${city}". Please try a different city name.`);
    throw error;
  }
};
