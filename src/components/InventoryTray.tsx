import React from 'react';
import { Package, Plus, Sparkles } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useInventory } from '../hooks/useInventory';

export const SeedCard: React.FC<{ id: string; catalogId: string; name: string; type: string; plantNowEligible?: boolean; plantNowMode?: boolean }> = ({ id, catalogId, name, type, plantNowEligible, plantNowMode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `seed-${id}`, // The unique inventory item id
    data: { id: catalogId, name, type } // The catalog data for planting
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
      className={`
        w-28 h-40 rounded-lg shadow-lg border p-2 flex flex-col justify-between cursor-grab active:cursor-grabbing hover:translate-y-[-4px] transition-all
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${plantNowMode ? (plantNowEligible ? 'bg-garden-800 border-garden-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]' : 'bg-stone-900/60 border-stone-800 opacity-40') : 'bg-garden-800 border-garden-600'}
      `}
    >
      <div className="text-[9px] uppercase font-bold text-garden-200 opacity-60">Seed Packet</div>
      <div className="text-white font-semibold text-xs leading-tight">{name}</div>
      <div className="h-14 bg-garden-900/50 rounded-md flex items-center justify-center text-2xl">
        🌱
      </div>
      <div className="text-[8px] italic text-garden-300">{type}</div>
    </div>
  );
};

export const InventoryTray: React.FC<{
  catalog: any[];
  onOpenStore: () => void;
  isVertical?: boolean;
  plantNowMode?: boolean;
  onTogglePlantNow?: () => void;
  plantNowSet?: Set<string>;
}> = ({ catalog, onOpenStore, isVertical, plantNowMode, onTogglePlantNow, plantNowSet }) => {
  const inventory = useInventory();

  const getCatalogItem = (id: string) => catalog.find(c => c.id === id);

  const wrapperClass = isVertical
    ? 'w-full'
    : 'fixed bottom-0 left-0 right-0';

  const containerClass = isVertical
    ? 'p-0 bg-transparent border-0 backdrop-blur-0 flex items-start gap-4 overflow-x-auto'
    : 'p-6 bg-stone-900/80 backdrop-blur-md border-t border-stone-800 flex items-center gap-6 overflow-x-auto';

  return (
    <div className={`${wrapperClass} ${containerClass}`}>
      <div className="flex flex-col items-center gap-1 min-w-[60px] text-stone-500">
        <Package className="w-6 h-6" />
        <span className="text-[10px] uppercase font-bold tracking-widest">Hand</span>
        {onTogglePlantNow && (
          <button
            onClick={onTogglePlantNow}
            className={`mt-2 px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1
              ${plantNowMode ? 'bg-garden-500/10 border-garden-500/30 text-garden-400' : 'bg-stone-900/30 border-stone-800 text-stone-500 hover:text-stone-300'}
            `}
            title="Highlight seeds that are in-season for Dresden"
          >
            <Sparkles className="w-3 h-3" /> Plant Now
          </button>
        )}
      </div>
      
      <div className="flex gap-4">
        {inventory.map((item) => {
          const plant = getCatalogItem(item.catalogId);
          if (!plant) return null;
          return (
            <SeedCard 
              key={item.id} 
              id={item.id} 
              catalogId={item.catalogId}
              name={plant.name} 
              type={plant.categories[0]} 
              plantNowMode={plantNowMode}
              plantNowEligible={plantNowSet ? plantNowSet.has(item.catalogId) : false}
            />
          );
        })}
        
        {/* Store Toggle */}
        <button 
          onClick={onOpenStore}
          className="w-28 h-40 bg-stone-800/20 rounded-lg border-2 border-dashed border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-600 hover:border-garden-600 hover:text-garden-500 transition-all group"
        >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Seeds</span>
        </button>
      </div>
    </div>
  );
};
