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
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

import { POPULAR_CITIES } from '../constants/locations';

// Simple reverse geocoding function using Open-Meteo's geocoding API or local database
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseGeocodingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GEOCODING_CACHE_DURATION) {
    return cached.cityName;
  }

  // 1. Check local database for matches (within 0.1 degree tolerance ~11km)
  const match = POPULAR_CITIES.find(city => 
    Math.abs(city.lat - lat) < 0.1 && Math.abs(city.lng - lng) < 0.1
  );

  if (match) {
    const cityName = `${match.name}, ${match.country}`;
    reverseGeocodingCache.set(cacheKey, { cityName, timestamp: Date.now() });
    return cityName;
  }

  // 2. Open-Meteo search endpoint does not natively support lat/lng reverse lookups
  // For a production app, we would use a real reverse geocoding service here.
  // Using 'Unknown Location' so the UI can decide how to handle it.
  const cityName = 'Unknown Location';
  reverseGeocodingCache.set(cacheKey, { cityName, timestamp: Date.now() });
  return cityName;
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
