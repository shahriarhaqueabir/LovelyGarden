import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BookOpen, Search, Sun, Droplets } from 'lucide-react';
import { getDatabase } from '../db';
import { PlantKbDocument } from '../db/types';
import { GrowthGraph } from './GrowthGraph';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PlantKnowledgebaseTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [plants, setPlants] = useState<PlantKbDocument[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<PlantKbDocument | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Responsive column count logic
  const [columns, setColumns] = useState(4);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!parentRef.current) return;
      const width = parentRef.current.offsetWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1280) setColumns(3);
      else setColumns(4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const db = await getDatabase();
        // Subscribe to real-time updates from RxDB
        const sub = db.plant_kb.find().$.subscribe(docs => {
          if (docs) {
            setPlants(docs.map(doc => doc.toJSON()));
          }
          setLoading(false);
        });
        return () => sub.unsubscribe();
      } catch (error) {
        console.error('Failed to load plant knowledge base from DB:', error);
        setLoading(false);
      }
    };
    loadPlants();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plants;

    return plants.filter(p => {
      const haystack = `${p.common_name ?? ''} ${p.scientific_name ?? ''} ${p.type ?? ''} ${p.family ?? ''} ${p.notes ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [plants, query]);

  // Virtualize ROWS instead of individual items for grid stability
  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < filtered.length; i += columns) {
      r.push(filtered.slice(i, i + columns));
    }
    return r;
  }, [filtered, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160,
    overscan: 5,
  });

  const getSunlightIcon = (sunlight: string) => {
    switch (sunlight) {
      case 'full_sun': return <Sun className="w-4 h-4 text-amber-400" />;
      case 'partial_sun': 
      case 'partial_shade': 
        return <Sun className="w-4 h-4 text-yellow-300 opacity-70" />;
      default: return <Sun className="w-4 h-4 text-stone-500" />;
    }
  };

  const getWaterIcon = (water: string) => {
    switch (water) {
      case 'high': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'moderate': return <Droplets className="w-4 h-4 text-blue-300" />;
      case 'low': return <Droplets className="w-4 h-4 text-blue-200" />;
      default: return <Droplets className="w-4 h-4 text-stone-500" />;
    }
  };

  if (selectedPlant) {
    return (
      <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-garden-400" />
            <h1 className="text-xl font-bold text-stone-100">Plant Knowledgebase</h1>
          </div>
          <button
            onClick={() => setSelectedPlant(null)}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm transition-colors"
          >
            Back to List
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-stone-100">{selectedPlant.common_name}</h2>
                <span className="text-xs px-2 py-1 bg-garden-900/30 text-garden-400 rounded border border-garden-700/30 uppercase tracking-widest">
                  {selectedPlant.type}
                </span>
              </div>
              <p className="text-sm text-stone-500 italic">{selectedPlant.scientific_name}</p>
              <div className="mt-2">
                <span className="text-xs px-2 py-1 bg-stone-800 text-stone-400 rounded border border-stone-800">
                  {selectedPlant.family}
                </span>
              </div>
            </div>

            {/* Expanded Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Left Column: Core Identity */}
              <div className="space-y-6">
                {/* Taxonomy */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    🧬 Taxonomy
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Family</span>
                      <span className="text-stone-300">{selectedPlant.family || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Genus</span>
                      <span className="text-stone-300">—</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Species</span>
                      <span className="text-stone-300">—</span>
                    </div>
                  </div>
                </section>

                {/* Biology */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    🌿 Biology
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Life Cycle</span>
                      <span className="text-stone-300 capitalize">{selectedPlant.life_cycle || "annual"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Habit</span>
                      <span className="text-stone-300 capitalize">{selectedPlant.growth_habit?.join(', ') || "bushy"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Photo</span>
                      <span className="text-stone-300">{selectedPlant.photosynthesis_type || "C3"}</span>
                    </div>
                  </div>
                </section>

                {/* Edibility */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    🍴 Edibility
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Edible</span>
                      <span className="text-garden-400 font-bold">{selectedPlant.edible_parts?.join(', ') || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Toxic</span>
                      <span className="text-red-400 font-bold font-mono text-[10px]">{selectedPlant.toxic_parts?.join(', ') || "—"}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Middle Column: Operational Parameters */}
              <div className="space-y-6">
                {/* SOWING */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    🧪 Sowing
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Method</span>
                      <span className="text-amber-500 font-bold">{selectedPlant.sowingMethod || "Direct"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Seasons</span>
                      <span className="text-stone-300">{selectedPlant.sowingSeason?.join(', ') || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-bold uppercase tracking-tighter">Pollination</span>
                      <span className="text-stone-300 capitalize">{selectedPlant.pollination_type || "insect"}</span>
                    </div>
                  </div>
                </section>

                {/* RELATIONSHIPS */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    👯 Relationships
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Companions</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlant.companion_plants?.length ? selectedPlant.companion_plants.map(c => (
                          <span key={c} className="px-2 py-0.5 bg-garden-900/30 text-garden-400 border border-garden-800 rounded text-[10px]">{c.replace('plant_', '').replace('_', ' ')}</span>
                        )) : <span className="text-[10px] text-stone-700 italic">None logged</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Antagonists</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlant.incompatible_plants?.length ? selectedPlant.incompatible_plants.map(c => (
                          <span key={c} className="px-2 py-0.5 bg-red-900/30 text-red-400 border border-red-800 rounded text-[10px]">{c.replace('plant_', '').replace('_', ' ')}</span>
                        )) : <span className="text-[10px] text-stone-700 italic">None logged</span>}
                      </div>
                    </div>
                  </div>
                </section>

                {/* STAGES */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    📊 Growth Graph
                  </h4>
                  <div className="space-y-2">
                  <GrowthGraph stages={selectedPlant.stages} />
                  </div>
                </section>
              </div>

              {/* Right Column: Environmental Intelligence */}
              <div className="space-y-6">
                {/* SEASONALITY */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    📅 Diagnostics Intel
                  </h4>
                  {selectedPlant.seasonality && (
                    <div className="space-y-4">
                      <div className="relative pl-6 border-l-2 border-amber-600/30">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 bg-amber-600 rounded-full ring-4 ring-stone-900" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Sowing Window</span>
                        <p className="text-xs text-stone-300 font-bold mt-1">
                          {(() => {
                            const s = selectedPlant.seasonality?.sowing;
                            const range = Array.isArray(s) ? s[0] : s;
                            if (range) {
                              const start = typeof range.start_month === 'number' ? monthNames[range.start_month - 1] : range.start_month;
                              const end = typeof range.end_month === 'number' ? monthNames[range.end_month - 1] : range.end_month;
                              return `${start} — ${end}`;
                            }
                            return "Seasonal window not specified";
                          })()}
                        </p>
                      </div>
                      <div className="relative pl-6 border-l-2 border-garden-600/30">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 bg-garden-600 rounded-full ring-4 ring-stone-900" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-garden-500">Optimal Harvest</span>
                        <p className="text-xs text-stone-300 font-bold mt-1">
                          {(() => {
                            const h = selectedPlant.seasonality?.harvest;
                            const range = Array.isArray(h) ? h[0] : h;
                            if (range) {
                              const start = typeof range.start_month === 'number' ? monthNames[range.start_month - 1] : range.start_month;
                              const end = typeof range.end_month === 'number' ? monthNames[range.end_month - 1] : range.end_month;
                              return `${start} — ${end}`;
                            }
                            return "Harvest window not specified";
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* PESTS & DISEASES */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2 border-b border-stone-700 pb-2">
                    🛑 Threat Assessment
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Common Pests</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlant.common_pests?.length ? selectedPlant.common_pests.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-stone-900 text-stone-500 rounded text-[9px] border border-stone-800 hover:text-red-400 transition-colors">{p.replace('pest_', '').replace('_', ' ')}</span>
                        )) : <span className="text-[10px] text-stone-700 italic">None logged</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-stone-600 block mb-1">Known Diseases</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlant.common_diseases?.length ? selectedPlant.common_diseases.map(d => (
                          <span key={d} className="px-2 py-0.5 bg-stone-900 text-stone-500 rounded text-[9px] border border-stone-800 hover:text-red-400 transition-colors">{d.replace('disease_', '').replace('_', ' ')}</span>
                        )) : <span className="text-[10px] text-stone-700 italic">None logged</span>}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ENVIRONMENT */}
                <section className="bg-stone-800/20 p-4 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 border-b border-stone-700 pb-2">
                    🌍 Environment
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-stone-600 uppercase">Sunlight</span>
                      <div className="flex items-center gap-1">
                        {getSunlightIcon(selectedPlant.sunlight || 'unknown')}
                        <p className="text-xs text-stone-300 capitalize">{selectedPlant.sunlight?.replace('_', ' ') || "full sun"}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-stone-600 uppercase">Water</span>
                      <div className="flex items-center gap-1">
                        {getWaterIcon(selectedPlant.water_requirements || 'unknown')}
                        <p className="text-xs text-stone-300 capitalize">{selectedPlant.water_requirements || "moderate"}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] font-bold text-stone-600 uppercase">Soil Preferences</span>
                      <p className="text-xs text-stone-300 capitalize">{selectedPlant.soil_type?.join(', ') || "loamy, well_draining"}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-700">
                    <span className="text-[9px] font-bold text-stone-600 uppercase">Nutrient Needs</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPlant.nutrient_preferences?.map(n => (
                        <span key={n} className="px-1.5 py-0.5 bg-stone-950 text-[10px] text-blue-400 border border-stone-700 rounded">{n.replace('_', ' ')}</span>
                      ))}
                      {(!selectedPlant.nutrient_preferences || selectedPlant.nutrient_preferences.length === 0) && (
                        <span className="px-1.5 py-0.5 bg-stone-950 text-[10px] text-blue-400 border border-stone-700 rounded">potassium high</span>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer: Sources & Notes */}
            <div className="border-t border-stone-700 pt-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h5 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">KB Intelligence Sources</h5>
                  <div className="flex gap-4 flex-wrap">
                    {selectedPlant.source_metadata?.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="text-[11px] font-bold text-stone-300">{s.source_name}</div>
                        <div className="px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded text-[9px] font-mono border border-green-800/50">
                          {Math.round((Number((s as Record<string, unknown>).confidence_score) || 0.95) * 100)}%
                        </div>
                      </div>
                    ))}
                    {(!selectedPlant.source_metadata || selectedPlant.source_metadata.length === 0) && (
                      <div className="text-sm text-stone-600 italic">
                        No source metadata available
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-stone-800/20 rounded-xl border border-stone-700/30">
                  <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2">Notes</h4>
                  <p className="text-sm text-stone-400 leading-relaxed">{selectedPlant.notes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Plant Knowledgebase</h1>
        </div>
        <p className="text-stone-400 text-sm">Comprehensive information about plants, their requirements, and growing conditions</p>
      </div>

      <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-stone-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${plants.length} plants...`}
            className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-garden-500"
          />
        </div>
        <div className="text-xs text-stone-500">Showing {filtered.length}/{plants.length}</div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-stone-500">Loading plant knowledge base...</p>
        </div>
      ) : (
        <div 
          ref={parentRef}
          className="flex-1 overflow-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.index}
                style={{
                   display: 'grid',
                   gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                   position: 'absolute',
                   top: 4, // Subtle offset
                   left: 0,
                   width: '100%',
                   transform: `translateY(${virtualRow.start}px)`,
                   gap: '1rem'
                }}
              >
                {rows[virtualRow.index].map((plant) => (
                  <div
                    key={plant.plant_id}
                    onClick={() => setSelectedPlant(plant)}
                    className="p-4 bg-stone-800/20 rounded-2xl border border-stone-700/30 hover:border-garden-700/50 transition-all group cursor-pointer h-full"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-stone-200">{plant.common_name}</h3>
                        <p className="text-xs text-stone-500 italic">{plant.scientific_name}</p>
                      </div>
                      <div className="flex gap-1">
                        {getSunlightIcon(plant.sunlight || 'unknown')}
                        {getWaterIcon(plant.water_requirements || 'unknown')}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-xs px-1.5 py-0.5 bg-garden-900/20 text-garden-400 rounded border border-garden-700/20">
                        {plant.type}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-stone-900 text-stone-500 rounded border border-stone-800">
                        {plant.family}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-stone-600 line-clamp-1">{plant.notes}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-stone-500 text-lg">No plants match your search.</p>
            <p className="text-stone-600 mt-2">Try a different search term.</p>
          </div>
        </div>
      )}
    </div>
  );
};
