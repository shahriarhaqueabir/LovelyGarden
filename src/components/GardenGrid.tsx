import React, { useMemo, useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { 
  Droplets, 
  AlertTriangle, 
  Zap, 
  Plus, 
  Activity, 
  Bug, 
  Trash2, 
  Skull, 
  Sparkles, 
  FlaskConical,
  Heart
} from 'lucide-react';
import { PlantedCardView } from './PlantedCard';
import { calculateCompanionScore } from '../logic/reasoning';
import { calculateCurrentStage, getCompletedStages } from '../logic/lifecycle';
import type { PlantedDocument, CatalogDocument, GridLayer } from '../db/types';

interface GridSlotProps {
  x: number;
  y: number;
  item?: PlantedDocument;
  onSelect?: (item: PlantedDocument) => void;
  layer: GridLayer;
  activeSeedCatalogId?: string | null;
  getItemAt?: (x: number, y: number) => PlantedDocument | undefined;
  relationships?: any[];
  onDelete?: (item: PlantedDocument) => void;
  onOpenObservation?: (item: PlantedDocument) => void;
  catalog?: CatalogDocument[];
  currentDay: number;
}


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

export const GridSlot: React.FC<GridSlotProps> = (props) => {
  const { x, y, item, onSelect, layer, activeSeedCatalogId, getItemAt, relationships, onDelete, onOpenObservation, catalog, currentDay } = props;

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${x}-${y}`,
    data: { x, y }
  });

  const [showActions, setShowActions] = useState(false);

  const catalogItem = useMemo(() => catalog?.find(c => c.id === item?.catalogId), [catalog, item]);
  
  const nutrientRequirements = useMemo(() => {
    if (!catalogItem?.nutrient_preferences) return { n: 2, p: 2, k: 2 };
    const result = { n: 2, p: 2, k: 2 };
    const map: Record<string, number> = { low: 1, moderate: 2, high: 3, very_high: 4 };
    
    catalogItem.nutrient_preferences.forEach(pref => {
      const parts = pref.split('_');
      if (parts.length < 2) return;
      const level = parts.slice(1).join('_');
      const val = map[level] || 2;
      
      if (pref.startsWith('nitrogen')) result.n = val;
      else if (pref.startsWith('phosphorus')) result.p = val;
      else if (pref.startsWith('potassium')) result.k = val;
    });
    return result;
  }, [catalogItem]);

  const stressLevel = item?.stressLevel || 0;
  const hydration = item?.hydration || 100;
  const n = item?.nutrients?.n || 50;
  const p = item?.nutrients?.p || 50;
  const k = item?.nutrients?.k || 50;
  const healthStatus = item?.healthStatus || 'Healthy';
  const isDead = healthStatus === 'Dead';
  const isPestInfested = healthStatus === 'Pest Infestation';

  const growthData = useMemo(() => {
    if (!item || !catalogItem?.stages) {
      return { completedStages: [] as string[], daysElapsed: 0, stage: 'seedling' };
    }
    
    const planted = item?.plantedDate || 0;
    const daysElapsed = currentDay; 
    const nowTimestamp = planted + (daysElapsed * 86400000);

    const completed = getCompletedStages(planted, catalogItem.stages, nowTimestamp);
    const stage = calculateCurrentStage(planted, catalogItem.stages, nowTimestamp);
    
    return { completedStages: completed, daysElapsed: daysElapsed, stage };
  }, [item, catalogItem, currentDay]);

  // Derived synergy for placed items
  const synergyScore = useMemo(() => {
    if (!item || !relationships || !getItemAt) return 0;
    const neighbors = [
      getItemAt(x - 1, y), getItemAt(x + 1, y),
      getItemAt(x, y - 1), getItemAt(x, y + 1)
    ].filter(Boolean) as PlantedDocument[];
    const neighborIds = neighbors.map(nx => nx.catalogId);
    return calculateCompanionScore(item.catalogId, neighborIds, relationships as any);
  }, [item, relationships, x, y, getItemAt]);


  // Holding seed synergy logic
  const seedSynergy = useMemo(() => {
    if (!activeSeedCatalogId || !getItemAt || !relationships) return 0;
    const neighborIds: string[] = [];
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    for (const d of dirs) {
      const nItem = getItemAt(x + d.dx, y + d.dy);
      if (nItem?.catalogId) neighborIds.push(nItem.catalogId);
    }
    if (neighborIds.length === 0) return 0;
    return calculateCompanionScore(activeSeedCatalogId, neighborIds, relationships as any);
  }, [activeSeedCatalogId, getItemAt, relationships, x, y]);

  // Border and FX logic
  const getBorderColor = () => {
    if (isOver) return 'border-garden-400 border-2 shadow-[0_0_30px_rgba(34,197,94,0.4)] z-10';
    
    if (activeSeedCatalogId) {
      if (seedSynergy > 10) return 'border-garden-400/60 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
      if (seedSynergy < -10) return 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
      return 'border-stone-700/50';
    }

    if (layer === 'companions') {
      if (!item) return 'border-stone-800/30';
      if (synergyScore > 10) return 'border-garden-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]';
      if (synergyScore < -10) return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
      return 'border-stone-700/60';
    }

    if (layer === 'hydration') {
      if (hydration < 25) return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse';
      if (hydration < 50) return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      if (hydration < 75) return 'border-blue-400/60 shadow-[0_0_15px_rgba(96,165,250,0.2)]';
      return 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
    }

    if (layer === 'health') {
      if (isDead) return 'border-stone-800 opacity-60';
      if (isPestInfested) return 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.4)] animate-pulse';
      if (stressLevel > 70) return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
      if (stressLevel > 30) return 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      return 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    }

    if (layer === 'nutrients') {
      const avg = (n + p + k) / 3;
      if (avg < 30) return 'border-purple-900 shadow-[0_0_15px_rgba(88,28,135,0.3)]';
      if (avg < 60) return 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]';
      return 'border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.5)]';
    }

    if (stressLevel > 80) return 'border-red-500/50';
    if (stressLevel > 40) return 'border-amber-500/40';
    return 'border-garden-900/40 shadow-xl';
  };

  const getOverlayLabel = () => {
    if (isDead) return <span className="flex items-center gap-1"><Skull className="w-3 h-3" /> COMPOST</span>;
    if (isPestInfested) return <span className="flex items-center gap-1"><Bug className="w-3 h-3" /> PEST ALERT</span>;
    
    if (layer === 'hydration') return <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {Math.round(hydration)}% H2O</span>;
    
    if (layer === 'health') {
      const isCritical = stressLevel > 70;
      return (
        <span className="flex items-center gap-1">
          {isCritical ? <AlertTriangle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
          {isCritical ? 'CRITICAL BLIGHT' : `${Math.round(stressLevel)}% STRESS`}
        </span>
      );
    }
    
    if (layer === 'nutrients') {
      return (
        <span className="flex items-center gap-1">
          <FlaskConical className="w-3 h-3" />
          N-P-K: {nutrientRequirements.n}-{nutrientRequirements.p}-{nutrientRequirements.k}
        </span>
      );
    }

    if (layer === 'companions') {
      if (!item) return null;
      return (
        <span className="flex items-center gap-1">
          <Heart className={`w-3 h-3 ${synergyScore > 0 ? 'text-garden-400' : synergyScore < 0 ? 'text-red-400' : 'text-stone-500'}`} />
          {synergyScore > 0 ? 'SYNERGY' : synergyScore < 0 ? 'ANTAGONISM' : 'NEUTRAL'}
        </span>
      );
    }
    
    return null;
  };

  // Contagion Logic
  const contagionRisk = useMemo(() => {
    if (!getItemAt) return false;
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    for (const d of dirs) {
      const nItem = getItemAt(x + d.dx, y + d.dy);
      if (nItem?.healthStatus === 'Pest Infestation') return true;
    }
    return false;
  }, [getItemAt, x, y]);

  return (
    <div
      ref={setNodeRef}
      onClick={() => item && onSelect?.(item)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative w-full aspect-square max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[140px] xl:max-w-[160px] border-2 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer depth-3d
        ${getBorderColor()}
        ${item ? 'glass-panel' : 'bg-app-background/40'}
        ${activeSeedCatalogId ? (seedSynergy > 0 ? 'ring-2 ring-garden-400/80' : seedSynergy < 0 ? 'ring-2 ring-red-500/70' : 'ring-1 ring-stone-700/60') : ''}
        ${contagionRisk && !isPestInfested ? 'pulse-red border-amber-500/30' : ''}
        group
      `}
    >
      {item ? (
        <DraggablePlant item={item}>
        <div className="w-full h-full p-3 flex flex-col items-center justify-between relative overflow-hidden shimmer-bg rounded-3xl">
          {layer !== 'normal' && !isDead && (
            <div className={`
              absolute inset-0 z-0 opacity-10 pointer-events-none transition-all
              ${layer === 'hydration' ? 'bg-blue-500' : layer === 'health' ? 'bg-red-500' : layer === 'companions' ? (synergyScore > 0 ? 'bg-garden-500' : synergyScore < 0 ? 'bg-red-500' : 'bg-stone-500') : 'bg-purple-500'}
            `} />
          )}

          <div className="z-10 w-full flex justify-between items-start">
            <span className="text-[11px] font-black uppercase text-stone-500">{item.catalogId}</span>
            <div className="flex gap-1">
              {stressLevel > 70 && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {hydration > 90 && stressLevel < 10 && <Sparkles className="w-4 h-4 text-garden-400" />}
              {isPestInfested && <Bug className="w-4 h-4 text-amber-500 animate-bounce" />}
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
            {getOverlayLabel() && (
              <div className="flex justify-center">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                    isDead ? 'bg-stone-800 border-stone-600 text-stone-400' :
                    isPestInfested ? 'bg-amber-900/30 border-amber-500 text-amber-400' :
                    layer === 'hydration' ? 'bg-blue-900/30 border-blue-500 text-blue-400' :
                    layer === 'health' ? 'bg-red-900/30 border-red-500 text-red-400' :
                    layer === 'nutrients' ? 'bg-purple-900/30 border-purple-500 text-purple-400' :
                    (synergyScore > 0 ? 'bg-garden-900/30 border-garden-500 text-garden-400' : synergyScore < 0 ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-stone-900/30 border-stone-500 text-stone-400')
                }`}>
                  {getOverlayLabel()}
                </span>
              </div>
            )}
            <div className="h-2 w-full bg-stone-800/50 rounded-full overflow-hidden">
                 <div
                   className={`h-full opacity-60 ${hydration < 30 ? 'bg-amber-500' : 'bg-blue-500'}`}
                   style={{ width: `${hydration}%` }}
                 />
            </div>
          </div>
        </div>
        </DraggablePlant>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-60 transition-opacity">
           <Zap className="w-8 h-8 text-stone-700" />
           <Plus className="w-10 h-10 text-stone-500" />
           <span className="text-[11px] font-black tracking-widest uppercase">{x},{y}</span>
        </div>
      )}
      
      {showActions && item && !isDead && (
        <div className="absolute top-2 right-2 flex gap-1 z-30">
          <button onClick={(e) => { e.stopPropagation(); onOpenObservation?.(item); }} className="p-1.5 bg-stone-900/90 border border-stone-700/50 rounded-lg text-stone-400 hover:text-amber-400 transition-all"><Activity className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(item); }} className="p-1.5 bg-stone-900/90 border border-stone-700/50 rounded-lg text-stone-400 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
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
  onDelete?: (item: PlantedDocument) => void;
  onOpenObservation?: (item: PlantedDocument) => void;
  currentDay: number;
}> = ({ items, onSelect, layer, activeSeedCatalogId, catalog, rows = 3, cols = 4, onDelete, onOpenObservation, currentDay }) => {
  const getItemAt = (x: number, y: number) => items.find(item => item.gridX === x && item.gridY === y);

  const relationships = useMemo(() => {
    const rels: any[] = [];
    (catalog || []).forEach((c: CatalogDocument) => {
      (c.companions || []).forEach((targetId: string) => {
        rels.push({ source_plant_id: c.id, target_plant_id: targetId, relationship: 'beneficial' });
      });
      (c.antagonists || []).forEach((targetId: string) => {
        rels.push({ source_plant_id: c.id, target_plant_id: targetId, relationship: 'antagonistic' });
      });
    });
    return rels;
  }, [catalog]);

  return (
    <div className="relative group/field">
      <div className="absolute -inset-10 bg-garden-500/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover/field:opacity-100 transition-opacity duration-1000" />
      <div
        className="grid gap-2 sm:gap-4 lg:gap-8 relative z-10 w-full max-w-5xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          const item = items.find(p => p.gridX === x && p.gridY === y);
          return (
            <GridSlot
              key={`${x}-${y}`}
              x={x} y={y} item={item}
              onSelect={onSelect} layer={layer}
              activeSeedCatalogId={activeSeedCatalogId}
              getItemAt={getItemAt} relationships={relationships}
              onDelete={onDelete}
              onOpenObservation={onOpenObservation}
              currentDay={currentDay} catalog={catalog}
            />
          );
        })}
      </div>
    </div>
  );
};
