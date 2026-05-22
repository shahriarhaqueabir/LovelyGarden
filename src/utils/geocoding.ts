import { showError } from "../lib/toast";

// Constants
export const MAX_SUGGESTIONS = 8;
export const GEOCODING_CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Cache for geocoding results
const geocodingCache = new Map<
  string,
  { lat: number; lng: number; timestamp: number }
>();
const reverseGeocodingCache = new Map<
  string,
  { cityName: string; timestamp: number }
>();

// Debounce utility
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

import { POPULAR_CITIES } from "../constants/locations";

// Simple reverse geocoding function using Open-Meteo's geocoding API or local database
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<string> => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseGeocodingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GEOCODING_CACHE_DURATION) {
    return cached.cityName;
  }

  // 1. Check local database for matches (within 0.1 degree tolerance ~11km)
  const match = POPULAR_CITIES.find(
    (city) => Math.abs(city.lat - lat) < 0.1 && Math.abs(city.lng - lng) < 0.1,
  );

  if (match) {
    const cityName = `${match.name}, ${match.country}`;
    reverseGeocodingCache.set(cacheKey, { cityName, timestamp: Date.now() });
    return cityName;
  }

  // 2. Try a lightweight OpenStreetMap Nominatim reverse lookup (client-side).
  //    This improves location display for most users while remaining optional.
  //    Respect Nominatim usage: keep responses cached and the request minimal.
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      addressdetails: "1",
      zoom: "10",
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // `User-Agent` cannot be set from browsers; keep request minimal.
        "Accept-Language": "en",
      },
    });

    window.clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const address = data?.address ?? {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.municipality ||
        address.county;

      const display =
        city ||
        (data?.display_name ? String(data.display_name).split(",")[0] : null);

      const cityName = display ? `${display}` : "Unknown Location";
      reverseGeocodingCache.set(cacheKey, { cityName, timestamp: Date.now() });
      return cityName;
    }
  } catch (error) {
    // Silent fallback — keep the UI resilient when the network or service fails.
    // Nominatim may reject high-volume usage; this is a best-effort client-side attempt.

    console.warn("Reverse geocode failed:", error);
  }

  const fallbackName = "Unknown Location";
  reverseGeocodingCache.set(cacheKey, {
    cityName: fallbackName,
    timestamp: Date.now(),
  });
  return fallbackName;
};

// Simple geocoding function using Open-Meteo's geocoding API
export const geocode = async (
  city: string,
): Promise<{ lat: number; lng: number }> => {
  const cacheKey = city.toLowerCase().trim();
  const cached = geocodingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GEOCODING_CACHE_DURATION) {
    return { lat: cached.lat, lng: cached.lng };
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const coords = { lat: result.latitude, lng: result.longitude };

      geocodingCache.set(cacheKey, { ...coords, timestamp: Date.now() });
      return coords;
    }
    throw new Error("City not found");
  } catch (error) {
    console.error("Geocoding failed:", error);
    showError(
      `Failed to find coordinates for "${city}". Please try a different city name.`,
    );
    throw error;
  }
};
