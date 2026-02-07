import React, { useState } from 'react';
import {
  FastForward,
  RotateCcw,
  Sun,
  Droplets,
  Thermometer,
  Settings as SettingsIcon,
  Info,
  AlertCircle
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { GardenField } from './GardenGrid';
import { InventoryTray } from './InventoryTray';
import { PlantInspector } from './PlantInspector';
import { usePlantedCards } from '../hooks/usePlantedCards';
import { useWeather } from '../hooks/useWeather';
import { PlantSpecies } from '../schema/knowledge-graph';
import { getDatabase } from '../db';
import { advanceGlobalDay, rewindGlobalDay } from '../db/queries';

interface VirtualGardenTabProps {
  catalog: PlantSpecies[];
  currentDay: number;
  setCurrentDay: (day: number) => void;
  xp: number;
  setXp: React.Dispatch<React.SetStateAction<number>>;
  alerts: string[];
  onOpenSeedStore?: () => void;
}

// Toast Notification Component
const Toast: React.FC<{
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`
      fixed top-20 right-8 px-4 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-right
      ${type === 'error' ? 'bg-red-900/90 border border-red-700 text-red-100' : 
        type === 'success' ? 'bg-garden-900/90 border border-garden-700 text-garden-100' : 
        'bg-stone-900/90 border border-stone-700 text-stone-100'}
    `}>
      <AlertCircle className="w-5 h-5" />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};

