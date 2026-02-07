import React, { useState, useEffect } from 'react';
import {
  FastForward,
  RotateCcw,
  Sun,
  Droplets,
  Thermometer,
  Settings as SettingsIcon,
  Info,
  AlertCircle,
  Calendar,
  LayoutGrid,
  Eye,
  Activity,
  Hourglass,
  Sprout,
  Plus,
  Minus,
  Edit
} from 'lucide-react';
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { GardenField } from './GardenGrid';
import { InventoryTray } from './InventoryTray';
import { PlantInspector } from './PlantInspector';
import { usePlantedCards } from '../hooks/usePlantedCards';
import { useWeather } from '../hooks/useWeather';
import { PlantSpecies } from '../schema/knowledge-graph';
import { getDatabase } from '../db';
import { advanceGlobalDay, rewindGlobalDay, createGarden, updateGarden, deleteGarden } from '../db/queries';
import { GardenConfigDialog, GardenConfig } from './GardenConfigDialog';
import { isSowingSeason } from '../logic/reasoning'; // Fixed import

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
  // Garden State
  const [gardens, setGardens] = useState<GardenConfig[]>([]);
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null);
  const activeGarden = gardens.find(g => g.id === activeGardenId);

  const plantedCards = usePlantedCards(activeGardenId || undefined);
  const [selectedPlant, setSelectedPlant] = useState<any | null>(null);
  const [spectralLayer, setSpectralLayer] = useState<'normal' | 'hydration' | 'health' | 'nutrients'>('normal');
  const [activeSeedCatalogId, setActiveSeedCatalogId] = useState<string | null>(null);
  const [plantNowMode, setPlantNowMode] = useState(false);
  const [scrubDays, setScrubDays] = useState(0);
  const [plantNowSet, setPlantNowSet] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  
  // Dialog State
  const [showGardenDialog, setShowGardenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  // Load gardens on mount
  useEffect(() => {
    const loadGardens = async () => {
      const db = await getDatabase();
        const docs = await db.gardens.find().exec();
        const gardensData = docs.map(d => d.toJSON());
        // Sort: Main garden first, then by date
        gardensData.sort((a, b) => {
            if (a.id === 'main-garden') return -1;
            if (b.id === 'main-garden') return 1;
            return (a.createdDate || 0) - (b.createdDate || 0);
        });
        setGardens(gardensData);
      
      // Default to first garden if none active
      if (!activeGardenId && gardensData.length > 0) {
        setActiveGardenId(gardensData[0].id);
      }
    };
    loadGardens();
  }, []); // Run once on mount

  // Sync garden list periodically or subscribe? For now, fetch on updates.
  const refreshGardens = async () => {
      const db = await getDatabase();
      const docs = await db.gardens.find().exec();
      const gardensData = docs.map(d => d.toJSON());
      gardensData.sort((a, b) => {
          if (a.id === 'main-garden') return -1;
          if (b.id === 'main-garden') return 1;
          return (a.createdDate || 0) - (b.createdDate || 0);
      });
      setGardens(gardensData);
  };

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
      if (!activeGarden) {
        setToast({ message: 'No active garden selected', type: 'error' });
        return;
      }

      const inventoryId = active.id.toString().replace('seed-', '');
      const catalogId = active.data.current?.id;
      const { x, y } = over.data.current as { x: number; y: number };
      
      // Check grid capacity
      const totalCells = activeGarden.gridWidth * activeGarden.gridHeight;
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
      try {
        await plantSeed(catalogId, x, y, inventoryId, activeGarden.id);
        setToast({ message: 'Plant added to garden', type: 'success' });
      } catch (err) {
        setToast({ message: 'Failed to plant seed', type: 'error' });
      }
    }
  };

  const handleSaveGarden = async (config: GardenConfig) => {
      try {
          if (dialogMode === 'create') {
              const newId = await createGarden(config);
              await refreshGardens();
              setActiveGardenId(newId); // Immediately switch to new garden
              setToast({ message: 'New garden sector established', type: 'success' });
          } else {
              // Edit
              if (!config.id) return;
              await updateGarden(config.id, {
                 name: config.name,
                 type: config.type,
                 soilType: config.soilType,
                 sunExposure: config.sunExposure,
                 gridWidth: config.gridWidth,
                 gridHeight: config.gridHeight
              });
              await refreshGardens();
              setToast({ message: 'Garden specs updated', type: 'success' });
          }
      } catch (err) {
          console.error("Failed to save garden:", err);
          setToast({ message: 'Failed to save garden configuration', type: 'error' });
      }
  };

  const handleDeleteGarden = async () => {
      if (!activeGardenId) return;
      
      // Prevent deleting the main garden (default sector)
      if (activeGardenId === 'main-garden') {
          setToast({ message: 'Primary garden sector cannot be decommissioned', type: 'error' });
          return;
      }
      
      if (confirm('Delete this garden sector and all plants within it? This action cannot be undone.')) {
          await deleteGarden(activeGardenId);
          await refreshGardens();
          // Switch to another garden (likely main-garden)
          const db = await getDatabase();
          const remaining = await db.gardens.find().exec();
          
          // Re-sort to find best candidate
          const gardensData = remaining.map(d => d.toJSON());
          gardensData.sort((a, b) => {
              if (a.id === 'main-garden') return -1;
              if (b.id === 'main-garden') return 1;
              return (a.createdDate || 0) - (b.createdDate || 0);
          });
          
          if (gardensData.length > 0) setActiveGardenId(gardensData[0].id);
          else setActiveGardenId(null); // Should not happen if main exists
          
          setToast({ message: 'Garden sector decommissioned', type: 'info' });
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
  const currentMonth = Math.floor(((currentDay - 1) % 365) / 30.42);

  useEffect(() => {
    if (plantNowMode) {
      const newPlantNowSet = new Set<string>();
      for (const c of catalog) {
        const res = isSowingSeason(c, { hemisphere: 'North', region: 'DE-SN' } as any, currentMonth);
        if (res.eligible) newPlantNowSet.add(c.id);
      }
      setPlantNowSet(newPlantNowSet);
    }
  }, [plantNowMode, catalog, currentMonth]);

  // Calculate grid capacity
  const totalCells = activeGarden ? activeGarden.gridWidth * activeGarden.gridHeight : 0;
  const occupiedCells = plantedCards.length;
  const isGridFull = occupiedCells >= totalCells;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 overflow-hidden font-sans">
        
        {/* Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* Garden Configuration Dialog */}
        {showGardenDialog && (
            <GardenConfigDialog
                mode={dialogMode}
                initialConfig={dialogMode === 'edit' ? activeGarden : null}
                onClose={() => setShowGardenDialog(false)}
                onSave={handleSaveGarden}
            />
        )}

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
                <Calendar className="w-3.5 h-3.5 text-garden-500" /> Cycle Day: {currentDay}
              </div>
              <div className="flex items-center gap-4 text-stone-500">
                {weather ? (
                  <>
                    <div className="flex items-center gap-1.5" title="Sunlight hours"><Sun className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold">{weather.sunlightHours}h</span></div>
                    <div className="flex items-center gap-1.5" title="Moisture"><Droplets className="w-3.5 h-3.5 text-blue-500" /><span className="text-[10px] font-bold">{weather.moisturePercentage}%</span></div>
                    <div className="flex items-center gap-1.5" title="Temp"><Thermometer className="w-3.5 h-3.5 text-red-500" /><span className="text-[10px] font-bold">{weather.temperatureCelsius}°C</span></div>
                  </>
                ) : loading ? (
                  <>
                    <div className="flex items-center gap-1.5" title="Sunlight hours"><Sun className="w-3.5 h-3.5 text-stone-700" /><span className="text-[10px] font-bold">--h</span></div>
                    <div className="flex items-center gap-1.5" title="Moisture"><Droplets className="w-3.5 h-3.5 text-stone-700" /><span className="text-[10px] font-bold">--%</span></div>
                    <div className="flex items-center gap-1.5" title="Temp"><Thermometer className="w-3.5 h-3.5 text-stone-700" /><span className="text-[10px] font-bold">--°C</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5" title="Sunlight hours"><Sun className="w-3.5 h-3.5 text-red-500" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                    <div className="flex items-center gap-1.5" title="Moisture"><Droplets className="w-3.5 h-3.5 text-red-500" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
                    <div className="flex items-center gap-1.5" title="Temp"><Thermometer className="w-3.5 h-3.5 text-red-500" /><span className="text-[10px] font-bold text-red-400">Err</span></div>
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
              <LayoutGrid className="w-3 h-3" />
              <span>Grid: {occupiedCells}/{totalCells}</span>
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
                <button onClick={() => setSpectralLayer('normal')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${spectralLayer === 'normal' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500'}`}>
                  <Eye className="w-3 h-3" /> Visual
                </button>
                <button onClick={() => setSpectralLayer('hydration')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${spectralLayer === 'hydration' ? 'bg-blue-900/40 text-blue-400 shadow-md' : 'text-stone-500'}`}>
                  <Droplets className="w-3 h-3" /> Hydration
                </button>
                <button onClick={() => setSpectralLayer('health')} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${spectralLayer === 'health' ? 'bg-red-900/40 text-red-400 shadow-md' : 'text-stone-500'}`}>
                  <Activity className="w-3 h-3" /> Blight
                </button>
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

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR: INVENTORY */}
          <InventoryTray
            catalog={catalog}
            onOpenStore={onOpenSeedStore || (() => {})}
            isVertical={true}
            plantNowMode={plantNowMode}
            onTogglePlantNow={() => setPlantNowMode(v => !v)}
            plantNowSet={plantNowSet}
          />

          {/* MAIN CONTENT COLUMN */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-stone-950/50">
            {/* Garden Tabs Bar */}
            {/* Garden Tabs Bar (5 Fixed Slots) */}
            <div className="h-12 bg-stone-900/80 border-b border-stone-800 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar">
                {Array.from({ length: 5 }).map((_, i) => {
                    const garden = gardens[i];
                    const isActive = garden && activeGardenId === garden.id;
                    
                    return (
                        <button
                            key={garden ? garden.id : `slot-${i}`}
                            onClick={() => {
                                if (garden) setActiveGardenId(garden.id || null);
                                else {
                                    setDialogMode('create');
                                    setShowGardenDialog(true);
                                }
                            }}
                            className={`
                                relative h-full px-4 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all border-r border-t border-stone-800 min-w-[140px]
                                ${i === 0 ? 'border-l' : ''}
                                ${isActive
                                    ? 'bg-[#0c0a09] text-garden-400 border-b-[#0c0a09] translate-y-[1px] z-10'
                                    : garden 
                                        ? 'bg-stone-900 text-stone-500 hover:text-stone-300 hover:bg-stone-800 border-b-stone-800'
                                        : 'bg-stone-950/30 text-stone-700 hover:text-stone-500 hover:bg-stone-900/50 border-b-stone-800'}
                            `}
                        >
                            {garden ? (
                                <span className="truncate max-w-[120px]">{garden.name}</span>
                            ) : (
                                <span className="flex items-center gap-2 opacity-60">
                                    <Plus className="w-3 h-3" /> Space {i + 1}
                                </span>
                            )}
                            {i === 0 && garden && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]" title="Primary Axis" />}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-1 relative overflow-hidden">

            {/* CENTER PANE: TACTICAL FIELD */}
            <div className="flex-1 flex flex-col relative overflow-hidden grid-dot">
              {/* Garden Config Controls (Edit/Delete Active) */}
              {activeGarden && (
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 rounded-xl p-2 shadow-lg backdrop-blur-sm">
                          <div className="text-[10px] font-bold uppercase text-stone-400 px-2 border-r border-stone-700">
                              {activeGarden.type}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-stone-400 px-2 border-r border-stone-700">
                             <Sun className="w-3 h-3 inline mr-1" />{activeGarden.sunExposure}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-stone-400 px-2 border-r border-stone-700">
                             <Droplets className="w-3 h-3 inline mr-1" />{activeGarden.soilType}
                          </div>
                          <button
                              onClick={() => { setDialogMode('edit'); setShowGardenDialog(true); }}
                              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-500 hover:text-garden-400 transition-colors"
                              title="Configure Garden"
                          >
                              <Edit className="w-3 h-3" />
                          </button>
                          {gardens.length > 1 && (
                              <button
                                  onClick={handleDeleteGarden}
                                  className="p-1.5 hover:bg-red-900/20 rounded-lg text-stone-500 hover:text-red-400 transition-colors"
                                  title="Decommission Garden"
                              >
                                  <Minus className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                  </div>
              )}

              {/* THE FIELD */}
              <main className="flex-1 flex justify-center items-center overflow-auto p-12">
                {activeGarden ? (
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
                      rows={activeGarden.gridHeight}
                      cols={activeGarden.gridWidth}
                      onEdit={(item: any) => console.log('Edit plant:', item)}
                      onDelete={async (item: any) => {
                        if (window.confirm(`This will delete ${item.catalogId}. Proceed?`)) {
                          const db = await getDatabase();
                          await db.planted.findOne(item.id).remove();
                          setToast({ message: 'Plant removed from garden', type: 'info' });
                        }
                      }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center opacity-30">
                        <AlertCircle className="w-12 h-12 text-stone-500 mb-4" />
                        <h3 className="text-lg font-bold text-stone-400 uppercase tracking-widest">No Sector Online</h3>
                        <p className="text-stone-500 text-xs mt-2">Initialize a garden sector to begin operations.</p>
                        <button
                            onClick={() => { setDialogMode('create'); setShowGardenDialog(true); }}
                            className="mt-6 px-6 py-2 bg-garden-600 text-stone-900 rounded-lg font-bold uppercase tracking-widest hover:bg-garden-500 transition-colors"
                        >
                            Initialize Sector
                        </button>
                    </div>
                )}
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
                  currentDay={currentDay + scrubDays}
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
          <div className="h-16 glass border-t border-stone-800 px-8 flex items-center justify-between z-20 flex-shrink-0">
            <div className="flex items-center gap-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                 <AlertCircle className="w-3 h-3" /> Systems
              </div>
              <div className="h-4 w-[1px] bg-stone-800" />
              <div className="flex items-center gap-3">
                <button className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-blue-400 transition-all active:scale-90" title="Water">
                  <Droplets className="w-4 h-4" />
                </button>
                <button className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-green-400 transition-all active:scale-90" title="Fertilize">
                  <Activity className="w-4 h-4" />
                </button>
                <button className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-red-400 transition-all active:scale-90" title="Remedy">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full max-w-2xl justify-end">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0 flex items-center gap-2">
                <Hourglass className="w-3 h-3" /> Temporal Axis
              </span>
              <div className="flex-1 max-w-xs">
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={scrubDays}
                  onChange={(e) => setScrubDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-garden-500"
                  aria-label="Temporal scrub slider"
                  title="Scrub through time"
                />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">Future: +{scrubDays} Days</span>
            </div>
          </div>
          </div>
        </div>


        <DragOverlay dropAnimation={null}>
          <div className="w-28 h-40 bg-garden-800 rounded-xl border border-garden-500 border-2 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center p-4">
            <Sprout className="w-16 h-16 text-garden-300" />
            <div className="mt-4 text-[10px] font-black uppercase text-garden-400">Deploying...</div>
          </div>
        </DragOverlay>
      </div>
    </DndContext>
  );
};
