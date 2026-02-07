import React, { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Edit, Trash2, Bug, X, Zap } from 'lucide-react';
import { PlantedCardView } from './PlantedCard';
import { calculateCompanionScore } from '../logic/reasoning';

type PlantStatus = 'Healthy' | 'Pest Infestation' | 'Dead' | 'Harvested' | 'Overwatered';

interface GridSlotProps {
  x: number;
  y: number;
  item?: any;
  onSelect?: (item: any) => void;
  layer: 'normal' | 'hydration' | 'health' | 'nutrients';
  activeSeedCatalogId?: string | null;
  getItemAt?: (x: number, y: number) => any;
  relationships?: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onStatusChange?: (item: any, status: PlantStatus) => void;
}

// Observation Menu Component
const ObservationMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onStatusSelect: (status: PlantStatus) => void;
  currentStatus?: string;
}> = ({ isOpen, onClose, onStatusSelect, currentStatus }) => {
  if (!isOpen) return null;

  const statuses: { value: PlantStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'Healthy', label: 'Healthy', icon: <span>✨</span>, color: 'text-green-400' },
    { value: 'Pest Infestation', label: 'Pest', icon: <span>🐛</span>, color: 'text-amber-400' },
    { value: 'Dead', label: 'Dead', icon: <span>💀</span>, color: 'text-red-400' },
    { value: 'Harvested', label: 'Harvested', icon: <span>🧺</span>, color: 'text-blue-400' },
    { value: 'Overwatered', label: 'Overwatered', icon: <span>🌊</span>, color: 'text-cyan-400' },
  ];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
      <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-2 min-w-[140px]">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-800">
          <span className="text-[10px] font-bold uppercase text-stone-500">Status</span>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-400">
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

export const GridSlot: React.FC<GridSlotProps> = ({ 
  x, y, item, onSelect, layer, activeSeedCatalogId, getItemAt, relationships, onEdit, onDelete, onStatusChange 
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
    return calculateCompanionScore(activeSeedCatalogId, neighborIds, relationships as any);
  }, [activeSeedCatalogId, getItemAt, relationships, x, y]);

  // Zero-Click Health logic: Use border color to reflect state without clicking
  const getBorderColor = () => {
    if (isOver) return 'border-garden-400';
    if (!item) return 'border-stone-800 hover:border-stone-700';

    if (isDead) return 'border-stone-600 bg-stone-900/50';
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
    if (stressLevel > 80) return 'border-red-500/50 pulse-red';
    if (stressLevel > 40) return 'border-amber-500/40';
    return 'border-garden-900/40 shadow-xl';
  };

  const getOverlayLabel = () => {
    if (isDead) return '💀 COMPOST';
    if (isPestInfested) return '🐛 PEST ALERT';
    if (layer === 'hydration') return `💧 ${Math.round(hydration)}% H2O`;
    if (layer === 'health') return stressLevel > 70 ? '⚠️ CRITICAL BLIGHT' : `🌡️ ${Math.round(stressLevel)}% STRESS`;
    if (layer === 'nutrients') return `🧪 NITRO: ${n}%`;
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

  const handleStatusChange = (status: PlantStatus) => {
    onStatusChange?.(item, status);
  };

  const handleEdit = () => {
    onEdit?.(item);
  };

  const handleDelete = async () => {
    if (window.confirm(`This will delete ${item.catalogId}. Proceed?`)) {
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
        relative w-36 h-48 border-2 rounded-3xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer
        ${getBorderColor()}
        ${item ? 'glass' : 'bg-stone-900/20'}
        ${synergyClass}
        ${contagionRisk && !isPestInfested ? 'animate-pulse border-amber-500/30' : ''}
        group
      `}
    >
      {item ? (
        <div className="w-full h-full p-3 flex flex-col items-center justify-between relative overflow-hidden">
          {/* Layer Specific Overlays */}
          {layer !== 'normal' && !isDead && (
            <div className={`
              absolute inset-0 z-0 opacity-20 pointer-events-none transition-all
              ${layer === 'hydration' ? 'bg-blue-500' : layer === 'health' ? 'bg-red-500' : 'bg-purple-500'}
            `} />
          )}

          {/* Death State: Compost Icon */}
          {isDead ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="text-4xl mb-2">🍂</div>
              <span className="text-[10px] font-bold text-stone-500 uppercase">Compost</span>
            </div>
          ) : (
            <>
              <div className="z-10 w-full flex justify-between items-start">
                <span className="text-[8px] font-black uppercase text-stone-500 tracking-tighter line-clamp-1">{item.catalogId}</span>
                <div className="flex gap-1">
                  {stressLevel > 70 && <span className="text-[10px] animate-pulse">⚠️</span>}
                  {hydration > 90 && stressLevel < 10 && <span className="text-[10px]">🛡️</span>}
                  {isPestInfested && <span className="text-[10px] animate-bounce">🐛</span>}
                </div>
              </div>

              <div className="z-10 group-hover:scale-110 transition-transform duration-500 my-auto">
                <PlantedCardView catalogId={item.catalogId} stage="seedling" />
              </div>

              <div className="z-10 w-full space-y-2">
                {/* Spectral Metric Label */}
                {getOverlayLabel() && (
                  <div className="flex justify-center">
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${
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
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-garden-900/30 border border-garden-500 text-garden-400">
                      +10% Growth
                    </span>
                  </div>
                )}

                {/* Contagion Risk Warning */}
                {contagionRisk && !isPestInfested && (
                  <div className="flex justify-center">
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-500 text-amber-400 animate-pulse">
                      Disease Risk
                    </span>
                  </div>
                )}

                {/* Bars for Quick View */}
                <div className="space-y-1">
                  <div className="h-1 w-full bg-stone-800/50 rounded-full overflow-hidden">
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
                <Bug className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="p-1.5 bg-stone-900/80 border border-stone-700 rounded text-stone-400 hover:text-garden-400 transition-colors"
                title="Edit Plant"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="p-1.5 bg-stone-900/80 border border-stone-700 rounded text-stone-400 hover:text-red-400 transition-colors"
                title="Remove Plant"
              >
                <Trash2 className="w-3 h-3" />
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
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-60 transition-opacity">
           <Zap className="w-6 h-6 text-stone-700" />
           <span className="text-xl">➕</span>
           <span className="text-[8px] font-black tracking-widest uppercase">{x},{y}</span>
        </div>
      )}
    </div>
  );
};

export const GardenField: React.FC<{
  items: any[];
  onSelect?: (item: any) => void;
  layer: any;
  activeSeedCatalogId?: string | null;
  catalog?: any[];
  rows?: number;
  cols?: number;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}> = ({ items, onSelect, layer, activeSeedCatalogId, catalog, rows = 3, cols = 4, onEdit, onDelete }) => {
  const getItemAt = (x: number, y: number) => {
    return items.find(item => item.gridX === x && item.gridY === y);
  };

  const relationships = (catalog || []).flatMap((c: any) => c.relationships || []);

  // Handle status changes with simulation pause logic
  const handleStatusChange = async (item: any, status: PlantStatus) => {
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
        className="grid gap-8 relative z-10"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          width: 'max-content'
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          return (
            <GridSlot
              key={i}
              x={x}
              y={y}
              item={getItemAt(x, y)}
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
