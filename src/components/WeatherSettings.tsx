import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWeatherStore } from '../stores/weatherStore';
import { reverseGeocode, debounce, MAX_SUGGESTIONS } from '../utils/geocoding';
import { toast } from '../lib/toast';

// Constants
const DEFAULT_LATITUDE = 52.52; // Berlin coordinates as default
const DEFAULT_LONGITUDE = 13.41;

// Types
interface LocationState {
  cityName: string;
  latitude: number;
  longitude: number;
  isCitySelected: boolean;
}

import { POPULAR_CITIES } from '../constants/locations';

const schema = z.object({
  city: z.string().min(1, 'City name is required'),
});

type FormData = z.infer<typeof schema>;

export const WeatherSettings: React.FC = () => {
  const { 
    latitude: storeLatitude, 
    longitude: storeLongitude, 
    setLocation,
    fetchWeatherData
  } = useWeatherStore();

  const [locationState, setLocationState] = useState<LocationState>({
    cityName: 'Select',
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    isCitySelected: false,
  });

  const [filteredCities, setFilteredCities] = useState<typeof POPULAR_CITIES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update local state when store values change
  useEffect(() => {
    if (storeLatitude !== null && storeLongitude !== null) {
      setLocationState(prev => {
        const newState = {
          ...prev,
          latitude: storeLatitude,
          longitude: storeLongitude,
        };

        // If the coordinates changed externally (not by user city selection), reset the flag
        if (storeLatitude !== prev.latitude || storeLongitude !== prev.longitude) {
          newState.isCitySelected = false;
        }

        // Only reverse geocode if user hasn't explicitly selected a city
        if (!newState.isCitySelected) {
          reverseGeocode(storeLatitude, storeLongitude).then(foundCityName => {
            if (foundCityName === 'Unknown Location' || foundCityName === 'Location Lookup Failed') {
              newState.cityName = 'Select';
            } else {
              newState.cityName = foundCityName;
            }
            setLocationState(newState);
          }).catch(() => {
            newState.cityName = 'Select';
            setLocationState(newState);
          });
        }

        return newState;
      });
    } else {
      setLocationState(prev => ({ ...prev, cityName: 'Select' }));
    }
  }, [storeLatitude, storeLongitude]);

  const { register, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: locationState.cityName,
    },
  });

  // Watch the city input to show suggestions
  const watchedCity = watch('city');

  // Reset form when location state changes
  useEffect(() => {
    reset({
      city: locationState.cityName,
    });
  }, [locationState, reset]);

  // Debounced city filtering
  const debouncedFilterCities = useMemo(
    () => debounce((query: string) => {
      if (query && query.length > 1) {
        const filtered = POPULAR_CITIES.filter(city =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.country.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredCities(filtered.slice(0, MAX_SUGGESTIONS));
        setShowSuggestions(true);
      } else {
        setFilteredCities([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  // Filter cities based on user input
  useEffect(() => {
    debouncedFilterCities(watchedCity);
  }, [watchedCity, debouncedFilterCities]);

  const onSubmit = async () => {
    // Use the location state which is always up to date
    if (locationState.cityName && locationState.cityName !== 'Select') {
      // Use the coordinates from the selected city
      setLocation(locationState.latitude, locationState.longitude, locationState.cityName);
      await fetchWeatherData(true);
      toast.success(`Location set to ${locationState.cityName}`);
    }
  };

  // Handle city selection from dropdown
  const handleCitySelect = (city: typeof POPULAR_CITIES[0]) => {
    const cityName = `${city.name}, ${city.country}`;
    setLocationState({
      cityName,
      latitude: city.lat,
      longitude: city.lng,
      isCitySelected: true, // Mark that user explicitly selected a city
    });
    // Automatically save the location when a city is selected
    setLocation(city.lat, city.lng, cityName);
    fetchWeatherData(true);
    setFilteredCities([]);
    setShowSuggestions(false);
    toast.success(`Location updated to ${cityName}`);
  };

  return (
    <div className="glass-panel rounded-2xl border border-stone-800 p-6">
      <h3 className="text-lg font-bold text-stone-100 mb-4">Weather Location</h3>

      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="city" className="block text-sm font-medium text-stone-300 mb-1">
            Select City
          </label>
          <input
            id="city"
            type="text"
            {...register('city')}
            className={`w-full p-3 rounded-lg bg-stone-800 border ${
              errors.city ? 'border-red-500' : 'border-stone-700'
            } text-stone-100 focus:outline-none focus:ring-2 focus:ring-garden-500`}
            placeholder="Select a city from the list"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : undefined}
            onFocus={() => watchedCity && watchedCity.length > 1 && debouncedFilterCities(watchedCity)}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-stone-800 border border-stone-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCities.map((city, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-stone-700 cursor-pointer border-b border-stone-700 last:border-b-0"
                  onClick={() => handleCitySelect(city)}
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-sm text-stone-400">{city.country} ({city.lat.toFixed(4)}, {city.lng.toFixed(4)})</div>
                </div>
              ))}
            </div>
          )}
          
          {errors.city && (
            <p id="city-error" className="mt-1 text-sm text-red-400">
              {errors.city.message}
            </p>
          )}
        </div>


        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-garden-600 hover:bg-garden-500 rounded-lg text-white font-medium transition-colors"
          >
            Save Location
          </button>

          {(storeLatitude !== null || locationState.latitude) && (storeLongitude !== null || locationState.longitude) && (
            <div className="text-sm text-stone-400">
              Current: {locationState.latitude.toFixed(2)}, {locationState.longitude.toFixed(2)}
              {locationState.cityName !== 'Select' && locationState.cityName !== 'Unknown Location' && `. ${locationState.cityName}.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


