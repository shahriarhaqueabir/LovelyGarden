import { useEffect, useState } from 'react';
import { 
  Sprout, 
  Settings as SettingsIcon, 
  FastForward, 
  Droplet, 
  Sun, 
  Thermometer,
  BookOpen,
  Calendar as CalendarIcon,
  Zap,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { hydrateDatabase, getDatabase } from './db';
import { plantSeed, advanceGlobalDay } from './db/queries';
import { GardenField } from './components/GardenGrid';
import { isSowingSeason } from './logic/reasoning';
import { InventoryTray } from './components/InventoryTray';
import { PlantInspector } from './components/PlantInspector';
import { SeedStore } from './components/SeedStore';
import { Plantbase } from './components/Plantbase';
import { SettingsPanel } from './components/SettingsPanel';
import { SowingWindowsModal } from './components/SowingWindowsModal';
import { usePlantedCards } from './hooks/usePlantedCards';

function App() {
  const plantedCards = usePlantedCards();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<any | null>(null);
  const [isStoreOpen, setStoreOpen] = useState(false);
  const [isPlantbaseOpen, setPlantbaseOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSowingWindowsOpen, setSowingWindowsOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [spectralLayer, setSpectralLayer] = useState<'normal' | 'hydration' | 'health' | 'nutrients'>('normal');
  const [activeSeedCatalogId, setActiveSeedCatalogId] = useState<string | null>(null);
  const [plantNowMode, setPlantNowMode] = useState(false);
  const [scrubDays, setScrubDays] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  useEffect(() => {
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.id.toString().startsWith('seed-')) {
      const catalogId = active.data.current?.id as string | undefined;
      setActiveSeedCatalogId(catalogId || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSeedCatalogId(null);

    if (over && active.id.toString().startsWith('seed-')) {
      const inventoryId = active.id.toString().replace('seed-', '');
      const catalogId = active.data.current?.id;
      const { x, y } = over.data.current as { x: number; y: number };
      await plantSeed(catalogId, x, y, inventoryId);
    }
  };

  const handleAdvanceDay = async () => {
    const newDay = await advanceGlobalDay();
    setCurrentDay(newDay);
    setScrubDays(0);
  };

  // --- Sprint 2: "Plant Now" filter ---
  // Map simulated day -> month (fast approximation: day 1 = Jan 1)
  const currentMonth = Math.floor(((currentDay - 1) % 365) / 30.42);

  const plantNowSet = new Set<string>();
  if (plantNowMode) {
    for (const c of catalog) {
      const res = isSowingSeason(c, { hemisphere: 'North', region: 'DE-SN' } as any, currentMonth);
      if (res.eligible) plantNowSet.add(c.id);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="flex flex-col h-screen bg-[#0c0a09] text-stone-100 overflow-hidden font-sans">
        
        <div className="flex flex-1">
        {/* LEFT PANE: STRATEGY (Collapsible) */}
        <aside className={`
          ${isLeftSidebarOpen ? 'w-80' : 'w-16'} 
          glass border-r border-stone-800 transition-all duration-500 overflow-hidden flex flex-col z-30
        `}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-stone-800">
            {isLeftSidebarOpen && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-garden-400" />
                <span className="font-bold text-xs uppercase tracking-widest text-stone-400">Strategy Engine</span>
              </div>
            )}
            <button 
              onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-500"
            >
              {isLeftSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {isLeftSidebarOpen ? (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <CalendarIcon className="w-4 h-4" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Sowing Almanac</h3>
                </div>
                <div className="p-4 bg-stone-900/50 rounded-2xl border border-stone-800 space-y-3">
                  <p className="text-[10px] text-stone-500 leading-relaxed italic">Currently optimized for Dresden Climate...</p>
                  <button
                    onClick={() => setSowingWindowsOpen(true)}
                    className="w-full py-2 bg-stone-800 rounded-lg text-[9px] font-bold hover:bg-stone-700 transition-colors uppercase"
                  >
                    View Windows
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <Zap className="w-4 h-4" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Succession Wizard</h3>
                </div>
                <div className="p-4 bg-garden-900/10 rounded-2xl border border-garden-500/10">
                  <p className="text-[10px] text-garden-400 font-medium">No pending successions. All slots optimal.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Knowledge Base</h3>
                </div>
                <div className="p-4 bg-stone-900/50 rounded-2xl border border-stone-800 space-y-3">
                  <p className="text-[10px] text-stone-500 leading-relaxed">Access the full plant knowledge base with 50+ species.</p>
                  <button
                    onClick={() => setPlantbaseOpen(true)}
                    className="w-full py-2 bg-garden-900/30 border border-garden-700/30 rounded-lg text-[9px] font-bold text-garden-400 hover:bg-garden-900/50 transition-colors uppercase"
                  >
                    Open Plantbase
                  </button>
                </div>
              </section>

              <div className="pt-4">
                <InventoryTray
                  catalog={catalog}
                  onOpenStore={() => setStoreOpen(true)}
                  isVertical
                  plantNowMode={plantNowMode}
                  onTogglePlantNow={() => setPlantNowMode(v => !v)}
                  plantNowSet={plantNowSet}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center py-8 gap-8">
              <button onClick={() => setLeftSidebarOpen(true)} className="text-stone-600 hover:text-garden-500 transition-colors"><CalendarIcon className="w-6 h-6" /></button>
              <button onClick={() => setLeftSidebarOpen(true)} className="text-stone-600 hover:text-garden-500 transition-colors"><Sprout className="w-6 h-6" /></button>
              <button onClick={() => setLeftSidebarOpen(true)} className="text-stone-600 hover:text-garden-500 transition-colors"><Zap className="w-6 h-6" /></button>
              <button onClick={() => setPlantbaseOpen(true)} className="text-stone-600 hover:text-garden-500 transition-colors" title="Plantbase"><BookOpen className="w-6 h-6" /></button>
            </div>
          )}
        </aside>

        {/* CENTER PANE: TACTICAL FIELD */}
        <div className="flex-1 flex flex-col relative overflow-hidden grid-dot">
          {/* HUD OVERLAY */}
          <header className="h-16 flex items-center justify-between px-8 glass-blur mt-4 mx-4 rounded-2xl z-20 border border-stone-800 shadow-2xl">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Sprout className="w-5 h-5 text-garden-500" />
                <h1 className="font-black text-xs uppercase tracking-tighter text-garden-500">Garden Deck Command</h1>
              </div>
              <div className="h-4 w-[1px] bg-stone-800" />
              <div className="flex items-center gap-6">
                <div className="bg-stone-900 px-4 py-1 rounded-full border border-stone-800 text-[10px] font-black text-garden-400 uppercase tracking-widest">
                  Cycle Day: {currentDay}
                </div>
                <div className="flex items-center gap-4 text-stone-500">
                  <div className="flex items-center gap-1.5" title="Sunlight hours"><Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">14.2h</span></div>
                  <div className="flex items-center gap-1.5" title="Moisture"><Droplet className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">68%</span></div>
                  <div className="flex items-center gap-1.5" title="Temp"><Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">22°C</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800">
                <button onClick={() => setSpectralLayer('normal')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all ${spectralLayer === 'normal' ? 'bg-stone-800 text-white' : 'text-stone-500'}`}>Visual</button>
                <button onClick={() => setSpectralLayer('hydration')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all ${spectralLayer === 'hydration' ? 'bg-blue-900/40 text-blue-400' : 'text-stone-500'}`}>Hydration</button>
                <button onClick={() => setSpectralLayer('health')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all ${spectralLayer === 'health' ? 'bg-red-900/40 text-red-400' : 'text-stone-500'}`}>Blight</button>
              </div>
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 bg-stone-900/50 border border-stone-800 rounded-xl text-stone-500 hover:text-stone-300 transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={handleAdvanceDay}
                className="flex items-center gap-2 px-6 py-2 bg-garden-600 text-stone-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-garden-400 transition-all active:scale-95 shadow-lg shadow-garden-500/20"
              >
                Advance Cycle <FastForward className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* THE FIELD */}
          <main className="flex-1 flex justify-center items-center overflow-auto p-12">
            <GardenField
              items={plantedCards.map((p: any) => ({
                ...p,
                hydration: Math.max(0, Math.round((p.hydration ?? 100) * Math.pow(0.85, scrubDays))),
                stressLevel: Math.min(100, Math.round((p.stressLevel ?? 0) + (scrubDays > 0 && (p.hydration ?? 100) * Math.pow(0.85, scrubDays) < 20 ? scrubDays * 5 : 0)))
              }))}
              onSelect={setSelectedPlant}
              layer={spectralLayer}
              activeSeedCatalogId={activeSeedCatalogId}
              catalog={catalog}
            />
          </main>
        </div>

        {/* RIGHT PANE: INTELLIGENCE (Inspector stays docked if plant selected) */}
        <aside className={`
          ${selectedPlant ? 'w-[26rem]' : 'w-0'} 
          glass border-l border-stone-800 transition-all duration-500 overflow-hidden flex flex-col z-30
        `}>
          {selectedPlant && (
            <PlantInspector 
              plant={selectedPlant}
              catalogItem={catalog.find(c => c.id === selectedPlant.catalogId)}
              companionScore={1}
              onClose={() => setSelectedPlant(null)}
              docked
            />
          )}
          {!selectedPlant && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-20">
              <Info className="w-8 h-8 text-stone-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Intelligence Node Inactive</p>
              <p className="text-[9px] text-stone-600 italic">Select a plant unit from the tactical field to initialize link...</p>
            </div>
          )}
        </aside>
        </div>
        
        {/* TEMPORAL SCRUBBER PLACEHOLDER */}
        <footer className="h-20 glass border-t border-stone-800 px-8 flex items-center justify-between mx-4 mt-4 rounded-2xl z-20">
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">Temporal Axis</span>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={30}
                value={scrubDays}
                onChange={(e) => setScrubDays(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-green-500"
              />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">Future: +{scrubDays} Days</span>
          </div>
          <div className="flex items-center gap-6 text-stone-600 pl-8 border-l border-stone-800">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold uppercase tracking-tighter">Forecast</span>
              <div className="flex gap-1 text-xs">
                <Sun className="w-3 h-3" /> <Droplet className="w-3 h-3" /> <Sun className="w-3 h-3" />
              </div>
            </div>
          </div>
        </footer>
        
        {/* MODALS */}
        {isStoreOpen && <SeedStore catalog={catalog} onClose={() => setStoreOpen(false)} />}
        {isPlantbaseOpen && <Plantbase onClose={() => setPlantbaseOpen(false)} />}
        {isSettingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
        {isSowingWindowsOpen && (
          <SowingWindowsModal
            catalog={catalog}
            currentDay={currentDay}
            onClose={() => setSowingWindowsOpen(false)}
          />
        )}
      </div>
      
      <DragOverlay dropAnimation={null}>
        <div className="w-28 h-40 bg-garden-800 rounded-xl border border-garden-500 border-2 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center p-4">
          <div className="text-4xl">🌱</div>
          <div className="mt-4 text-[10px] font-black uppercase text-garden-400">Deploying...</div>
        </div>
      </DragOverlay>
    </DndContext>
  );
}

export default App;