export const VirtualGardenTab: React.FC<VirtualGardenTabProps> = ({ 
  catalog, 
  currentDay, 
  setCurrentDay, 
  xp, 
  setXp, 
  alerts,
  onOpenSeedStore 
}) => {
  const plantedCards = usePlantedCards();
  const [selectedPlant, setSelectedPlant] = useState<any | null>(null);
  const [spectralLayer, setSpectralLayer] = useState<'normal' | 'hydration' | 'health' | 'nutrients'>('normal');
  const [activeSeedCatalogId, setActiveSeedCatalogId] = useState<string | null>(null);
  const [plantNowMode, setPlantNowMode] = useState(false);
  const [scrubDays, setScrubDays] = useState(0);
  const [plantNowSet, setPlantNowSet] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  
  // Grid dimensions state
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(4);

  // Weather data
  const { weather, loading } = useWeather(currentDay);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

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
      
      // Check grid capacity
      const totalCells = gridRows * gridCols;
      const occupiedCells = plantedCards.length;
      
      if (occupiedCells >= totalCells) {
        setToast({ message: 'Expand Grid to Plant', type: 'error' });
        return;
      }
      
      // Check if slot is already occupied
      const existingPlant = plantedCards.find((p: any) => p.gridX === x && p.gridY === y);
      if (existingPlant) {
        setToast({ message: 'Slot already occupied', type: 'error' });
        return;
      }
      
      // Import plantSeed function
      const { plantSeed } = await import('../db/queries');
      await plantSeed(catalogId, x, y, inventoryId);
      setToast({ message: 'Plant added to garden', type: 'success' });
    }
  };

  const handleAdvanceDay = async () => {
    const newDay = await advanceGlobalDay();
    setCurrentDay(newDay);
    setScrubDays(0);
    setXp(prev => prev + 10); // Gain XP for advancing day
  };

  const handleRewindDay = async () => {
    const newDay = await rewindGlobalDay();
    setCurrentDay(newDay);
    setScrubDays(0);
    // Don't subtract XP on rewind, just maintain current XP
  };

  // --- Sprint 2: "Plant Now" filter ---
  // Map simulated day -> month (fast approximation: day 1 = Jan 1)
  const currentMonth = Math.floor(((currentDay - 1) % 365) / 30.42);

  React.useEffect(() => {
    if (plantNowMode) {
      const newPlantNowSet = new Set<string>();
      for (const c of catalog) {
        const { isSowingSeason } = require('../logic/reasoning');
        const res = isSowingSeason(c, { hemisphere: 'North', region: 'DE-SN' } as any, currentMonth);
        if (res.eligible) newPlantNowSet.add(c.id);
      }
      setPlantNowSet(newPlantNowSet);
    }
  }, [plantNowMode, catalog, currentMonth]);

  // Grid expansion functions
  const addRow = () => {
    if (gridRows < 10) {
      setGridRows(prev => prev + 1);
      setToast({ message: 'Grid expanded: Row added', type: 'success' });
    } else {
      setToast({ message: 'Maximum grid size reached', type: 'error' });
    }
  };

  const addColumn = () => {
    if (gridCols < 10) {
      setGridCols(prev => prev + 1);
      setToast({ message: 'Grid expanded: Column added', type: 'success' });
    } else {
      setToast({ message: 'Maximum grid size reached', type: 'error' });
    }
  };

  // Calculate grid capacity
  const totalCells = gridRows * gridCols;
  const occupiedCells = plantedCards.length;
  const isGridFull = occupiedCells >= totalCells;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 overflow-hidden font-sans">
        
        {/* Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* HUD OVERLAY */}
        <header className="h-16 flex items-center justify-between px-8 glass z-30 border-b border-stone-800">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-garden-500 rounded-full animate-pulse" />
              <h1 className="font-black text-xs uppercase tracking-tighter text-garden-500">Garden Deck Command</h1>
            </div>
            <div className="h-4 w-[1px] bg-stone-800" />
            <div className="flex items-center gap-6">
              <div className="bg-stone-900 px-4 py-1 rounded-full border border-stone-800 text-[10px] font-black text-garden-400 uppercase tracking-widest shadow-inner">
                📅 Cycle Day: {currentDay}
              </div>
              <div className="flex items-center gap-4 text-stone-500">
                {weather ? (
                  <>
                    <div className="flex items-center gap-1.5" title="Sunlight hours">☀️ <Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{weather.sunlightHours}h</span></div>
                    <div className="flex items-center gap-1.5" title="Moisture">💧 <Droplets className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{weather.moisturePercentage}%</span></div>
                    <div className="flex items-center gap-1.5" title="Temp">🌡️ <Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{weather.temperatureCelsius}°C</span></div>
                  </>
                ) : loading ? (
                  <>
                    <div className="flex items-center gap-1.5" title="Sunlight hours">☀️ <Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">--h</span></div>
                    <div className="flex items-center gap-1.5" title="Moisture">💧 <Droplets className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">--%</span></div>
                    <div className="flex items-center gap-1.5" title="Temp">🌡️ <Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">--°C</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5" title="Sunlight hours">☀️ <Sun className="w-3.5 h-3.5" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                    <div className="flex items-center gap-1.5" title="Moisture">💧 <Droplets className="w-3.5 h-3.5" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                    <div className="flex items-center gap-1.5" title="Temp">🌡️ <Thermometer className="w-3.5 h-3.5" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Grid Capacity Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest shadow-inner ${
              isGridFull ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-stone-900 border-stone-800 text-stone-400'
            }`}>
              <span>📐 Grid: {occupiedCells}/{totalCells}</span>
              {isGridFull && <AlertCircle className="w-3 h-3" />}
            </div>

            {/* Global Alerts Marquee */}
            <div className="flex-1 max-w-md overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-[9px] text-stone-400 uppercase tracking-widest">
                {alerts.join(' • ')}
              </div>
            </div>

            {/* XP/Level Tracker */}
            <div className="flex items-center gap-2 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
              <span className="text-[9px] font-bold text-garden-400">XP: {xp}</span>
              <div className="h-2 w-16 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-garden-500 rounded-full" style={{ width: `${(xp % 100) / 100 * 100}%` }}></div>
              </div>
              <span className="text-[9px] font-bold text-stone-500">Lv.{Math.floor(xp / 100) + 1}</span>
            </div>

            <div className="flex gap-3">
              <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800 shadow-inner">
                <button onClick={() => setSpectralLayer('normal')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${spectralLayer === 'normal' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500'}`}>👁️ Visual</button>
                <button onClick={() => setSpectralLayer('hydration')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${spectralLayer === 'hydration' ? 'bg-blue-900/40 text-blue-400 shadow-md' : 'text-stone-500'}`}>💧 Hydration</button>
                <button onClick={() => setSpectralLayer('health')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${spectralLayer === 'health' ? 'bg-red-900/40 text-red-400 shadow-md' : 'text-stone-500'}`}>🩹 Blight</button>
              </div>
              <button
                onClick={() => {}} // Settings would open in its own tab
                className="p-2.5 bg-stone-900/50 border border-stone-800 rounded-xl text-stone-500 hover:text-stone-300 transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
                <button
                  onClick={handleRewindDay}
                  disabled={currentDay <= 1}
                  className={`flex items-center gap-2 px-3 py-2 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                    currentDay <= 1 
                      ? 'bg-stone-700 text-stone-500 cursor-not-allowed' 
                      : 'bg-amber-600 text-stone-950 hover:bg-amber-400 shadow-amber-500/20'
                  }`}
                  title="Rewind Axis"
                >
                  ⏪ <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAdvanceDay}
                  className="flex items-center gap-2 px-3 py-2 bg-garden-600 text-stone-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-garden-400 transition-all active:scale-95 shadow-lg shadow-garden-500/20"
                  title="Advance Axis"
                >
                  ⏩ <FastForward className="w-4 h-4" />
                </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <div className="flex flex-1">

            {/* CENTER PANE: TACTICAL FIELD */}
            <div className="flex-1 flex flex-col relative overflow-hidden grid-dot">
              {/* Grid Controls */}
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <button
                  onClick={addRow}
                  disabled={gridRows >= 10}
                  className="flex items-center gap-2 px-3 py-2 bg-stone-900/80 border border-stone-700 rounded-lg text-[10px] font-bold text-stone-400 hover:text-garden-400 hover:border-garden-600 transition-all disabled:opacity-50"
                >
                  ➕ Add Row
                </button>
                <button
                  onClick={addColumn}
                  disabled={gridCols >= 10}
                  className="flex items-center gap-2 px-3 py-2 bg-stone-900/80 border border-stone-700 rounded-lg text-[10px] font-bold text-stone-400 hover:text-garden-400 hover:border-garden-600 transition-all disabled:opacity-50"
                >
                  ➕ Add Column
                </button>
              </div>

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
                  rows={gridRows}
                  cols={gridCols}
                  onEdit={(item: any) => console.log('Edit plant:', item)}
                  onDelete={async (item: any) => {
                    if (window.confirm(`This will delete ${item.catalogId}. Proceed?`)) {
                      const db = await getDatabase();
                      await db.planted.findOne(item.id).remove();
                      setToast({ message: 'Plant removed from garden', type: 'info' });
                    }
                  }}
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

          {/* COMMAND DOCK */}
          <div className="h-20 glass border-t border-stone-800 px-8 flex items-center justify-between z-20 flex-shrink-0">
            <div className="flex items-center gap-6">
              <InventoryTray
                catalog={catalog}
                onOpenStore={onOpenSeedStore || (() => {})}
                isVertical={false}
                plantNowMode={plantNowMode}
                onTogglePlantNow={() => setPlantNowMode(v => !v)}
                plantNowSet={plantNowSet}
              />
              <div className="h-4 w-[1px] bg-stone-800" />
              <div className="flex items-center gap-3">
                <button className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-blue-400 transition-all active:scale-90" title="Water">
                  💧
                </button>
                <button className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-green-400 transition-all active:scale-90" title="Fertilize">
                  🧪
                </button>
                <button className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-red-400 transition-all active:scale-90" title="Remedy">
                  🩹
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full max-w-2xl justify-end">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">⏳ Temporal Axis</span>
              <div className="flex-1 max-w-xs">
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={scrubDays}
                  onChange={(e) => setScrubDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-garden-500"
                />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">Future: +{scrubDays} Days</span>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          <div className="w-28 h-40 bg-garden-800 rounded-xl border border-garden-500 border-2 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center p-4">
            <div className="text-4xl">🌱</div>
            <div className="mt-4 text-[10px] font-black uppercase text-garden-400">Deploying...</div>
          </div>
        </DragOverlay>
      </div>
    </DndContext>
  );
};
