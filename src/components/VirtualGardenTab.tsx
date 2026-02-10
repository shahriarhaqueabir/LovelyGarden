import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Settings as SettingsIcon,
  AlertCircle,
  Calendar,
  LayoutGrid,
  Activity,
  Sprout,
  Plus,
  Edit
} from 'lucide-react';
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { GardenField } from './GardenGrid';
import { InventoryTray } from './InventoryTray';
import { PlantInspector } from './PlantInspector';
import { usePlantedCards } from '../hooks/usePlantedCards';
import { getDatabase } from '../db';
import { advanceGlobalDay, rewindGlobalDay, createGarden, updateGarden } from '../db/queries';
import { GardenConfigDialog, GardenConfig } from './GardenConfigDialog';
import { isSowingSeason } from '../logic/reasoning';
import { showSuccess, showError, showInfo } from '../lib/toast';
import type { PlantedDocument } from '../db/types';
import { PlantSpecies } from '../schema/knowledge-graph';
import type { Subscription } from 'rxjs';

interface VirtualGardenTabProps {
  catalog: PlantSpecies[];
  currentDay: number;
  setCurrentDay: (day: number) => void;
  xp: number;
  setXp: React.Dispatch<React.SetStateAction<number>>;
  alerts: string[];
  onOpenSeedStore?: () => void;
}

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
  const [selectedPlant, setSelectedPlant] = useState<PlantedDocument | null>(null);
  const [spectralLayer, setSpectralLayer] = useState<'normal' | 'hydration' | 'health' | 'nutrients'>('normal');
  const [activeSeedCatalogId, setActiveSeedCatalogId] = useState<string | null>(null);
  const [plantNowMode, setPlantNowMode] = useState(false);
  const [scrubDays, setScrubDays] = useState(0);
  const [plantNowSet, setPlantNowSet] = useState<Set<string>>(new Set());
  
  // Dialog State
  const [showGardenDialog, setShowGardenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  // Reactive subscription for gardens
  useEffect(() => {
    let sub: Subscription;
    const initSub = async () => {
      const db = await getDatabase();
      sub = db.gardens.find().$.subscribe(docs => {
        const gardensData = docs.map(d => d.toJSON());
        gardensData.sort((a, b) => {
            if (a.id === 'main-garden') return -1;
            if (b.id === 'main-garden') return 1;
            return (a.createdDate || 0) - (b.createdDate || 0);
        });
        setGardens(gardensData);

        // Auto-select first garden if none selected
        if (gardensData.length > 0) {
            setActiveGardenId(prev => {
                if (prev) return prev;
                return gardensData[0].id;
            });
        }
      });
    };
    initSub();
    return () => sub && sub.unsubscribe();
  }, []); // Run once to setup subscription

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
        showError('No active garden selected');
        return;
      }

      const inventoryId = active.id.toString().replace('seed-', '');
      const catalogId = active.data.current?.id;
      const { x, y } = over.data.current as { x: number; y: number };
      
      // Check grid capacity
      const totalCells = activeGarden.gridWidth * activeGarden.gridHeight;
      const occupiedCells = plantedCards.length;
      
      if (occupiedCells >= totalCells) {
        showError('Expand Grid to Plant');
        return;
      }
      
      // Check if slot is already occupied
      const existingPlant = plantedCards.find((p) => p.gridX === x && p.gridY === y);
      if (existingPlant) {
        showError('Slot already occupied');
        return;
      }
      
      // Import plantSeed function
      const { plantSeed } = await import('../db/queries');
      try {
        await plantSeed(catalogId, x, y, inventoryId, activeGarden.id);
        showSuccess('Plant added to garden');
      } catch {
        showError('Failed to plant seed');
      }
    }
  };

  const handleSaveGarden = async (config: GardenConfig) => {
      try {
          if (dialogMode === 'create') {
              const newId = await createGarden(config);
              await refreshGardens();
              setActiveGardenId(newId); // Immediately switch to new garden
              showSuccess('New garden sector established');
          } else {
              // Edit
              if (!config.id) return;
              await updateGarden(config.id, {
                 name: config.name,
                 type: config.type,
                 soilType: config.soilType,
                 sunExposure: config.sunExposure,
                 gridWidth: config.gridWidth,
                 gridHeight: config.gridHeight,
                 backgroundColor: config.backgroundColor,
                 theme: config.theme
              });
              await refreshGardens();
              showSuccess('Garden specs updated');
          }
      } catch (err) {
          console.error("Failed to save garden:", err);
          showError('Failed to save garden configuration');
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
        const res = isSowingSeason(c, { id: 'user_location', hemisphere: 'North', frost_data: {} }, currentMonth);
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
      <div className="flex flex-col h-full bg-app-background text-stone-100 overflow-hidden font-sans">
        
        {/* Garden Configuration Dialog */}
        {showGardenDialog && (
            <GardenConfigDialog
                mode={dialogMode}
                initialConfig={dialogMode === 'edit' ? activeGarden : null}
                onClose={() => setShowGardenDialog(false)}
                onSave={handleSaveGarden}
                isGardenEmpty={plantedCards.length === 0}
            />
        )}

        {/* HUD OVERLAY */}
        <header className="min-h-12 flex flex-wrap items-center justify-between px-2 sm:px-4 lg:px-6 gap-1 sm:gap-2 glass z-30 border-b border-stone-800">
          {/* 1. Cycle Day */}
          <div className="bg-stone-900 px-2 sm:px-3 py-1 rounded-full border border-stone-800 text-xs font-black text-garden-400 uppercase tracking-widest shadow-inner flex items-center gap-1 sm:gap-2 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-garden-500" /> <span className="hidden xs:inline">Day:</span> {currentDay}
          </div>

          {/* 2. Grid Capacity */}
          <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest shadow-inner shrink-0 ${
            isGridFull ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-stone-900 border-stone-800 text-stone-400'
          }`}>
            <LayoutGrid className="w-3 h-3" />
            <span>{occupiedCells}/{totalCells}</span>
          </div>

          {/* 3. Temporal Axis - Hidden below md */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 bg-stone-900 px-2 sm:px-3 py-1 rounded-xl border border-stone-800 shadow-inner shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1">
              ⏳ <span className="hidden lg:inline">Axis</span>
            </span>
            <input
              type="range"
              min={0}
              max={30}
              value={scrubDays}
              onChange={(e) => setScrubDays(parseInt(e.target.value, 10) || 0)}
              className="w-16 sm:w-24 accent-garden-500 h-1"
              aria-label="Temporal scrub slider"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">+{scrubDays}d</span>
          </div>

          {/* 4. Global Alerts Marquee - Hidden below xl */}
          <div className="max-w-[200px] overflow-hidden hidden xl:block">
            <div className="animate-marquee whitespace-nowrap text-[10px] text-stone-500 uppercase tracking-widest">
              {alerts.join(' • ')}
            </div>
          </div>

          {/* 5. Intervention Console - Hidden below sm */}
          <div className="hidden sm:flex items-center gap-1.5 glass-panel p-1 rounded-xl border border-stone-800 shrink-0 shadow-inner">
            <button className="p-1.5 bg-stone-950/40 border border-stone-800 rounded text-stone-500 hover:text-blue-400 transition-all hover:scale-110 active:scale-90" title="Water">
              <Droplets className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 bg-stone-950/40 border border-stone-800 rounded text-stone-500 hover:text-green-400 transition-all hover:scale-110 active:scale-90" title="Fertilize">
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 bg-stone-950/40 border border-stone-800 rounded text-stone-500 hover:text-red-400 transition-all hover:scale-110 active:scale-90" title="Remedy">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6. Spectral Layer Toggle - Hidden below lg */}
          <div className="hidden lg:flex bg-stone-900 p-1 rounded-xl border border-stone-800 shadow-inner shrink-0">
            <button onClick={() => setSpectralLayer('normal')} className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === 'normal' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500'}`}>
              Visual
            </button>
            <button onClick={() => setSpectralLayer('hydration')} className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === 'hydration' ? 'bg-blue-900/40 text-blue-400 shadow-md' : 'text-stone-500'}`}>
              Hydration
            </button>
            <button onClick={() => setSpectralLayer('health')} className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === 'health' ? 'bg-red-900/40 text-red-400 shadow-md' : 'text-stone-500'}`}>
              Blight
            </button>
          </div>

          {/* 7. XP/Level Tracker - Hidden below sm */}
          <div className="hidden sm:flex items-center gap-2 bg-stone-900 px-2 sm:px-3 py-1 rounded-full border border-stone-800 shrink-0">
            <span className="text-[10px] font-bold text-garden-400">XP: {xp}</span>
            <div className="h-1.5 w-12 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-garden-500 rounded-full" style={{ width: `${(xp % 100) / 100 * 100}%` }}></div>
            </div>
          </div>

          {/* 8. Action Block */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={() => {}} className="p-1.5 bg-stone-900/50 border border-stone-800 rounded-xl text-stone-500 hover:text-stone-300 transition-all" title="Settings" aria-label="Settings">
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
            <div className="h-6 w-[1px] bg-stone-800 mx-0.5 sm:mx-1" />
            <button onClick={handleRewindDay} disabled={currentDay <= 1} className={`p-1.5 font-black rounded-lg text-xs transition-all active:scale-95 shadow-lg ${currentDay <= 1 ? 'bg-stone-700 text-stone-500 opacity-50' : 'bg-amber-600 text-stone-950 hover:bg-amber-400'}`} title="Rewind Day" aria-label="Rewind Day">
              ↩️
            </button>
            <button onClick={handleAdvanceDay} className="p-1.5 bg-garden-600 text-stone-950 font-black rounded-lg text-xs hover:bg-garden-400 transition-all active:scale-95 shadow-lg shadow-garden-500/20" title="Advance Day" aria-label="Advance Day">
              ↪️
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR: BAG */}
          <InventoryTray
            catalog={catalog}
            onOpenStore={onOpenSeedStore || (() => {})}
            isVertical={true}
            plantNowMode={plantNowMode}
            onTogglePlantNow={() => setPlantNowMode(v => !v)}
            plantNowSet={plantNowSet}
          />

          {/* MAIN CONTENT COLUMN */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-primary/20">
            <div className="h-12 glass-panel border-b border-stone-800 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shadow-lg relative">
              <div className="absolute inset-0 shimmer-bg opacity-30 pointer-events-none" />
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
                                relative h-full px-4 sm:px-6 flex items-center justify-center text-xs sm:text-[13px] font-bold uppercase tracking-widest transition-all border-r border-t border-stone-800 flex-shrink-0 max-w-[100px] sm:max-w-[120px] md:max-w-[150px] z-10
                                ${i === 0 ? 'border-l' : ''}
                                ${isActive
                                    ? 'bg-bg-primary text-garden-400 border-b-bg-primary translate-y-[1px]'
                                    : garden 
                                        ? 'bg-[#090c0a] text-stone-500 hover:text-stone-300 hover:bg-stone-800 border-b-border-primary'
                                        : 'bg-[#090c0a]/30 text-stone-700 hover:text-stone-500 hover:bg-[#090c0a]/50 border-b-border-primary'}`}
                            title={garden ? garden.name : `Create Garden ${i + 1}`}
                        >
                            {garden ? (
                                <span className="truncate block w-full text-center">{garden.name}</span>
                            ) : (
                                <span className="flex items-center gap-2 opacity-60">
                                    <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Garden {i + 1}</span>
                                </span>
                            )}
                            {i === 0 && garden && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]" title="Primary Axis" />}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-1 relative overflow-hidden">

            {/* CENTER PANE: TACTICAL FIELD */}
          <div className="flex-1 flex flex-col relative overflow-hidden terrain-texture">
              {/* Garden Config Controls (Edit/Delete Active) */}
              {activeGarden && (
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 rounded-xl p-2 shadow-lg backdrop-blur-sm">
                          <div className="text-[13px] font-bold uppercase text-stone-400 px-2 border-r border-stone-700">
                              {activeGarden.type}
                          </div>
                          <div className="text-[13px] font-bold uppercase text-stone-400 px-2 border-r border-stone-700">
                             ☀️ {activeGarden.sunExposure}
                          </div>
                          <div className="text-[13px] font-bold uppercase text-stone-400 px-2 border-r border-stone-700">
                             💧 {activeGarden.soilType}
                          </div>
                      <button
                          onClick={() => { setDialogMode('edit'); setShowGardenDialog(true); }}
                          className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-500 hover:text-garden-400 transition-colors"
                          title="Configure Garden"
                      >
                          <Edit className="w-4 h-4" />
                      </button>
                      </div>
                  </div>
              )}

              {/* THE FIELD */}

              <main className="flex-1 flex justify-center items-center overflow-auto p-12">
                {activeGarden ? (
                    <GardenField
                      key={activeGarden.id} // Force remount on garden switch to clear grid state
                      items={plantedCards.map((p: PlantedDocument) => ({
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
                      onEdit={(item: PlantedDocument) => console.log('Edit plant:', item)}
                      onDelete={async (item: PlantedDocument) => {
                        if (window.confirm(`This will delete ${item.catalogId}. Proceed?`)) {
                          const db = await getDatabase();
                          await db.planted.findOne(item.id).remove();
                          showInfo('Plant removed from garden');
                        }
                      }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center opacity-30">
                        <AlertCircle className="w-12 h-12 text-stone-500 mb-4" />
                        <h3 className="text-[21px] font-bold text-stone-400 uppercase tracking-widest">No Sector Online</h3>
                        <p className="text-stone-500 text-[15px] mt-2">Initialize a garden sector to begin operations.</p>
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
              glass border-l border-border-primary transition-all duration-500 overflow-hidden flex flex-col z-30
            `}>
              {selectedPlant && (
                <PlantInspector
                  plant={selectedPlant}
                  catalogItem={catalog.find(c => c.id === selectedPlant.catalogId) as PlantSpecies | undefined}
                  companionScore={1}
                  currentDay={currentDay + scrubDays}
                  onClose={() => setSelectedPlant(null)}
                  docked
                />
              )}
              {!selectedPlant && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-20">
                  <span className="text-2xl">ℹ️</span>
                  <p className="text-[13px] font-bold uppercase tracking-widest text-stone-500">Intelligence Node Inactive</p>
                  <p className="text-[12px] text-stone-600 italic">Select a plant unit from the tactical field to initialize link...</p>
                </div>
              )}
            </aside>
            </div>


          </div>
        </div>


        <DragOverlay dropAnimation={null}>
          <div className="w-40 h-40 bg-garden-800 rounded-3xl border border-garden-500 border-2 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center p-4">
            <Sprout className="w-16 h-16 text-garden-300" />
            <div className="mt-4 text-[13px] font-black uppercase text-garden-400">Deploying...</div>
          </div>
        </DragOverlay>
      </div>
    </DndContext>
  );
};
