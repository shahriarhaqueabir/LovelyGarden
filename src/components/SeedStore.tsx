import React, { useMemo, useState } from 'react';
import { X, Plus, Package, Check, Search } from 'lucide-react';
import { PlantSpecies } from '../schema/knowledge-graph';
import { getDatabase } from '../db';

interface SeedStoreProps {
  catalog: PlantSpecies[];
  onClose: () => void;
}

export const SeedStore: React.FC<SeedStoreProps> = ({ catalog, onClose }) => {
  const [query, setQuery] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;

    return catalog.filter(p => {
      const haystack = `${p.name ?? ''} ${p.scientificName ?? ''} ${(p.categories || []).join(' ')} ${p.family ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, query]);

  const addToInventory = async (catalogId: string) => {
    const db = await getDatabase();
    await db.inventory.insert({
      id: `inv-${catalogId}-${Date.now()}`,
      catalogId,
      acquiredDate: Date.now()
    });

    setJustAdded(catalogId);
    window.setTimeout(() => setJustAdded(null), 900);
  };

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-stone-900/60 backdrop-blur-3xl border-r border-stone-800 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-garden-400" />
            <h2 className="text-xl font-bold text-stone-100">Seed Vault</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-800">
          <div className="flex items-center gap-2 w-full bg-stone-950/50 border border-stone-800 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-stone-600" />
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
          {filtered.map((plant) => (
            <div 
              key={plant.id}
              className="p-4 bg-stone-800/20 rounded-2xl border border-stone-700/30 hover:border-garden-700/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-200">{plant.name}</h3>
                  <p className="text-[10px] text-stone-500 italic">{plant.scientificName}</p>
                </div>
                <button 
                  onClick={() => addToInventory(plant.id)}
                  className="p-2 bg-garden-900/50 rounded-lg text-garden-400 hover:bg-garden-500 hover:text-white transition-all"
                  title="Add to Hand"
                >
                  {justAdded === plant.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(plant.categories || []).map(cat => (
                  <span key={cat} className="text-[9px] px-1.5 py-0.5 bg-stone-900 text-stone-500 rounded border border-stone-800">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-stone-500 text-xs">
              No species match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
