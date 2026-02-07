import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AlertTriangle, Zap, ShieldCheck } from 'lucide-react';
import { PlantedCardView } from './PlantedCard';
import { calculateCompanionScore } from '../logic/reasoning';

interface GridSlotProps {
  x: number;
  y: number;
  item?: any;
  onSelect?: (item: any) => void;
  layer: 'normal' | 'hydration' | 'health' | 'nutrients';
  activeSeedCatalogId?: string | null;
  getItemAt?: (x: number, y: number) => any;
  relationships?: any[];
}

export const GridSlot: React.FC<GridSlotProps> = ({ x, y, item, onSelect, layer, activeSeedCatalogId, getItemAt, relationships }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${x}-${y}`,
    data: { x, y }
  });

  const stressLevel = item?.stressLevel || 0;
  const hydration = item?.hydration || 100;
  const n = item?.nutrients?.n || 50;
  const p = item?.nutrients?.p || 50;
  const k = item?.nutrients?.k || 50;

  // Zero-Click Health logic: Use border color to reflect state without clicking
  const getBorderColor = () => {
    if (isOver) return 'border-garden-400';
    if (!item) return 'border-stone-800 hover:border-stone-700';
    
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
    if (layer === 'hydration') return `${Math.round(hydration)}% H2O`;
    if (layer === 'health') return stressLevel > 70 ? 'CRITICAL BLIGHT' : `${Math.round(stressLevel)}% STRESS`;
    if (layer === 'nutrients') return `NITRO: ${n}%`;
    return null;
  };

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

  const synergyClass = activeSeedCatalogId
    ? synergy > 0
      ? 'ring-2 ring-garden-400/80 shadow-[0_0_22px_rgba(34,197,94,0.35)]'
      : synergy < 0
        ? 'ring-2 ring-red-500/70 shadow-[0_0_22px_rgba(239,68,68,0.25)]'
        : 'ring-1 ring-stone-700/60'
    : '';

  return (
    <div 
      ref={setNodeRef}
      onClick={() => item && onSelect?.(item)}
      className={`
        relative w-36 h-48 border-2 rounded-3xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer
        ${getBorderColor()}
        ${item ? 'glass' : 'bg-stone-900/20'}
        ${synergyClass}
        group
      `}
    >
      {item ? (
        <div className="w-full h-full p-3 flex flex-col items-center justify-between relative overflow-hidden">
          {/* Layer Specific Overlays */}
          {layer !== 'normal' && (
            <div className={`
              absolute inset-0 z-0 opacity-20 pointer-events-none transition-all
              ${layer === 'hydration' ? 'bg-blue-500' : layer === 'health' ? 'bg-red-500' : 'bg-purple-500'}
            `} />
          )}

          <div className="z-10 w-full flex justify-between items-start">
            <span className="text-[8px] font-black uppercase text-stone-500 tracking-tighter line-clamp-1">{item.catalogId}</span>
            {stressLevel > 70 && <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 animate-pulse" />}
            {hydration > 90 && stressLevel < 10 && <ShieldCheck className="w-3 h-3 text-garden-400 mt-0.5" />}
          </div>

          <div className="z-10 group-hover:scale-110 transition-transform duration-500 my-auto">
            <PlantedCardView catalogId={item.catalogId} stage="seedling" />
          </div>

          <div className="z-10 w-full space-y-2">
            {/* Spectral Metric Label */}
            {getOverlayLabel() && (
              <div className="flex justify-center">
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${
                   layer === 'hydration' ? 'bg-blue-900/30 border-blue-500 text-blue-400' :
                   layer === 'health' ? 'bg-red-900/30 border-red-500 text-red-400' :
                   'bg-purple-900/30 border-purple-500 text-purple-400'
                }`}>
                  {getOverlayLabel()}
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
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-60 transition-opacity">
           <Zap className="w-6 h-6 text-stone-700" />
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
}> = ({ items, onSelect, layer, activeSeedCatalogId, catalog }) => {
  const rows = 3;
  const cols = 4;

  const getItemAt = (x: number, y: number) => {
    return items.find(item => item.gridX === x && item.gridY === y);
  };

  const relationships = (catalog || []).flatMap((c: any) => c.relationships || []);

  return (
    <div className="relative group/field">
      {/* Field FX */}
      <div className="absolute -inset-10 bg-garden-500/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover/field:opacity-100 transition-opacity duration-1000" />
      
      <div 
        className="grid gap-8 relative z-10" 
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
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
            />
          );
        })}
      </div>
    </div>
  );
};
