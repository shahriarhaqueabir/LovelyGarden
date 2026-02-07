import React, { useState, useEffect } from 'react';
import { CloudSun, Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Thermometer, Eye, Gauge } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';

interface WeatherForecastTabProps {
  currentDay: number;
}

export const WeatherForecastTab: React.FC<WeatherForecastTabProps> = ({ currentDay }) => {
  const { weather, loading, error } = useWeather(currentDay);
  const [forecast, setForecast] = useState<any[]>([]);

  // Generate a simple forecast for the next 7 days
  useEffect(() => {
    if (weather) {
      const generatedForecast = [];
      for (let i = 0; i < 7; i++) {
        // Generate weather based on current weather with slight variations
        const tempChange = (Math.random() - 0.5) * 5; // -2.5 to +2.5 degrees
        const moistureChange = (Math.random() - 0.5) * 15; // -7.5 to +7.5%
        const sunlightChange = (Math.random() - 0.5) * 2; // -1 to +1 hour
        
        generatedForecast.push({
          day: currentDay + i,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          temperature: Math.round(weather.temperatureCelsius + tempChange),
          moisture: Math.max(0, Math.min(100, Math.round(weather.moisturePercentage + moistureChange))),
          sunlight: Math.max(0, Math.min(24, parseFloat((weather.sunlightHours + sunlightChange).toFixed(1)))),
          condition: getConditionForTempAndMoisture(weather.temperatureCelsius + tempChange, weather.moisturePercentage + moistureChange),
          wind: Math.round(weather.windSpeed + (Math.random() - 0.5) * 5),
          uvIndex: Math.max(0, Math.min(11, Math.round(weather.uvIndex + (Math.random() - 0.5) * 2))),
          precipitation: Math.max(0, Math.min(100, Math.round(weather.precipitationChance + (Math.random() - 0.5) * 20))),
        });
      }
      setForecast(generatedForecast);
    }
  }, [weather, currentDay]);

  // Helper function to determine condition based on temp and moisture
  const getConditionForTempAndMoisture = (temp: number, moisture: number) => {
    if (moisture > 80) {
      return temp < 0 ? 'snowy' : 'rainy';
    } else if (moisture > 60) {
      return 'cloudy';
    } else if (temp > 25) {
      return 'sunny';
    } else if (temp > 15) {
      return 'partly-cloudy';
    } else {
      return 'cloudy';
    }
  };

  // Get icon based on condition
  const getWeatherIcon = (condition: string) => {
    switch(condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-amber-400" />;
      case 'partly-cloudy': return <Cloud className="w-6 h-6 text-gray-400" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'stormy': return <Cloud className="w-6 h-6 text-gray-700" />;
      case 'snowy': return <CloudSnow className="w-6 h-6 text-blue-200" />;
      default: return <Sun className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CloudSun className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Weather Forecast</h1>
        </div>
        <p className="text-stone-400 text-sm">7-day forecast for your garden planning</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-400">Error loading weather data: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-lg font-bold text-stone-100 mb-4">Current Conditions</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-stone-500">Loading weather data...</p>
            </div>
          ) : weather ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-6xl mb-4">
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-stone-100">{weather.temperatureCelsius}°C</h3>
                <p className="text-stone-400 capitalize">{weather.condition.replace('-', ' ')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="flex items-center gap-2 p-3 bg-stone-800/30 rounded-lg">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-stone-500">Humidity</p>
                    <p className="font-bold text-stone-200">{weather.moisturePercentage}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-stone-800/30 rounded-lg">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs text-stone-500">Sunlight</p>
                    <p className="font-bold text-stone-200">{weather.sunlightHours}h</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-stone-800/30 rounded-lg">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs text-stone-500">Wind</p>
                    <p className="font-bold text-stone-200">{weather.windSpeed} km/h</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-stone-800/30 rounded-lg">
                  <Gauge className="w-4 h-4 text-violet-400" />
                  <div>
                    <p className="text-xs text-stone-500">UV Index</p>
                    <p className="font-bold text-stone-200">{weather.uvIndex}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-stone-500">No weather data available</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-lg font-bold text-stone-100 mb-4">7-Day Forecast</h2>
          
          {forecast.length > 0 ? (
            <div className="space-y-3">
              {forecast.map((day, index) => (
                <div 
                  key={day.day} 
                  className={`p-4 rounded-xl border ${
                    index === 0 
                      ? 'bg-garden-900/20 border-garden-700/30' 
                      : 'bg-stone-800/20 border-stone-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getWeatherIcon(day.condition)}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-100">{day.date}</h3>
                        <p className="text-xs text-stone-500">Day {day.day}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-stone-100">{day.temperature}°C</p>
                        <p className="text-xs text-stone-500 capitalize">{day.condition.replace('-', ' ')}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 text-stone-400">
                        <div className="flex items-center gap-1">
                          <Droplets className="w-4 h-4" />
                          <span className="text-xs">{day.moisture}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sun className="w-4 h-4" />
                          <span className="text-xs">{day.sunlight}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">{day.precipitation}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-stone-500">Generating forecast...</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
        <h2 className="text-lg font-bold text-stone-100 mb-4">Garden Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-stone-800/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-stone-100">Watering Needs</h3>
            </div>
            <p className="text-sm text-stone-400">
              {weather && weather.moisturePercentage < 40 
                ? 'High watering needs due to low humidity' 
                : weather && weather.moisturePercentage > 70 
                  ? 'Reduced watering needs due to high humidity' 
                  : 'Moderate watering needs'}
            </p>
          </div>
          
          <div className="p-4 bg-stone-800/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-stone-100">Sun Exposure</h3>
            </div>
            <p className="text-sm text-stone-400">
              {weather && weather.sunlightHours > 12 
                ? 'Optimal sunlight for sun-loving plants' 
                : weather && weather.sunlightHours < 6 
                  ? 'Consider shade-tolerant plants' 
                  : 'Balanced sunlight conditions'}
            </p>
          </div>
          
          <div className="p-4 bg-stone-800/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-stone-100">Temperature</h3>
            </div>
            <p className="text-sm text-stone-400">
              {weather && weather.temperatureCelsius > 25 
                ? 'Warm conditions, good for warm-season crops' 
                : weather && weather.temperatureCelsius < 10 
                  ? 'Cool conditions, protect sensitive plants' 
                  : 'Moderate temperatures, suitable for most plants'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-stone-600 p-4 bg-stone-900/20 rounded-xl border border-stone-800">
        <p>Weather data is simulated based on seasonal patterns and may not reflect actual local weather conditions.</p>
      </div>
    </div>
  );
};