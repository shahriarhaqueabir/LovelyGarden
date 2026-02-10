import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hydrateDatabase, getDatabase } from './db';
import { applyTheme, applyBackgroundColor } from './utils/theme';
import { PlantSpecies } from './schema/knowledge-graph';
import { Tabs, TabPanel } from './components/Tabs';
// Lazy load tabs to improve initial load speed
const VirtualGardenTab = React.lazy(() => import('./components/VirtualGardenTab').then(m => ({ default: m.VirtualGardenTab })));
const SowingCalendarTab = React.lazy(() => import('./components/SowingCalendarTab').then(m => ({ default: m.SowingCalendarTab })));
const PlantKnowledgebaseTab = React.lazy(() => import('./components/PlantKnowledgebaseTab').then(m => ({ default: m.PlantKnowledgebaseTab })));
const SeedInventoryTab = React.lazy(() => import('./components/SeedInventoryTab').then(m => ({ default: m.SeedInventoryTab })));
const WeatherForecastTab = React.lazy(() => import('./components/WeatherForecastTab').then(m => ({ default: m.WeatherForecastTab })));
const SettingsTab = React.lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));
const SeedStore = React.lazy(() => import('./components/SeedStore').then(m => ({ default: m.SeedStore })));
const LogbookTab = React.lazy(() => import('./components/LogbookTab').then(m => ({ default: m.LogbookTab })));
import { useWeatherStore } from './stores/weatherStore';
import { getUserLocation } from './services/geolocationService';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [catalog, setCatalog] = useState<PlantSpecies[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [xp, setXp] = useState(0); // Gamification XP
  const [showSeedStore, setShowSeedStore] = useState(false);
  const [hemisphere, setHemisphere] = useState<'North' | 'South'>('North');
  
  // New weather store
  const { 
    data: weather, 
    isLoading: loading, 
    locationName,
    setLocation, 
    fetchWeatherData 
  } = useWeatherStore();

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
      
      // Subscribe to catalog for real-time updates (especially during hydration)
      db.catalog.find().$.subscribe(docs => {
        if (docs) {
          setCatalog(docs.map(doc => doc.toJSON()));
        }
      });

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
        setHemisphere((settings.hemisphere as any) || 'North');
      }

      db.settings.findOne('local-user').$.subscribe(s => {
        if (s) {
          setCurrentDay(s.currentDay || 1);
          setXp(s.xp || 0);
          setHemisphere((s.hemisphere as any) || 'North');
        }
      });
      
      // Request geolocation if not already set, then fetch weather
      try {
        const { latitude, longitude } = useWeatherStore.getState();
        if (latitude === null || longitude === null) {
          const coords = await getUserLocation();
          setLocation(coords.latitude, coords.longitude);
          await fetchWeatherData(true);
        } else {
          await fetchWeatherData();
        }
      } catch (err) {
        console.error('Location/Weather initialization failed:', err);
        // Fallback or handle error - store already handles error states
        fetchWeatherData();
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
                  {locationName && (
                    <div className="hidden sm:flex items-center gap-1.5 border-r border-stone-800 pr-4 mr-2" title="Location">
                      <span className="text-sm">📍</span> 
                      <span className="text-[13px] font-black uppercase tracking-tight text-stone-300">{locationName}</span>
                    </div>
                  )}
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

        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="glass-panel p-8 rounded-3xl border border-stone-800 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-garden-500/20 border-t-garden-500 rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-stone-500 animate-pulse">Initializing Interface...</p>
            </div>
          </div>
        }>
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
              <SowingCalendarTab 
                catalog={catalog} 
                currentDay={currentDay} 
                hemisphere={hemisphere}
              />
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
            <TabPanel id="logbook">
              <LogbookTab />
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
        </React.Suspense>
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
