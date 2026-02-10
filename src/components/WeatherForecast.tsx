import React from 'react';
import { Droplets, Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
import { useWeatherStore } from '../stores/weatherStore';
import { useTranslation } from 'react-i18next';

export const WeatherForecast: React.FC = () => {
  const { t } = useTranslation('weather');
  const { data } = useWeatherStore();

  if (!data || !data.daily) {
    return (
      <div className="glass-panel rounded-2xl border border-stone-800 p-6">
        <h3 className="text-lg font-bold text-stone-100 mb-4">{t('forecast')}</h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-stone-500">{t('noData')}</p>
        </div>
      </div>
    );
  }

  // Prepare forecast data
  const forecastItems = data.daily.time.map((date, index) => {
    const maxTemp = data.daily.temperature_2m_max[index];
    const minTemp = data.daily.temperature_2m_min[index];
    const precipitationSum = data.daily.precipitation_sum[index];

    // Simple way to determine icon based on precipitation and temperature
    let IconComponent = Sun;
    if (precipitationSum > 5) {
      IconComponent = precipitationSum > 10 ? CloudRain : Droplets;
    } else if (minTemp < 0) {
      IconComponent = CloudSnow;
    } else if (precipitationSum > 0) {
      IconComponent = Cloud;
    }

    // Format date to show day of week
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayOfMonth = dateObj.getDate();

    return {
      date: `${dayOfWeek} ${dayOfMonth}`,
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      precipitation: precipitationSum,
      Icon: IconComponent,
    };
  });

  return (
    <div className="glass-panel rounded-2xl border border-stone-800 p-6">
      <h3 className="text-lg font-bold text-stone-100 mb-4">7-Day Forecast</h3>
      <div className="space-y-3">
        {forecastItems.map((day, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-xl border ${
              index === 0
                ? 'bg-garden-900/20 border-garden-700/30'
                : 'bg-stone-800/20 border-stone-700/30'
            }`}
            tabIndex={0}
            aria-label={`Forecast for ${day.date}: High ${day.maxTemp}°, Low ${day.minTemp}°, Precipitation ${day.precipitation}mm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <day.Icon className="w-6 h-6 text-stone-400" />
                <div>
                  <h4 className="font-bold text-stone-100">{day.date}</h4>
                  <p className="text-xs text-stone-500">Day {index + 1}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-stone-100">{day.maxTemp}°/{day.minTemp}°</p>
                  <p className="text-xs text-stone-500">Max/Min</p>
                </div>

                <div className="flex items-center gap-1 text-stone-400">
                  <Droplets className="w-4 h-4" />
                  <span className="text-xs">{day.precipitation.toFixed(1)}mm</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};