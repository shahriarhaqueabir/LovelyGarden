import React, { useEffect } from 'react';
import { RefreshCw, Droplets, Wind, Snowflake, Thermometer } from 'lucide-react';
import { useWeatherStore } from '../stores/weatherStore';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const WeatherPanel: React.FC = () => {
  const { t } = useTranslation('weather');
  const {
    data,
    wateringScore,
    hasFrost,
    isLoading,
    error,
    fetchWeatherData,
    clearError,
  } = useWeatherStore();

  // Show frost alert when frost is detected
  useEffect(() => {
    if (hasFrost) {
      toast(t('frostWarning'), {
        icon: '❄️',
        duration: 10000,
        id: 'frost-alert', // Prevents duplicates
      });
    }
  }, [hasFrost, t]);

  // Show watering alert when watering score is high
  useEffect(() => {
    if (wateringScore >= 80) {
      toast(t('wateringUrgent'), {
        icon: '💧',
        duration: 8000,
        id: 'watering-urgent',
      });
    } else if (wateringScore >= 60) {
      toast(t('wateringHigh'), {
        icon: '💧',
        duration: 6000,
        id: 'watering-high',
      });
    }
  }, [wateringScore, t]);

  const handleRefresh = () => {
    fetchWeatherData();
  };

  // Determine watering score color
  const scoreColor = wateringScore >= 80 ? 'bg-red-500' :
                    wateringScore >= 60 ? 'bg-orange-500' :
                    wateringScore >= 40 ? 'bg-yellow-500' :
                    'bg-green-500';

  return (
    <div className="glass-panel rounded-2xl border border-stone-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-stone-100">{t('title')}</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn-icon p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-50 transition-colors"
          aria-label={t('refresh')}
        >
          <RefreshCw className={`w-4 h-4 text-stone-300 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              ×
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="spinner-md animate-spin rounded-full h-8 w-8 border-b-2 border-garden-400" aria-label="Loading weather"></div>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Thermometer className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-xs text-stone-500">{t('temperature')}</p>
                <p className="font-bold text-stone-200">{data.current.temperature_2m.toFixed(1)}°C</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Droplets className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-xs text-stone-500">{t('humidity')}</p>
                <p className="font-bold text-stone-200">{data.current.relative_humidity_2m}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Wind className="w-6 h-6 text-cyan-400" />
              <div>
                <p className="text-xs text-stone-500">{t('wind')}</p>
                <p className="font-bold text-stone-200">{data.current.wind_speed_10m} km/h</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-stone-300">{t('wateringNeed')}</h4>
              <span className="text-sm font-bold text-stone-400">{wateringScore}/100</span>
            </div>
            <div 
              className="w-full bg-stone-800 rounded-full h-2.5"
              role="progressbar"
              aria-valuenow={wateringScore}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div 
                className={`h-2.5 rounded-full ${scoreColor}`}
                style={{ width: `${wateringScore}%` }}
              ></div>
            </div>
          </div>

          {hasFrost && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-800 rounded-lg flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-blue-300">{t('frostWarning')}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40">
          <p className="text-stone-500">{t('noData')}</p>
        </div>
      )}
    </div>
  );
};