import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeatherData, fetchWeather, calculateWateringScore, hasFrostRisk } from '../services/weatherService';
import { WEATHER_API } from '../constants/weather';

interface WeatherState {
  // Data
  data: WeatherData | null;
  wateringScore: number;
  hasFrost: boolean;

  // UI
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // User location
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;

  // Actions
  setLocation: (lat: number, lng: number, name?: string) => void;
  fetchWeatherData: (force?: boolean) => Promise<void>;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: null,
      wateringScore: 0,
      hasFrost: false,
      isLoading: false,
      error: null,
      lastFetch: null,
      latitude: null,
      longitude: null,
      locationName: null,

      // Actions
      setLocation: (lat: number, lng: number, name?: string) => {
        set({ latitude: lat, longitude: lng, locationName: name || null, error: null });
      },

      fetchWeatherData: async (force = false) => {
        const { latitude, longitude, lastFetch, locationName } = get();
        
        // Don't fetch more than once per hour unless forced
        if (!force && lastFetch && Date.now() - lastFetch < WEATHER_API.CACHE_DURATION && locationName) {
          return;
        }

        if (!latitude || !longitude) {
          set({ error: 'Location not set. Please enable location or set coordinates manually.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { reverseGeocode } = await import('../utils/geocoding');
          const [weatherData, cityName] = await Promise.all([
            fetchWeather(latitude, longitude),
            locationName ? Promise.resolve(locationName) : reverseGeocode(latitude, longitude)
          ]);
          
          const wateringScore = calculateWateringScore(weatherData);
          const hasFrost = hasFrostRisk(weatherData);
          
          set({
            data: weatherData,
            locationName: cityName !== 'Unknown Location' ? cityName : null,
            wateringScore,
            hasFrost,
            lastFetch: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to fetch weather data',
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'weather-store',
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        locationName: state.locationName,
        data: state.data,
        wateringScore: state.wateringScore,
        hasFrost: state.hasFrost,
        lastFetch: state.lastFetch,
      }),
    }
  )
);