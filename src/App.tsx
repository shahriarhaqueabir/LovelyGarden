import React, { useState } from 'react';
import {
  Sun,
  Droplet,
  Thermometer
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hydrateDatabase, getDatabase } from './db';
import { useWeather } from './hooks/useWeather';
import { PlantSpecies } from './schema/knowledge-graph';
import { Tabs, TabPanel } from './components/Tabs';
import { VirtualGardenTab } from './components/VirtualGardenTab';
import { SowingCalendarTab } from './components/SowingCalendarTab';
import { PlantKnowledgebaseTab } from './components/PlantKnowledgebaseTab';
import { SeedInventoryTab } from './components/SeedInventoryTab';
import { SeedsInHandTab } from './components/SeedsInHandTab';
import { WeatherForecastTab } from './components/WeatherForecastTab';
import { SettingsTab } from './components/SettingsTab';
import { SeedStore } from './components/SeedStore';

const queryClient = new QueryClient();

function App() {
  const [catalog, setCatalog] = useState<PlantSpecies[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [xp, setXp] = useState(0); // Gamification XP
  const [showSeedStore, setShowSeedStore] = useState(false);
  const alerts = ['Frost Warning: Cover plants tonight!', 'Peak Planting: Tomatoes ready for sowing.'];

  // Weather data
  const { weather, loading } = useWeather(currentDay);

  React.useEffect(() => {
    const init = async () => {
      await hydrateDatabase();
      const db = await getDatabase();
      const allCatalog = await db.catalog.find().exec();
      setCatalog(allCatalog.map(doc => doc.toJSON()));

      const settings = await db.settings.findOne('local-user').exec();
      if (settings) {
        setCurrentDay(settings.currentDay || 1);
      }

      db.settings.findOne('local-user').$.subscribe(s => {
        if (s) setCurrentDay(s.currentDay || 1);
      });
    };
    init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-stone-950 text-stone-100 overflow-hidden font-sans selection:bg-garden-500/30">
        <header className="h-16 flex items-center justify-between px-8 glass z-30 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-garden-500 rounded-full animate-pulse" />
            <h1 className="font-black text-xs uppercase tracking-tighter text-garden-500">Garden Deck Command</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-stone-500">
              {weather ? (
                <>
                  <div className="flex items-center gap-1.5" title="Sunlight hours">☀️ <Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{weather.sunlightHours}h</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture">💧 <Droplet className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{weather.moisturePercentage}%</span></div>
                  <div className="flex items-center gap-1.5" title="Temp">🌡️ <Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{weather.temperatureCelsius}°C</span></div>
                </>
              ) : loading ? (
                <>
                  <div className="flex items-center gap-1.5" title="Sunlight hours">☀️ <Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">--h</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture">💧 <Droplet className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">--%</span></div>
                  <div className="flex items-center gap-1.5" title="Temp">🌡️ <Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">--°C</span></div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5" title="Sunlight hours">☀️ <Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture">💧 <Droplet className="w-3.5 h-3.5" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                  <div className="flex items-center gap-1.5" title="Temp">🌡️ <Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 bg-stone-900 px-3 py-1 rounded-full border border-stone-800 shadow-inner">
              <span className="text-[9px] font-bold text-garden-400">⭐ {xp} XP</span>
              <div className="h-2 w-16 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div className="h-full bg-gradient-to-r from-garden-600 to-garden-400 rounded-full" style={{ width: `${(xp % 100) / 100 * 100}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-stone-300">Lv.{Math.floor(xp / 100) + 1}</span>
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
          <TabPanel id="seeds-in-hand">
            <SeedsInHandTab catalog={catalog} />
          </TabPanel>
          <TabPanel id="weather-forecast">
            <WeatherForecastTab currentDay={currentDay} />
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
    </QueryClientProvider>
  );
}

export default App;
