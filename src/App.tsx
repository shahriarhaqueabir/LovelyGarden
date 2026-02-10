import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hydrateDatabase, getDatabase } from './db';
import { applyTheme, applyBackgroundColor } from './utils/theme';
import { PlantSpecies } from './schema/knowledge-graph';
import { Tabs, TabPanel } from './components/Tabs';
import { VirtualGardenTab } from './components/VirtualGardenTab';
import { SowingCalendarTab } from './components/SowingCalendarTab';
import { PlantKnowledgebaseTab } from './components/PlantKnowledgebaseTab';
import { SeedInventoryTab } from './components/SeedInventoryTab';

import { WeatherForecastTab } from './components/WeatherForecastTab';
import { SettingsTab } from './components/SettingsTab';
import { SeedStore } from './components/SeedStore';
import { useWeatherStore } from './stores/weatherStore';
import { getUserLocation } from './services/geolocationService';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [catalog, setCatalog] = useState<PlantSpecies[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [xp, setXp] = useState(0); // Gamification XP
  const [showSeedStore, setShowSeedStore] = useState(false);
  
  // New weather store
  const { data: weather, isLoading: loading, setLocation, fetchWeatherData } = useWeatherStore();

  const alerts = React.useMemo(() => {
    if (!weather) return [];
    const activeAlerts: string[] = [];

    if (weather.current.temperature_2m <= 0) {
      activeAlerts.push('❄️ Frost Warning: Cover sensitive plants!');
    } else if (weather.current.temperature_2m <= 4) {
      activeAlerts.push('🌡️ Cold Snap: Protect seedlings.');
    }

    if (weather.current.temperature_2m >= 30) {
      activeAlerts.push('🔥 Heat Wave: Ensure adequate hydration.');
    }

    // Map weather codes to conditions
    const currentCondition = weather.current.weather_code;
    if (currentCondition >= 95) { // Thunderstorm
      activeAlerts.push('⛈️ Storm Warning: Heavy rain and wind.');
    } else if ((currentCondition >= 51 && currentCondition <= 67) || // Rain
               (currentCondition >= 80 && currentCondition <= 82)) { // Showers
      if (weather.current.precipitation > 5) {
        activeAlerts.push('🌧️ Heavy Rain: Check drainage.');
      }
    } else if (weather.current.relative_humidity_2m < 20) {
      activeAlerts.push('🌵 Drought Warning: Water crops immediately.');
    }

    return activeAlerts.length > 0 ? activeAlerts : ['✅ Conditions Normal'];
  }, [weather]);

  React.useEffect(() => {
    const init = async () => {
      await hydrateDatabase();
      const db = await getDatabase();
      const allCatalog = await db.catalog.find().exec();
      setCatalog(allCatalog.map(doc => doc.toJSON()));

      // Apply Theme
      const savedTheme = localStorage.getItem('theme-color');
      if (savedTheme) applyTheme(savedTheme);
      
      // Apply Background Color
      const savedBgColor = localStorage.getItem('bg-color') || '#090c0a';
      applyBackgroundColor(savedBgColor);

      /*
      const savedMode = localStorage.getItem('theme-mode');
      if (savedMode === 'light') toggleThemeMode('light');
      */

      const settings = await db.settings.findOne('local-user').exec();
      if (settings) {
        setCurrentDay(settings.currentDay || 1);
        setXp(settings.xp || 0);
      }

      db.settings.findOne('local-user').$.subscribe(s => {
        if (s) {
          setCurrentDay(s.currentDay || 1);
          setXp(s.xp || 0);
        }
      });
      
      // Request geolocation and fetch weather
      try {
        const coords = await getUserLocation();
        setLocation(coords.latitude, coords.longitude);
        await fetchWeatherData();
      } catch (err) {
        console.warn('Geolocation denied:', err);
        // User can set location manually in settings
      }
    };
    init();

    // Refresh weather every 1 hour
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 3600000);

    return () => clearInterval(interval);
  }, [setLocation, fetchWeatherData]);

  // Persist XP changes
  React.useEffect(() => {
    const persistXp = async () => {
      const db = await getDatabase();
      const settings = await db.settings.findOne('local-user').exec();
      if (settings && settings.xp !== xp) {
        await settings.patch({ xp });
      }
    };
    if (xp > 0) persistXp();
  }, [xp]);

  return (
    <div className="flex flex-col h-screen bg-app-background text-text-primary overflow-hidden font-sans selection:bg-garden-500/30">
        <header className="h-16 flex items-center justify-between px-8 glass z-30 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-garden-500 rounded-full animate-pulse" />
            <h1 className="font-black text-xs uppercase tracking-tighter text-garden-500">Garden Deck Command</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-stone-500">
              {weather ? (
                <>
                  <div className="flex items-center gap-1.5" title="Weather condition"><span className="text-sm">🌤️</span> <span className="text-[13px] font-bold">{weather.current.weather_code < 3 ? 'Sunny' : weather.current.weather_code < 50 ? 'Cloudy' : 'Rainy'}</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture"><span className="text-sm">💧</span> <span className="text-[13px] font-bold">{weather.current.relative_humidity_2m}%</span></div>
                  <div className="flex items-center gap-1.5" title="Temp"><span className="text-sm">🌡️</span> <span className="text-[13px] font-bold">{weather.current.temperature_2m}°C</span></div>
                </>
              ) : loading ? (
                <>
                  <div className="flex items-center gap-1.5" title="Weather condition"><span className="text-sm">🌤️</span> <span className="text-[13px] font-bold">--</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture"><span className="text-sm">💧</span> <span className="text-[13px] font-bold">--%</span></div>
                  <div className="flex items-center gap-1.5" title="Temp"><span className="text-sm">🌡️</span> <span className="text-[13px] font-bold">--°C</span></div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5" title="Weather condition"><span className="text-sm">🌤️</span> <span className="text-[13px] font-bold text-red-400">Err</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture"><span className="text-sm">💧</span> <span className="text-[13px] font-bold text-red-400">Err</span></div>
                  <div className="flex items-center gap-1.5" title="Temp"><span className="text-sm">🌡️</span> <span className="text-[13px] font-bold text-red-400">Err</span></div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 bg-stone-900 px-3 py-1 rounded-full border border-stone-800 shadow-inner">
              <span className="text-[12px] font-bold text-garden-400">⭐ {xp} XP</span>
              <div className="h-2 w-16 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div className="h-full bg-gradient-to-r from-garden-600 to-garden-400 rounded-full" style={{ width: `${(xp % 100) / 100 * 100}%` }}></div>
              </div>
              <span className="text-[13px] font-bold text-stone-300">Lv.{Math.floor(xp / 100) + 1}</span>
            </div>
          </div>
        </header>

        <Tabs>
          <TabPanel id="virtual-garden">
            <VirtualGardenTab
              catalog={catalog}
              currentDay={currentDay}
              setCurrentDay={setCurrentDay}
              xp={xp}
              setXp={setXp}
              alerts={alerts}
              onOpenSeedStore={() => setShowSeedStore(true)}
            />
          </TabPanel>
          <TabPanel id="sowing-calendar">
            <SowingCalendarTab catalog={catalog} currentDay={currentDay} />
          </TabPanel>
          <TabPanel id="plant-knowledgebase">
            <PlantKnowledgebaseTab />
          </TabPanel>
          <TabPanel id="seed-inventory">
            <SeedInventoryTab catalog={catalog} />
          </TabPanel>
          <TabPanel id="weather-forecast">
            <WeatherForecastTab />
          </TabPanel>
          <TabPanel id="settings">
            <SettingsTab />
          </TabPanel>
        </Tabs>

        {/* Seed Store Modal */}
        {showSeedStore && (
          <SeedStore
            catalog={catalog}
            onClose={() => setShowSeedStore(false)}
            currentDay={currentDay}
          />
        )}
      </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
