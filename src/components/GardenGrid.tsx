import React, { useMemo, useState, useEffect } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Edit, Trash2, Bug, X, Zap, Sparkles, Skull, ShoppingBasket, Waves, Droplets, Activity, AlertTriangle, FlaskConical, Plus } from 'lucide-react';
import { PlantedCardView } from './PlantedCard';
import { calculateCompanionScore } from '../logic/reasoning';
import { calculateCurrentStage, getCompletedStages } from '../logic/lifecycle';
import type { PlantedDocument, CatalogDocument, Relationship, GridLayer, PlantHealthStatus } from '../db/types';

interface GridSlotProps {
  x: number;
  y: number;
  item?: PlantedDocument;
  onSelect?: (item: PlantedDocument) => void;
  layer: GridLayer;
  activeSeedCatalogId?: string | null;
  getItemAt?: (x: number, y: number) => PlantedDocument | undefined;
  relationships?: Relationship[];
  onEdit?: (item: PlantedDocument) => void;
  onDelete?: (item: PlantedDocument) => void;
  onStatusChange?: (item: PlantedDocument, status: PlantHealthStatus) => void;
  catalog?: CatalogDocument[]; // Added catalog prop
}

// Observation Menu Component
const ObservationMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onStatusSelect: (status: PlantHealthStatus) => void;
  currentStatus?: string;
}> = ({ isOpen, onClose, onStatusSelect, currentStatus }) => {
  if (!isOpen) return null;

  const statuses: { value: PlantHealthStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'Healthy', label: 'Healthy', icon: <Sparkles className="w-3 h-3" />, color: 'text-green-400' },
    { value: 'Pest Infestation', label: 'Pest', icon: <Bug className="w-3 h-3" />, color: 'text-amber-400' },
    { value: 'Dead', label: 'Dead', icon: <Skull className="w-3 h-3" />, color: 'text-red-400' },
    { value: 'Harvested', label: 'Harvested', icon: <ShoppingBasket className="w-3 h-3" />, color: 'text-blue-400' },
    { value: 'Overwatered', label: 'Overwatered', icon: <Waves className="w-3 h-3" />, color: 'text-cyan-400' },
  ];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
      <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-2 min-w-[140px]">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-800">
          <span className="text-[10px] font-bold uppercase text-stone-500">Status</span>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-400" title="Close status selector">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-1">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => { onStatusSelect(status.value); onClose(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-bold transition-all ${
                currentStatus === status.value 
                  ? 'bg-stone-800 ' + status.color 
                  : 'hover:bg-stone-800/50 text-stone-400 hover:' + status.color
              }`}
            >
              {status.icon}
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const DraggablePlant: React.FC<{ item: PlantedDocument; children: React.ReactNode }> = ({ item, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planted-${item.id}`,
    data: { item }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`w-full h-full relative cursor-grab active:cursor-grabbing transition-transform ${isDragging ? 'opacity-30 scale-90' : ''}`}
    >
      {children}
    </div>
  );
};

