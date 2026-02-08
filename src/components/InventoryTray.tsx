import React, { useState, useRef, useEffect } from 'react';
import { Trash2, CheckCircle, XCircle, Info, Sprout, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useInventory } from '../hooks/useInventory';
import { getDatabase } from '../db';

// ... (SeedCard component remains same) -> Restored below
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
        relative w-[80px] h-[100px] rounded-3xl border p-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing depth-3d transition-all
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${plantNowMode ? (plantNowEligible ? 'bg-garden-800 border-garden-400 animate-healthy shadow-[0_0_20px_rgba(34,197,94,0.25)]' : 'bg-stone-900/60 border-stone-800 opacity-40 glass-panel') : 'bg-stone-900/40 glass-panel border-stone-800'}
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
      

      <div className="text-white font-semibold text-[13px] mb-1 break-words text-center w-full">{name}</div>
      <div className="h-10 w-full bg-garden-900/50 rounded-md flex items-center justify-center text-xl">
        <Sprout className="w-4 h-4 text-garden-200/50" />
      </div>
      <div className="text-[11px] italic text-garden-300 mt-1 break-words leading-tight text-center w-full">{type.replace('_', ' ')}</div>
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
  const [collapsed, setCollapsed] = useState(false);
  
  // Scroll indicators state for horizontal layout
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const getCatalogItem = (id: string) => catalog.find(c => c.id === id);

  // Scroll handler for horizontal layout
  const handleScroll = () => {
    if (!scrollRef.current || isVertical) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftIndicator(scrollLeft > 10);
    setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Effect to update scroll indicators when inventory changes or component mounts
  useEffect(() => {
    if (!isVertical && scrollRef.current) {
      // Wait for DOM to update before calculating scroll position
      const timer = setTimeout(() => {
        handleScroll();
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [inventory, isVertical]);

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
    ? `h-full transition-all duration-300 ${collapsed ? 'w-20' : 'w-80'} border-r border-stone-800 glass-panel flex flex-col relative z-40`
    : 'fixed bottom-0 left-0 right-0';

  const containerClass = isVertical
    ? 'flex-1 overflow-y-auto overflow-x-hidden p-4 grid grid-cols-3 gap-3 auto-rows-max scrollbar-hide'
    : 'p-6 glass-panel border-t border-stone-800 flex items-center gap-6 overflow-x-auto';

  return (
    <div className={`${wrapperClass} ${isVertical ? '' : containerClass}`}>
      {/* Sidebar Toggle Handle */}
      {isVertical && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            absolute -right-4 top-1/2 -translate-y-1/2 
            w-8 h-16 bg-stone-800 border-2 border-stone-700 
            flex items-center justify-center rounded-xl
            text-stone-400 hover:text-white hover:bg-stone-700/50 
            hover:border-garden-500/50 transition-all z-40 shadow-2xl
            group cursor-pointer
          `}
          title={collapsed ? "Expand Intelligence Node" : "Collapse Intelligence Node"}
        >
          <div className="flex flex-col items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-4 bg-stone-500 rounded-full" />
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            <div className="w-0.5 h-4 bg-stone-500 rounded-full" />
          </div>
        </button>
      )}

      {/* Header / Hand / Tools */}
      <div className={`${isVertical ? 'p-4 border-b border-stone-800 flex flex-col items-center gap-4' : 'flex flex-col items-center gap-1 min-w-[60px]'}`}>
        <div className={`flex flex-col items-center gap-1 text-stone-500 ${collapsed ? 'scale-75' : ''} transition-transform`}>
          <div className="text-2xl">🧺</div>
          {!collapsed && <span className="text-[13px] uppercase font-bold tracking-widest text-stone-400">Bag</span>}
        </div>
        
        {onTogglePlantNow && !collapsed && (
          <button
            onClick={onTogglePlantNow}
            className={`px-3 py-2 rounded-lg border text-[12px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 w-full justify-center
              ${plantNowMode ? 'bg-garden-500/10 border-garden-500/30 text-garden-400 shadow-inner' : 'bg-stone-900/30 border-stone-800 text-stone-500 hover:text-stone-300'}
            `}
            title="Highlight seeds that are in-season"
          >
           ✨ In Season
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
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Container for scroll indicators - only for horizontal layout */}
      <div className={`${isVertical ? containerClass : 'relative flex gap-4'}`}>
        {/* Left scroll indicator for horizontal layout */}
        {!isVertical && showLeftIndicator && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-900 to-transparent pointer-events-none z-10" />
        )}
        
        {/* Scrollable content - only wrap in scroll container for horizontal layout */}
        {isVertical ? (
          <>
            {!collapsed && inventory.length === 0 && (
              <div className="text-center py-8 opacity-30 text-[13px] uppercase tracking-widest font-bold col-span-3">
                Bag Empty
              </div>
            )}

            {inventory.map((item) => {
              const plant = getCatalogItem(item.catalogId);
              if (!plant) return null;

              if (collapsed && isVertical) {
                 // Mini view for collapsed sidebar
                 return (
                   <div key={item.id} className="w-10 h-10 bg-garden-900/30 rounded-full flex items-center justify-center border border-garden-500/30 mx-auto" title={plant.name}>
                     <Sprout className="w-5 h-5 text-garden-400" />
                   </div>
                 );
              }

              return (
                <SeedCard
                  key={item.id}
                  id={item.id}
                  catalogId={item.catalogId}
                  name={plant.name}
                  type={plant.categories?.[0] || 'Unknown'}
                  plantNowMode={plantNowMode}
                  plantNowEligible={plantNowSet ? plantNowSet.has(item.catalogId) : false}
                  onDelete={handleDeleteItem}
                />
              );
            })}

            {/* Store Toggle */}
            <button
              onClick={onOpenStore}
              className={`
                ${isVertical
                  ? `w-full ${collapsed ? 'h-12 w-12 rounded-full mx-auto p-0 flex items-center justify-center' : 'h-24 col-span-3'} bg-stone-800/20 border-2 border-dashed border-stone-700 hover:border-garden-600 hover:text-garden-500 transition-all group flex flex-col items-center justify-center gap-2 text-stone-600`
                  : 'w-[80px] h-[100px] bg-stone-800/20 rounded-3xl border-2 border-dashed border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-600 hover:border-garden-600 hover:text-garden-500 transition-all group shadow-inner'}
              `}
              title="Open Seed Store"
            >
              <div className="text-2xl group-hover:scale-125 transition-transform duration-300">📦</div>
              {!collapsed && <span className="text-[13px] font-bold uppercase tracking-widest">Add Seeds</span>}
            </button>
          </>
        ) : (
          // Horizontal layout with scroll container
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-x-auto flex gap-4 pb-2"
          >
            {!collapsed && inventory.length === 0 && (
              <div className="text-center py-8 opacity-30 text-[13px] uppercase tracking-widest font-bold col-span-3">
                Bag Empty
              </div>
            )}

            {inventory.map((item) => {
              const plant = getCatalogItem(item.catalogId);
              if (!plant) return null;

              return (
                <SeedCard
                  key={item.id}
                  id={item.id}
                  catalogId={item.catalogId}
                  name={plant.name}
                  type={plant.categories?.[0] || 'Unknown'}
                  plantNowMode={plantNowMode}
                  plantNowEligible={plantNowSet ? plantNowSet.has(item.catalogId) : false}
                  onDelete={handleDeleteItem}
                />
              );
            })}

            {/* Store Toggle */}
            <button
              onClick={onOpenStore}
              className='w-[80px] h-[100px] bg-stone-800/20 rounded-3xl border-2 border-dashed border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-600 hover:border-garden-600 hover:text-garden-500 transition-all group shadow-inner'
              title="Open Seed Store"
            >
              <div className="text-2xl group-hover:scale-125 transition-transform duration-300">📦</div>
              {!collapsed && <span className="text-[13px] font-bold uppercase tracking-widest">Add Seeds</span>}
            </button>
          </div>
        )}
        
        {/* Right scroll indicator for horizontal layout */}
        {!isVertical && showRightIndicator && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-900 to-transparent pointer-events-none z-10" />
        )}
      </div>
    </div>
  );
};
