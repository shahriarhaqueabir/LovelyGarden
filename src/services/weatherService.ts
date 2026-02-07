// Mock weather service for demonstration purposes
// In a real application, this would connect to a weather API like OpenWeatherMap, WeatherAPI, etc.

export interface WeatherData {
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

// Weather forecast for the next 7 days
export interface WeatherForecast {
  today: WeatherData;
  tomorrow: WeatherData;
  nextDays: WeatherData[];
}

// Function to generate realistic weather data based on season/day
export const getWeatherForDay = (day: number): WeatherData => {
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
  let condition: WeatherData['condition'] = 'partly-cloudy'; // default
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

// Function to get weather forecast for the current day and upcoming days
export const getWeatherForecast = (currentDay: number): WeatherForecast => {
  return {
    today: getWeatherForDay(currentDay),
    tomorrow: getWeatherForDay(currentDay + 1),
    nextDays: [
      getWeatherForDay(currentDay + 2),
      getWeatherForDay(currentDay + 3),
      getWeatherForDay(currentDay + 4),
      getWeatherForDay(currentDay + 5),
      getWeatherForDay(currentDay + 6)
    ]
  };
};

// Function to get current weather data
export const getCurrentWeather = (currentDay: number): WeatherData => {
  return getWeatherForDay(currentDay);
};

// Function to simulate weather updates (would connect to real API in production)
export const updateWeather = async (currentDay: number): Promise<WeatherData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // In a real app, this would fetch from a weather API
  // For now, return generated data
  return getWeatherForDay(currentDay);
};