export const GridSlot: React.FC<GridSlotProps> = ({ 
  x, y, item, onSelect, layer, activeSeedCatalogId, getItemAt, relationships, onEdit, onDelete, onStatusChange, catalog 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${x}-${y}`,
    data: { x, y }
  });

  const [showActions, setShowActions] = useState(false);
  const [showObservationMenu, setShowObservationMenu] = useState(false);

  const stressLevel = item?.stressLevel || 0;
  const hydration = item?.hydration || 100;
  const n = item?.nutrients?.n || 50;
  const p = item?.nutrients?.p || 50;
  const k = item?.nutrients?.k || 50;
  const healthStatus = item?.healthStatus || 'Healthy';
  const isDead = healthStatus === 'Dead';
  const isPestInfested = healthStatus === 'Pest Infestation';

  // --- Growth & Stage Calculation ---
  const currentCatalogItem = useMemo(() => {
      if (!item || !catalog) return undefined;
      return catalog.find(c => c.id === item.catalogId);
  }, [item, catalog]);

  const [growthData, setGrowthData] = useState<{ completedStages: string[], daysElapsed: number, stage: string }>({ completedStages: [], daysElapsed: 0, stage: 'seedling' });

  useEffect(() => {
      if (!item || !currentCatalogItem?.stages) {
          setGrowthData({ completedStages: [], daysElapsed: 0, stage: 'seedling' });
          return;
      }
      
      const now = Date.now();
      const planted = item.plantedDate;
      
      let days = 0;
      if (planted > 100000) { 
         days = Math.floor((now - planted) / (1000 * 60 * 60 * 24));
      }
      if (days < 0) days = 0;

      const completed = getCompletedStages(planted, currentCatalogItem.stages, now);
      const stage = calculateCurrentStage(planted, currentCatalogItem.stages, now);
      
      // Update local state with time-dependent calculations
      setGrowthData({ completedStages: completed, daysElapsed: days, stage });
  }, [item, currentCatalogItem]);
  // ----------------------------------

  // --- Sprint 2: Companion Synergy Overlay ---
  const synergy = useMemo(() => {
    if (!activeSeedCatalogId || !getItemAt || !relationships) return 0;

    // Evaluate effect of placing activeSeedCatalogId *here* against existing neighbor plants.
    const neighborIds: string[] = [];
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    for (const d of dirs) {
      const nItem = getItemAt(x + d.dx, y + d.dy);
      if (nItem?.catalogId) neighborIds.push(nItem.catalogId);
    }

    if (neighborIds.length === 0) return 0;
    return calculateCompanionScore(activeSeedCatalogId, neighborIds, (relationships || []) as any);
  }, [activeSeedCatalogId, getItemAt, relationships, x, y]);

  // Zero-Click Health logic: Use border color to reflect state without clicking
  const getBorderColor = () => {
    if (isOver) return 'border-garden-400';
    if (!item) return 'border-stone-800 hover:border-stone-700';

    if (isDead) return 'border-stone-600 bg-app-background/50';
    if (isPestInfested) return 'border-amber-500 shadow-[inset_0_0_15px_rgba(245,158,11,0.3)]';

    if (layer === 'hydration') {
      if (hydration < 30) return 'border-blue-600 shadow-[inset_0_0_10px_rgba(37,99,235,0.3)] shadow-blue-500/20';
      return 'border-blue-400/30';
    }

    if (layer === 'health') {
      if (stressLevel > 70) return 'border-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.4)] pulse-red';
      if (stressLevel > 40) return 'border-amber-500/50';
      return 'border-garden-500/30';
    }

    if (layer === 'nutrients') {
      const avg = (n + p + k) / 3;
      if (avg < 30) return 'border-purple-600';
      return 'border-purple-400/30';
    }

    // Default "Visual" mode
    if (stressLevel > 80) return 'border-red-500/50';
    if (stressLevel > 40) return 'border-amber-500/40';
    return 'border-garden-900/40 shadow-xl';
  };

  const getAnimationClass = () => {
    if (!item || isDead) return '';
    if (isPestInfested) return 'animate-pest';
    if (stressLevel > 70) return 'animate-stressed';
    if (stressLevel < 20 && hydration > 70) return 'animate-healthy';
    return '';
  };

  const getOverlayLabel = () => {
    if (isDead) return <span className="flex items-center gap-1"><Skull className="w-3 h-3" /> COMPOST</span>;
    if (isPestInfested) return <span className="flex items-center gap-1"><Bug className="w-3 h-3" /> PEST ALERT</span>;
    if (layer === 'hydration') return <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {Math.round(hydration)}% H2O</span>;
    if (layer === 'health') return stressLevel > 70 ? <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> CRITICAL BLIGHT</span> : <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {Math.round(stressLevel)}% STRESS</span>;
    if (layer === 'nutrients') return <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" /> NITRO: {n}%</span>;
    return null;
  };

  // Synergy Buff: Glow Effect + 10% Growth Multiplier indicator
  const synergyClass = activeSeedCatalogId
    ? synergy > 0
      ? 'ring-2 ring-garden-400/80 shadow-[0_0_22px_rgba(34,197,94,0.35)]'
      : synergy < 0
        ? 'ring-2 ring-red-500/70 shadow-[0_0_22px_rgba(239,68,68,0.25)]'
        : 'ring-1 ring-stone-700/60'
    : '';

  // Contagion Logic: Check if neighbors have pest infestation
  const contagionRisk = useMemo(() => {
    if (!getItemAt) return false;
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    for (const d of dirs) {
      const nItem = getItemAt(x + d.dx, y + d.dy);
      if (nItem?.healthStatus === 'Pest Infestation') return true;
    }
    return false;
  }, [getItemAt, x, y]);

  const handleStatusChange = (status: PlantHealthStatus) => {
    if (item) {
      onStatusChange?.(item, status);
    }
  };

  const handleEdit = () => {
    if (item) {
      onEdit?.(item);
    }
  };

  const handleDelete = async () => {
    if (item && globalThis.confirm(`This will delete ${item.catalogId}. Proceed?`)) {
      onDelete?.(item);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={() => item && onSelect?.(item)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowObservationMenu(false);
      }}
      className={`
        relative w-full aspect-square max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[140px] xl:max-w-[160px] border-2 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer depth-3d
        ${getBorderColor()}
        ${item ? 'glass-panel' : 'bg-app-background/40'}
        ${synergyClass}
        ${contagionRisk && !isPestInfested ? 'pulse-red border-amber-500/30' : ''}
        ${getAnimationClass()}
        group
      `}
    >
      {item ? (
        <DraggablePlant item={item}>
        <div className="w-full h-full p-3 flex flex-col items-center justify-between relative overflow-hidden shimmer-bg rounded-3xl">
          {/* Layer Specific Overlays */}
          {layer !== 'normal' && !isDead && (
            <div className={`
              absolute inset-0 z-0 opacity-10 pointer-events-none transition-all
              ${layer === 'hydration' ? 'bg-blue-500' : layer === 'health' ? 'bg-red-500' : 'bg-purple-500'}
            `} />
          )}

          {/* Death State: Compost Icon */}
          {isDead ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Skull className="w-8 h-8 text-stone-600 mb-2" />
              <span className="text-[10px] font-bold text-stone-500 uppercase">Compost</span>
            </div>
          ) : (
            <>
              <div className="z-10 w-full flex justify-between items-start">
                <span className="text-[11px] font-black uppercase text-stone-500">{item.catalogId}</span>
                <div className="flex gap-1">
                  {stressLevel > 70 && <span className="text-[13px] animate-pulse"><AlertTriangle className="w-4 h-4 text-red-500" /></span>}
                  {hydration > 90 && stressLevel < 10 && <span className="text-[13px]"><Sparkles className="w-4 h-4 text-garden-400" /></span>}
                  {isPestInfested && <span className="text-[13px] animate-bounce"><Bug className="w-4 h-4 text-amber-500" /></span>}
                </div>
              </div>

              <div className="z-10 group-hover:scale-110 transition-transform duration-500 my-auto">
                <PlantedCardView 
                    catalogId={item.catalogId} 
                    stage={growthData.stage}
                    completedStages={growthData.completedStages}
                    daysElapsed={growthData.daysElapsed}
                />
              </div>

              <div className="z-10 w-full space-y-2">
                {/* Spectral Metric Label */}
                {getOverlayLabel() && (
                  <div className="flex justify-center">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                       isDead ? 'bg-stone-800 border-stone-600 text-stone-400' :
                       isPestInfested ? 'bg-amber-900/30 border-amber-500 text-amber-400' :
                       layer === 'hydration' ? 'bg-blue-900/30 border-blue-500 text-blue-400' :
                       layer === 'health' ? 'bg-red-900/30 border-red-500 text-red-400' :
                       'bg-purple-900/30 border-purple-500 text-purple-400'
                    }`}>
                      {getOverlayLabel()}
                    </span>
                  </div>
                )}

                {/* Synergy Buff Indicator */}
                {synergy > 0 && activeSeedCatalogId && (
                  <div className="flex justify-center">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-garden-900/30 border border-garden-500 text-garden-400">
                      +10% Growth
                    </span>
                  </div>
                )}

                {/* Contagion Risk Warning */}
                {contagionRisk && !isPestInfested && (
                  <div className="flex justify-center">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-500 text-amber-400 animate-pulse">
                      Disease Risk
                    </span>
                  </div>
                )}

                {/* Bars for Quick View */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-stone-800/50 rounded-full overflow-hidden">
                     <div
                       className={`h-full opacity-60 ${hydration < 30 ? 'bg-amber-500' : 'bg-blue-500'}`}
                       style={{ width: `${hydration}%` }}
                     />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          {showActions && item && !isDead && (
            <div className="absolute top-2 right-2 flex gap-1 z-20">
              <button
                onClick={(e) => { e.stopPropagation(); setShowObservationMenu(true); }}
                className="p-1.5 bg-stone-900/80 border border-stone-700 rounded text-stone-400 hover:text-amber-400 transition-colors"
                title="Update Status"
              >
                <Bug className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="p-1.5 bg-stone-900/80 border border-stone-700 rounded text-stone-400 hover:text-garden-400 transition-colors"
                title="Edit Plant"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="p-1.5 bg-stone-900/80 border border-stone-700 rounded text-stone-400 hover:text-red-400 transition-colors"
                title="Remove Plant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Observation Menu */}
          {showObservationMenu && (
            <ObservationMenu
              isOpen={showObservationMenu}
              onClose={() => setShowObservationMenu(false)}
              onStatusSelect={handleStatusChange}
              currentStatus={healthStatus}
            />
          )}
        </div>
        </DraggablePlant>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-60 transition-opacity">
           <Zap className="w-8 h-8 text-stone-700" />
           <Plus className="w-10 h-10 text-stone-500" />
           <span className="text-[11px] font-black tracking-widest uppercase">{x},{y}</span>
        </div>
      )}
    </div>
  );
};

