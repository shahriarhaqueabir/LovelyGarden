import axios from 'axios';
import { WEATHER_API, WATERING_CALCULATION_FACTORS, TEMPERATURE_THRESHOLDS } from '../constants/weather';

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    et0_fao_evapotranspiration: number[];
    dew_point_2m: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/**
 * Fetches weather data from Open-Meteo API
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise<WeatherData>
 */
export const fetchWeather = async (latitude: number, longitude: number): Promise<WeatherData> => {
  try {
    const params = {
      latitude,
      longitude,
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,dew_point_2m,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      timezone: 'auto',
      forecast_days: 7,
    };

    const response = await axios.get(WEATHER_API.BASE_URL, {
      params,
      timeout: WEATHER_API.TIMEOUT,
      headers: {},
    });

    return response.data as WeatherData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch weather data: ${error.response?.data?.error || error.message}`);
    }
    throw new Error('Network error: Unable to fetch weather data');
  }
};

/**
 * Calculates watering score based on weather conditions
 * @param weatherData - Weather data from Open-Meteo
 * @returns Watering score (0-100)
 */
export const calculateWateringScore = (weatherData: WeatherData): number => {
  const currentHour = new Date().getHours();
  
  // Get current hour's data
  const currentEt = weatherData.hourly.et0_fao_evapotranspiration[currentHour] || 0;
  const currentHumidity = weatherData.hourly.relative_humidity_2m[currentHour] || 50;
  const currentWind = weatherData.hourly.wind_speed_10m[currentHour] || 0;
  const currentTemp = weatherData.hourly.temperature_2m[currentHour] || 20;
  const currentPrecipitation = weatherData.hourly.precipitation[currentHour] || 0;

  // Base score calculation using ET
  let score = currentEt * WATERING_CALCULATION_FACTORS.ET_MULTIPLIER;

  // Adjust for humidity (lower humidity = higher need)
  score *= (100 - currentHumidity) / 100;

  // Adjust for wind (higher wind = higher need)
  score *= 1 + (currentWind / WATERING_CALCULATION_FACTORS.WIND_DIVISOR);

  // Adjust for temperature (higher temp = higher need)
  if (currentTemp > TEMPERATURE_THRESHOLDS.SEVERE_HEAT) {
    score *= WATERING_CALCULATION_FACTORS.TEMP_SEVERE_MULTIPLIER;
  } else if (currentTemp > TEMPERATURE_THRESHOLDS.HEAT_STRESS) {
    score *= WATERING_CALCULATION_FACTORS.TEMP_HIGH_MULTIPLIER;
  }

  // Reduce score for recent rain
  score -= Math.min(currentPrecipitation * 0.5, score);

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Checks if there's frost risk in the next 24 hours
 * @param weatherData - Weather data from Open-Meteo
 * @returns True if frost is expected in the next 24 hours
 */
export const hasFrostRisk = (weatherData: WeatherData): boolean => {
  const currentHour = new Date().getHours();
  const next24Hours = weatherData.hourly.temperature_2m.slice(currentHour, currentHour + 24);
  
  return next24Hours.some(temp => temp < TEMPERATURE_THRESHOLDS.FROST);
};

/**
 * Gets times when frost is expected in the next 24 hours
 * @param weatherData - Weather data from Open-Meteo
 * @returns Array of times when frost occurs (HH:MM format)
 */
export const getFrostTimes = (weatherData: WeatherData): string[] => {
  const currentHour = new Date().getHours();
  const frostTimes: string[] = [];
  
  for (let i = currentHour; i < currentHour + 24 && frostTimes.length < 3; i++) {
    if (i < weatherData.hourly.time.length && weatherData.hourly.temperature_2m[i] < TEMPERATURE_THRESHOLDS.FROST) {
      // Convert ISO time to HH:MM format
      const timeStr = weatherData.hourly.time[i];
      const date = new Date(timeStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      frostTimes.push(`${hours}:${minutes}`);
    }
  }
  
  return frostTimes;
};

/**
 * Maps WMO weather code to human-readable description
 * @param code - WMO weather code
 * @returns Human-readable weather description
 */
export const getWeatherDescription = (code: number): string => {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
    case 2:
    case 3:
      return 'Cloudy';
    case 45:
    case 48:
      return 'Fog';
    case 51:
    case 53:
    case 55:
      return 'Drizzle';
    case 56:
    case 57:
      return 'Freezing drizzle';
    case 61:
    case 63:
    case 65:
      return 'Rain';
    case 66:
    case 67:
      return 'Freezing rain';
    case 71:
    case 73:
    case 75:
      return 'Snow fall';
    case 80:
    case 81:
    case 82:
      return 'Rain showers';
    case 85:
    case 86:
      return 'Snow showers';
    case 95:
    case 96:
    case 97:
      return 'Thunderstorm';
    default:
      return 'Variable';
  }
};

// Mock weather service for demonstration purposes (for backward compatibility)
// In a real application, this would connect to a weather API like OpenWeatherMap, WeatherAPI, etc.

export interface OldWeatherData {
  sunlightHours: number;
  moisturePercentage: number;
  temperatureCelsius: number;
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  windSpeed: number; // km/h
  humidity: number; // percentage
  uvIndex: number;
  precipitationChance: number; // percentage
  feelsLike: number; // perceived temperature
}

// Function to generate realistic weather data based on season/day (for backward compatibility)
export const getWeatherForDay = (day: number): OldWeatherData => {
  // Calculate approximate month from day (assuming day 1 = January 1)
  const month = Math.floor(((day - 1) % 365) / 30.42);

  // Base values vary by season (Northern Hemisphere)
  let baseTemp, baseSunlight, baseMoisture;

  // Winter (Dec, Jan, Feb - months 11, 0, 1)
  if (month === 11 || month === 0 || month === 1) {
    baseTemp = 2; // Cold winter
    baseSunlight = 8; // Short winter days
    baseMoisture = 70; // Higher moisture in winter
  }
  // Spring (Mar, Apr, May - months 2, 3, 4)
  else if (month >= 2 && month <= 4) {
    baseTemp = 12; // Mild spring
    baseSunlight = 12; // Growing daylight
    baseMoisture = 65; // Moderate moisture
  }
  // Summer (Jun, Jul, Aug - months 5, 6, 7)
  else if (month >= 5 && month <= 7) {
    baseTemp = 22; // Warm summer
    baseSunlight = 16; // Long summer days
    baseMoisture = 55; // Lower moisture in summer
  }
  // Autumn (Sep, Oct, Nov - months 8, 9, 10)
  else {
    baseTemp = 10; // Cool autumn
    baseSunlight = 10; // Shortening days
    baseMoisture = 68; // Higher moisture in autumn
  }

  // Add some random variation to make it feel more realistic
  const tempVariation = (Math.random() - 0.5) * 8; // ±4°C variation
  const sunlightVariation = (Math.random() - 0.5) * 4; // ±2h variation
  const moistureVariation = (Math.random() - 0.5) * 20; // ±10% variation

  // Determine condition based on moisture and other factors
  let condition: OldWeatherData['condition'] = 'partly-cloudy'; // default
  if (baseMoisture + moistureVariation > 80) {
    condition = Math.random() > 0.7 ? 'stormy' : 'rainy';
  } else if (baseMoisture + moistureVariation > 70) {
    condition = 'cloudy';
  } else if (baseSunlight + sunlightVariation > 14) {
    condition = 'sunny';
  } else if (baseSunlight + sunlightVariation > 10) {
    condition = 'partly-cloudy';
  }

  return {
    sunlightHours: Math.max(0, Math.min(24, parseFloat((baseSunlight + sunlightVariation).toFixed(1)))),
    moisturePercentage: Math.max(0, Math.min(100, Math.round(baseMoisture + moistureVariation))),
    temperatureCelsius: parseFloat((baseTemp + tempVariation).toFixed(1)),
    condition,
    windSpeed: Math.round(Math.random() * 20), // 0-20 km/h
    humidity: Math.max(30, Math.min(100, Math.round(baseMoisture + moistureVariation + 10))),
    uvIndex: Math.max(0, Math.min(11, Math.round((baseSunlight / 16) * 10))), // UV index based on sunlight
    precipitationChance: Math.max(0, Math.min(100, Math.round((100 - baseMoisture - moistureVariation) / 2))),
    feelsLike: parseFloat((baseTemp + tempVariation + (Math.random() - 0.5)).toFixed(1))
  };
};

// Function to simulate weather updates (would connect to real API in production) - for backward compatibility
export const updateWeather = async (currentDay: number): Promise<OldWeatherData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // In a real app, this would fetch from a weather API
  // For now, return generated data
  return getWeatherForDay(currentDay);
};