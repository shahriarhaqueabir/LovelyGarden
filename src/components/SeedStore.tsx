import React, { useMemo, useState } from 'react';
import { X, Search, ShoppingBag, Leaf, Droplets, Sun, Wind, MapPin, Calendar, Clock, Info, AlertTriangle, Package, Sprout, Plus, Check } from 'lucide-react';
import { PlantSpecies } from '../schema/knowledge-graph';
import { getDatabase } from '../db';
import { isSowingSeason } from '../logic/reasoning';

interface SeedStoreProps {
  catalog: PlantSpecies[];
  onClose: () => void;
  currentDay?: number;
}

// Detail Modal Component
const DetailModal: React.FC<{
  plant: PlantSpecies;
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
  isRisky: boolean;
}> = ({ plant, isOpen, onClose, onBuy, isRisky }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2"><Leaf className="w-5 h-5 text-garden-500" /> {plant.name}</h2>
            <p className="text-sm text-stone-500 italic">{plant.scientificName}</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Warning */}
          {isRisky && (
            <div className="flex items-center gap-3 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-400">Risky Timing</p>
                <p className="text-xs text-amber-300/70">Current date is outside optimal sowing window for Dresden (Zone 7b)</p>
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-stone-300 leading-relaxed">{plant.description}</p>

          {/* Growth Stages */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
              <Sprout className="w-4 h-4" /> Growth Stages
            </h3>
            <div className="flex flex-wrap gap-2">
              {plant.stages?.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-stone-800/50 rounded-lg">
                  <span className="text-xs font-bold text-garden-400">{stage.id}</span>
                  <span className="text-[10px] text-stone-500">{stage.durationDays}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* Soil & Water Needs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-stone-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-stone-400">Water</span>
              </div>
              <p className="text-sm text-stone-300">
                Every {plant.stages?.[0]?.waterFrequencyDays || 2} days
              </p>
            </div>
            <div className="p-3 bg-stone-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-stone-400">Sowing</span>
              </div>
              <p className="text-sm text-stone-300">
                {plant.sowingMethod} • {plant.sowingSeason?.join(', ')}
              </p>
            </div>
          </div>

          {/* Companion Logic */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4" /> Companion Logic
            </h3>
            <div className="space-y-2">
              {plant.companions && plant.companions.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] px-2 py-1 bg-garden-900/30 text-garden-400 rounded border border-garden-700/30">Companions</span>
                  <span className="text-xs text-stone-400">{plant.companions.length} compatible plants</span>
                </div>
              )}
              {plant.antagonists && plant.antagonists.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] px-2 py-1 bg-red-900/30 text-red-400 rounded border border-red-700/30">Antagonists</span>
                  <span className="text-xs text-stone-400">{plant.antagonists.length} incompatible plants</span>
                </div>
              )}
            </div>
          </div>

          {/* Sowing Window */}
          <div className="p-3 bg-stone-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-bold text-stone-400">Optimal Sowing Window</span>
            </div>
            <p className="text-sm text-stone-300">
              {plant.sowingSeason?.join(', ')} (Dresden Zone 7b)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-stone-800 text-stone-300 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={() => { onBuy(); onClose(); }}
            className="flex-1 py-3 bg-garden-600 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-garden-500 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
};

const WarningBadge: React.FC = () => (
  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-900/40 border border-amber-700/50 rounded text-[9px] font-bold text-amber-400">
    <AlertTriangle className="w-3 h-3" /> Risky
  </span>
);

export const SeedStore: React.FC<SeedStoreProps> = ({ catalog, onClose, currentDay = 1 }) => {
  const [query, setQuery] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantSpecies | null>(null);

  // Calculate current month from day (approximate)
  const currentMonth = Math.floor(((currentDay - 1) % 365) / 30.42);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;

    return catalog.filter(p => {
      const haystack = `${p.name ?? ''} ${p.scientificName ?? ''} ${(p.categories || []).join(' ')} ${p.family ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, query]);

  // Check if current date is outside optimal sowing window for Dresden (Zone 7b)
  const isRiskyTiming = (plant: PlantSpecies): boolean => {
    const result = isSowingSeason(plant, { id: 'user_location', hemisphere: 'North', frost_data: {} }, currentMonth);
    return !result.eligible;
  };

  const addToInventory = async (catalogId: string) => {
    const db = await getDatabase();
    
    // Create deep copy of plant object for Bag
    const plant = catalog.find(p => p.id === catalogId);
    if (!plant) return;

    const bagItem = {
      id: `inv-${catalogId}-${Date.now()}`,
      catalogId,
      acquiredDate: Date.now()
    };

    await db.inventory.insert(bagItem);

    setJustAdded(catalogId);
    window.setTimeout(() => setJustAdded(null), 900);
  };

  return (
    <>
      <div className="fixed inset-y-0 left-0 w-80 bg-stone-900/60 backdrop-blur-3xl border-r border-stone-800 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-stone-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-stone-500" />
              <h2 className="text-xl font-bold text-stone-100">Seed Vault</h2>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-stone-800">
            <div className="flex items-center gap-2 w-full bg-stone-950/50 border border-stone-800 rounded-lg px-3 py-2">
              <Search className="w-3 h-3 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${catalog.length} species...`}
                className="w-full bg-transparent outline-none text-xs text-stone-200 placeholder:text-stone-600"
              />
            </div>
            <div className="mt-2 text-[10px] text-stone-600 font-mono">
              Showing {filtered.length}/{catalog.length}
            </div>
          </div>

          {/* Catalog List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.map((plant) => {
              const risky = isRiskyTiming(plant);
              
              return (
                <div 
                  key={plant.id}
                  className="p-4 bg-stone-800/20 rounded-2xl border border-stone-700/30 hover:border-garden-700/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-stone-200">{plant.name}</h3>
                        {risky && <WarningBadge />}
                      </div>
                      <p className="text-[10px] text-stone-500 italic">{plant.scientificName}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSelectedPlant(plant)}
                        className="p-2 bg-stone-800/50 rounded-lg text-stone-400 hover:bg-stone-700 hover:text-stone-200 transition-all"
                        title="View Details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => addToInventory(plant.id)}
                        className="p-2 bg-garden-900/50 rounded-lg text-garden-400 hover:bg-garden-500 hover:text-white transition-all"
                        title="Add to Bag"
                      >
                        {justAdded === plant.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(plant.categories || []).map(cat => (
                      <span key={cat} className="text-[9px] px-1.5 py-0.5 bg-stone-900 text-stone-500 rounded border border-stone-800">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-6 text-center text-stone-500 text-xs">
                No species match your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPlant && (
        <DetailModal
          plant={selectedPlant}
          isOpen={!!selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onBuy={() => addToInventory(selectedPlant.id)}
          isRisky={isRiskyTiming(selectedPlant)}
        />
      )}
    </>
  );
};