export const GardenField: React.FC<{
  items: PlantedDocument[];
  onSelect?: (item: PlantedDocument) => void;
  layer: GridLayer;
  activeSeedCatalogId?: string | null;
  catalog?: CatalogDocument[];
  rows?: number;
  cols?: number;
  onEdit?: (item: PlantedDocument) => void;
  onDelete?: (item: PlantedDocument) => void;
}> = ({ items, onSelect, layer, activeSeedCatalogId, catalog, rows = 3, cols = 4, onEdit, onDelete }) => {
  const getItemAt = (x: number, y: number) => {
    return items.find(item => item.gridX === x && item.gridY === y);
  };

  const relationships = (catalog || []).flatMap((c: CatalogDocument) => 
    (c.companions || []).map((targetId: string): Relationship => ({
      targetPlantId: targetId,
      type: 'companion',
      strength: 1,
    }))
  );

  // Handle status changes with simulation pause logic
  const handleStatusChange = async (item: PlantedDocument, status: PlantHealthStatus) => {
    const db = await import('../db').then(m => m.getDatabase());
    const doc = await db.planted.findOne(item.id).exec();
    
    if (doc) {
      // Pause simulation for certain statuses
      const pauseSimulation = ['Pest Infestation', 'Overwatered', 'Dead'].includes(status);
      
      await doc.patch({
        healthStatus: status,
        simulationPaused: pauseSimulation,
        // If dead, freeze all counters
        ...(status === 'Dead' && {
          hydration: 0,
          stressLevel: 100,
          nutrients: { n: 0, p: 0, k: 0 }
        })
      });
    }
  };

  return (
    <div className="relative group/field">
      {/* Field FX */}
      <div className="absolute -inset-10 bg-garden-500/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover/field:opacity-100 transition-opacity duration-1000" />

      <div
        className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 relative z-10 w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          const item = items.find(p => p.gridX === x && p.gridY === y); // Explicit find
          
          return (
            <GridSlot
              key={`${x}-${y}`}
              x={x}
              y={y}
              item={item}
              onSelect={onSelect}
              layer={layer}
              activeSeedCatalogId={activeSeedCatalogId}
              getItemAt={getItemAt}
              relationships={relationships}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={handleStatusChange}
            />
          );
        })}
      </div>
    </div>
  );
};
