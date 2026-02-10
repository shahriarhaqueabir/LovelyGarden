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

  // Actions
  setLocation: (lat: number, lng: number) => void;
  fetchWeatherData: () => Promise<void>;
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

      // Actions
      setLocation: (lat: number, lng: number) => {
        set({ latitude: lat, longitude: lng, error: null });
      },

      fetchWeatherData: async () => {
        const { latitude, longitude, lastFetch } = get();
        
        // Don't fetch more than once per hour
        if (lastFetch && Date.now() - lastFetch < WEATHER_API.CACHE_DURATION) {
          return;
        }

        if (!latitude || !longitude) {
          set({ error: 'Location not set. Please enable location or set coordinates manually.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const weatherData = await fetchWeather(latitude, longitude);
          
          const wateringScore = calculateWateringScore(weatherData);
          const hasFrost = hasFrostRisk(weatherData);
          
          set({
            data: weatherData,
            wateringScore,
            hasFrost,
            lastFetch: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch weather data',
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
        data: state.data,
        wateringScore: state.wateringScore,
        hasFrost: state.hasFrost,
        lastFetch: state.lastFetch,
      }),
    }
  )
);