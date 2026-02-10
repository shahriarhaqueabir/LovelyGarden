import React from 'react';
import { CloudSun } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { WeatherPanel } from './WeatherPanel';
import { WeatherForecast } from './WeatherForecast';

export const WeatherForecastTab: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CloudSun className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Weather Forecast</h1>
        </div>
        <p className="text-stone-400 text-sm">Real-time weather data for your garden planning</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ErrorBoundary
          FallbackComponent={({ resetErrorBoundary }) => (
            <div className="glass-panel p-4 rounded-lg">
              <p className="text-red-400 text-sm">Weather unavailable</p>
              <button onClick={resetErrorBoundary} className="btn-primary btn-sm mt-2">
                Retry
              </button>
            </div>
          )}
        >
          <WeatherPanel />
        </ErrorBoundary>

        <ErrorBoundary
          FallbackComponent={({ resetErrorBoundary }) => (
            <div className="glass-panel p-4 rounded-lg">
              <p className="text-red-400 text-sm">Forecast unavailable</p>
              <button onClick={resetErrorBoundary} className="btn-primary btn-sm mt-2">
                Retry
              </button>
            </div>
          )}
        >
          <WeatherForecast />
        </ErrorBoundary>
      </div>

      <div className="mt-6 text-xs text-stone-600 p-4 bg-stone-900/20 rounded-xl border border-stone-800">
        <p>Weather data is sourced from Open-Meteo API and reflects actual local conditions.</p>
      </div>
    </div>
  );
};