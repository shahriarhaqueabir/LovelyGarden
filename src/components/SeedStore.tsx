import React, { useMemo, useState } from 'react';
import { X, Search, ShoppingBag, Info, AlertTriangle, Plus, Check, BookOpen, Package } from 'lucide-react';
import { PlantSpecies } from '../schema/knowledge-graph';
import { getDatabase } from '../db';
import { isSowingSeason } from '../logic/reasoning';

interface SeedStoreProps {
  catalog: PlantSpecies[];
  onClose: () => void;
  currentDay?: number;
}

// Detail Modal Component
export const DetailModal: React.FC<{
  plant: PlantSpecies;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: () => void;
  isRisky?: boolean;
}> = ({ plant, isOpen, onClose, onBuy, isRisky }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden my-8">
        {/* Header Section */}
        <div className="relative p-8 border-b border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-stone-100 uppercase tracking-tighter">{plant.name}</h2>
                <span className="px-2 py-0.5 bg-garden-500/10 text-garden-400 border border-garden-500/20 rounded text-[10px] font-bold uppercase tracking-widest leading-none">
                  {plant.categories?.[0] || 'Species'}
                </span>
                {isRisky && <WarningBadge />}
              </div>
              <p className="text-sm text-stone-500 italic font-medium tracking-tight mb-4">{plant.scientificName}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-xl">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600 mb-2 flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-garden-500" /> Knowledge Base
             </h3>
             <p className="text-sm text-stone-300 leading-relaxed italic">"{plant.description}"</p>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Left Column: Core Identity */}
          <div className="space-y-8">
            {/* Taxonomy */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                🧬 Taxonomy
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Family</span>
                  <span className="text-stone-300">{plant.family || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Genus</span>
                  <span className="text-stone-300">{plant.genus || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Species</span>
                  <span className="text-stone-300">{plant.species || "—"}</span>
                </div>
              </div>
            </section>

            {/* Biology */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                🌿 Biology
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Life Cycle</span>
                  <span className="text-stone-300 capitalize">{plant.life_cycle || "Annual"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Habit</span>
                  <span className="text-stone-300 capitalize">{plant.growth_habit?.join(', ') || "Bushy"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Photo</span>
                  <span className="text-stone-300">{plant.photosynthesis_type || "C3"}</span>
                </div>
              </div>
            </section>

            {/* Edibility */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                🍴 Edibility
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Edible</span>
                  <span className="text-garden-400 font-bold">{plant.edible_parts?.join(', ') || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Toxic</span>
                  <span className="text-red-400 font-bold font-mono text-[10px]">{plant.toxic_parts?.join(', ') || "—"}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Middle Column: Operational Parameters */}
          <div className="space-y-8">
            {/* SOWING */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                🧪 Sowing
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Method</span>
                  <span className="text-amber-500 font-bold">{plant.sowingMethod || "Direct"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Seasons</span>
                  <span className="text-stone-300">{plant.sowingSeason?.join(', ') || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-bold uppercase tracking-tighter">Pollination</span>
                  <span className="text-stone-300 capitalize">{plant.pollination_type || "Insect"}</span>
                </div>
              </div>
            </section>

            {/* RELATIONSHIPS */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                👯 Relationships
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Companions</span>
                  <div className="flex flex-wrap gap-1">
                    {plant.companions?.length ? plant.companions.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-garden-900/30 text-garden-400 border border-garden-800 rounded text-[10px]">{c.replace('plant_', '')}</span>
                    )) : <span className="text-[10px] text-stone-700 italic">None logged</span>}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Antagonists</span>
                  <div className="flex flex-wrap gap-1">
                    {plant.antagonists?.length ? plant.antagonists.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-red-900/30 text-red-400 border border-red-800 rounded text-[10px]">{c.replace('plant_', '')}</span>
                    )) : <span className="text-[10px] text-stone-700 italic">None logged</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* STAGES */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                📊 Growth Graph
              </h4>
              <div className="space-y-2">
                {plant.stages?.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-stone-950 border border-stone-800 rounded-lg group hover:border-stone-700 transition-colors">
                    <div className="w-8 h-8 rounded bg-stone-900 border border-stone-800 flex items-center justify-center text-xs group-hover:text-garden-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold uppercase text-stone-400">{stage.id}</span>
                        <span className="text-[10px] font-mono text-stone-600">{stage.durationDays}d</span>
                      </div>
                      <div className="h-1 w-full bg-stone-900 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-stone-700 rounded-full" style={{ width: `${(stage.durationDays / 60) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Environmental Intelligence */}
          <div className="space-y-8">
            {/* SEASONALITY */}
            <section className="bg-stone-950/50 p-4 rounded-xl border border-stone-800/50 shadow-inner">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                📅 Diagnostics Intel
              </h4>
              {plant.seasonality && (
                <div className="space-y-6">
                  <div className="relative pl-6 border-l-2 border-amber-600/30">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 bg-amber-600 rounded-full ring-4 ring-stone-900" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Sowing Window</span>
                    <p className="text-xs text-stone-300 font-bold mt-1">
                      {plant.seasonality.sowing.start_month} — {plant.seasonality.sowing.end_month}
                    </p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-garden-600/30">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 bg-garden-600 rounded-full ring-4 ring-stone-900" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-garden-500">Optimal Harvest</span>
                    <p className="text-xs text-stone-300 font-bold mt-1">
                      {plant.seasonality.harvest.start_month} — {plant.seasonality.harvest.end_month}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* PESTS & DISEASES */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                🛑 Threat Assessment
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Common Pests</span>
                  <div className="flex flex-wrap gap-1">
                    {plant.common_pests?.length ? plant.common_pests.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-stone-900 text-stone-500 rounded text-[9px] border border-stone-800 hover:text-red-400 transition-colors">{p.replace('pest_', '').replace('_', ' ')}</span>
                    )) : <span className="text-[10px] text-stone-700 italic">No threats logged</span>}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Known Diseases</span>
                  <div className="flex flex-wrap gap-1">
                    {plant.common_diseases?.length ? plant.common_diseases.map(d => (
                      <span key={d} className="px-2 py-0.5 bg-stone-900 text-stone-500 rounded text-[9px] border border-stone-800 hover:text-red-400 transition-colors">{d.replace('disease_', '').replace('_', ' ')}</span>
                    )) : <span className="text-[10px] text-stone-700 italic">No threats logged</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* ENVIRONMENT */}
            <section className="bg-stone-800/10 p-4 rounded-xl border border-stone-800">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 mb-4 border-b border-stone-800 pb-2">
                🌍 Environment
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-stone-600 uppercase">Sunlight</span>
                  <p className="text-xs text-stone-300 capitalize">{plant.sunlight?.replace('_', ' ') || "—"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-stone-600 uppercase">Water</span>
                  <p className="text-xs text-stone-300 capitalize">{plant.water_requirements || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-stone-600 uppercase">Soil Preferences</span>
                  <p className="text-xs text-stone-300 capitalize">{plant.soil_type?.join(', ') || "—"}</p>
                </div>
              </div>

               <div className="mt-4 pt-4 border-t border-stone-800">
                  <span className="text-[9px] font-bold text-stone-600 uppercase">Nutrient Needs</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plant.nutrient_preferences?.map(n => (
                      <span key={n} className="px-1.5 py-0.5 bg-stone-950 text-[10px] text-blue-400 border border-stone-800 rounded">{n.replace('_', ' ')}</span>
                    ))}
                  </div>
               </div>
            </section>
          </div>
        </div>

        {/* Footer: Sources & Action */}
        <div className="p-8 border-t border-stone-800 bg-stone-900/50 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col gap-2">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">KB Intelligence Sources</h5>
            <div className="flex gap-4">
              {plant.source_metadata?.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="text-[11px] font-bold text-stone-300">{s.source_name}</div>
                  <div className="px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded text-[9px] font-mono border border-green-800/50">
                    {Math.round(s.confidence_score * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3 bg-stone-800 text-stone-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-stone-700 hover:text-stone-100 transition-all border border-stone-700"
            >
              Close
            </button>
            {onBuy && (
              <button
                onClick={() => { onBuy(); onClose(); }}
                className="flex-1 sm:flex-none px-8 py-3 bg-garden-600 text-stone-950 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-garden-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Bag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WarningBadge: React.FC = () => (
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
              <h2 className="text-xl font-bold text-stone-100">Seed Store</h2>
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
