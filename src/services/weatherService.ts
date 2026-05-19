import {
  WEATHER_API,
  WATERING_CALCULATION_FACTORS,
  TEMPERATURE_THRESHOLDS,
} from "../constants/weather";

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
export const fetchWeather = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData> => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,dew_point_2m,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
    forecast_days: "7",
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    WEATHER_API.TIMEOUT,
  );

  try {
    const response = await fetch(`${WEATHER_API.BASE_URL}?${params}`, {
      signal: controller.signal,
    });
    const payload = (await response.json()) as WeatherData & {
      error?: string;
      reason?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.error || payload.reason || response.statusText || "API error",
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Failed to fetch weather data: request timed out");
    }
    if (error instanceof Error) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
    throw new Error("Network error: Unable to fetch weather data");
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getCurrentHourlyIndex = (weatherData: WeatherData): number => {
  const now = Date.now();
  const hourlyTimes = weatherData.hourly.time;

  if (hourlyTimes.length === 0) return 0;

  const parsedTimes = hourlyTimes.map((time) => new Date(time).getTime());
  const nextHourIndex = parsedTimes.findIndex((time) => time >= now);

  if (nextHourIndex === -1) {
    return hourlyTimes.length - 1;
  }

  if (nextHourIndex === 0) {
    return 0;
  }

  const previousHourIndex = nextHourIndex - 1;
  const previousDelta = Math.abs(now - parsedTimes[previousHourIndex]);
  const nextDelta = Math.abs(parsedTimes[nextHourIndex] - now);

  return previousDelta <= nextDelta ? previousHourIndex : nextHourIndex;
};

/**
 * Calculates watering score based on weather conditions
 * @param weatherData - Weather data from Open-Meteo
 * @returns Watering score (0-100)
 */
export const calculateWateringScore = (weatherData: WeatherData): number => {
  const currentHour = getCurrentHourlyIndex(weatherData);

  // Get current hour's data
  const currentEt =
    weatherData.hourly.et0_fao_evapotranspiration[currentHour] || 0;
  const currentHumidity =
    weatherData.hourly.relative_humidity_2m[currentHour] || 50;
  const currentWind = weatherData.hourly.wind_speed_10m[currentHour] || 0;
  const currentTemp = weatherData.hourly.temperature_2m[currentHour] || 20;
  const currentPrecipitation =
    weatherData.hourly.precipitation[currentHour] || 0;

  // Base score calculation using ET
  let score = currentEt * WATERING_CALCULATION_FACTORS.ET_MULTIPLIER;

  // Adjust for humidity (lower humidity = higher need)
  score *= (100 - currentHumidity) / 100;

  // Adjust for wind (higher wind = higher need)
  score *= 1 + currentWind / WATERING_CALCULATION_FACTORS.WIND_DIVISOR;

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
  const currentHour = getCurrentHourlyIndex(weatherData);
  const next24Hours = weatherData.hourly.temperature_2m.slice(
    currentHour,
    currentHour + 24,
  );

  return next24Hours.some((temp) => temp < TEMPERATURE_THRESHOLDS.FROST);
};

/**
 * Gets times when frost is expected in the next 24 hours
 * @param weatherData - Weather data from Open-Meteo
 * @returns Array of times when frost occurs (HH:MM format)
 */
export const getFrostTimes = (weatherData: WeatherData): string[] => {
  const currentHour = getCurrentHourlyIndex(weatherData);
  const frostTimes: string[] = [];

  for (
    let i = currentHour;
    i < currentHour + 24 && frostTimes.length < 3;
    i++
  ) {
    if (
      i < weatherData.hourly.time.length &&
      weatherData.hourly.temperature_2m[i] < TEMPERATURE_THRESHOLDS.FROST
    ) {
      // Convert ISO time to HH:MM format
      const timeStr = weatherData.hourly.time[i];
      const date = new Date(timeStr);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
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
      return "Clear sky";
    case 1:
    case 2:
    case 3:
      return "Cloudy";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 55:
      return "Drizzle";
    case 56:
    case 57:
      return "Freezing drizzle";
    case 61:
    case 63:
    case 65:
      return "Rain";
    case 66:
    case 67:
      return "Freezing rain";
    case 71:
    case 73:
    case 75:
      return "Snow fall";
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 85:
    case 86:
      return "Snow showers";
    case 95:
    case 96:
    case 97:
      return "Thunderstorm";
    default:
      return "Variable";
  }
};
