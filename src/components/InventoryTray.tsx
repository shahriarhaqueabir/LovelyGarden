import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useInventory } from '../hooks/useInventory';
import { getDatabase } from '../db';

export const SeedCard: React.FC<{ 
  id: string; 
  catalogId: string; 
  name: string; 
  type: string; 
  plantNowEligible?: boolean; 
  plantNowMode?: boolean;
  onDelete?: (id: string) => void;
}> = ({ id, catalogId, name, type, plantNowEligible, plantNowMode, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `seed-${id}`, // The unique inventory item id
    data: { id: catalogId, name, type } // The catalog data for planting
  });

  const [showDelete, setShowDelete] = useState(false);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000
  } : undefined;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Remove ${name} from your Bag?`)) {
      onDelete?.(id);
    }
    setShowDelete(false);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`
        relative w-28 h-40 rounded-lg shadow-lg border p-2 flex flex-col justify-between cursor-grab active:cursor-grabbing hover:translate-y-[-4px] transition-all
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${plantNowMode ? (plantNowEligible ? 'bg-garden-800 border-garden-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]' : 'bg-stone-900/60 border-stone-800 opacity-40') : 'bg-garden-800 border-garden-600'}
      `}
    >
      {/* Delete Button */}
      {showDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg z-20 transition-all"
          title="Remove from Bag"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      
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
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const getCatalogItem = (id: string) => catalog.find(c => c.id === id);

  // Delete item from Bag (Inventory)
  const handleDeleteItem = async (inventoryId: string) => {
    try {
      const db = await getDatabase();
      const item = await db.inventory.findOne(inventoryId).exec();
      if (item) {
        await item.remove();
        setToast({ message: 'Item removed from Bag', type: 'success' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      setToast({ message: 'Failed to remove item', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };


  const wrapperClass = isVertical
    ? 'w-full'
    : 'fixed bottom-0 left-0 right-0';

  const containerClass = isVertical
    ? 'p-0 bg-transparent border-0 backdrop-blur-0 flex items-start gap-4 overflow-x-auto'
    : 'p-6 bg-stone-900/80 backdrop-blur-md border-t border-stone-800 flex items-center gap-6 overflow-x-auto';

  return (
    <div className={`${wrapperClass} ${containerClass}`}>
      <div className="flex flex-col items-center gap-1 min-w-[60px] text-stone-500">
        <span className="text-xl">🖐️</span>
        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Hand</span>
        {onTogglePlantNow && (
          <button
            onClick={onTogglePlantNow}
            className={`mt-2 px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1
              ${plantNowMode ? 'bg-garden-500/10 border-garden-500/30 text-garden-400 shadow-inner' : 'bg-stone-900/30 border-stone-800 text-stone-500 hover:text-stone-300'}
            `}
            title="Highlight seeds that are in-season"
          >
            ✨ Plant Now
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`
          fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2
          ${toast.type === 'error' ? 'bg-red-900/80 border border-red-700 text-red-200' : 
            toast.type === 'success' ? 'bg-garden-900/80 border border-garden-700 text-garden-200' : 
            'bg-stone-900/80 border border-stone-700 text-stone-200'}
        `}>
          <span className="text-xs">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

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
              onDelete={handleDeleteItem}
            />
          );
        })}

        {/* Store Toggle */}
        <button
          onClick={onOpenStore}
          className="w-28 h-40 bg-stone-800/20 rounded-lg border-2 border-dashed border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-600 hover:border-garden-600 hover:text-garden-500 transition-all group shadow-inner"
        >
          <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🏺</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Seeds</span>
        </button>
      </div>
    </div>
  );
};
