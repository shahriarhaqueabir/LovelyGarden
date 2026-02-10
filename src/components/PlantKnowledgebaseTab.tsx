import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BookOpen, Search, Sun, Droplets } from 'lucide-react';

// Define a unified PlantKB interface that combines both structures
interface PlantKB {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  family?: string;
  genus?: string;
  species?: string;
  categories: ('vegetable' | 'fruit' | 'herb' | 'flower' | 'root_crop' | 'leafy_green')[];
  life_cycle: 'annual' | 'biennial' | 'perennial';
  growth_habit: ('upright' | 'bushy' | 'vining' | 'trailing' | 'climbing')[];
  photosynthesis_type?: 'C3' | 'C4' | 'CAM';
  edible_parts: string[];
  toxic_parts: string[];
  pollination_type: 'self_pollinating' | 'cross_pollinating' | 'wind' | 'insect';
  sowingSeason: ('Spring' | 'Summer' | 'Autumn' | 'Winter')[];
  sowingMethod: 'Direct' | 'Transplant';
  stages: Array<{
    id: 'seed' | 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest' | 'dormant' | string;
    name: string;
    durationDays: number;
    waterFrequencyDays: number;
    imageAssetId: string;
  }>;
  companions: string[];
  antagonists: string[];
  confidence_score: number;
  sources: string[];
  seasonality?: {
    sowing?: { start_month: string; end_month: string };
    harvest?: { start_month: string; end_month: string };
    sowing_indoor?: { start_month: string; end_month: string };
    transplant_outdoor?: { start_month: string; end_month: string };
    harvest_early?: { start_month: string; end_month: string };
  };
  sunlight?: string;
  water_requirements?: string;
  soil_type?: string[];
  common_pests?: string[];
  common_diseases?: string[];
  nutrient_preferences?: string[];
  source_metadata?: Array<{
    source_name: string;
    url?: string;
    confidence_score: number;
  }>;
  // Fields from the expanded knowledge base
  plant_id?: string;
  common_name?: string;
  scientific_name?: string;
  type?: string;
  growth_stage?: string[];
  companion_plants?: string[];
  incompatible_plants?: string[];
  notes?: string;
}

export const PlantKnowledgebaseTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [plants, setPlants] = useState<PlantKB[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<PlantKB | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const response = await fetch('/data/plants-kb.json');
        const data = await response.json();
        const plantsArray = Array.isArray(data) ? data : (data.plants || []);
        
        // Transform the data to match the PlantKB interface
        // Define the expected structure of the raw plant data from the JSON file
        interface RawPlantData {
          plant_id: string;
          common_name: string;
          scientific_name: string;
          type: string;
          family: string;
          notes: string;
          edible_parts: string[];
          toxic_parts: string[];
          pollination_type: string;
          sowingSeason: string[];
          sowingMethod: string;
          companion_plants: string[];
          incompatible_plants: string[];
          growth_stage?: string[];
          stages?: Array<{
            id: string;
            name: string;
            durationDays: number;
            waterFrequencyDays: number;
          }>;
          seasonality?: {
            sowing?: { start_month: string; end_month: string };
            harvest?: { start_month: string; end_month: string };
            sowing_indoor?: { start_month: string; end_month: string };
            transplant_outdoor?: { start_month: string; end_month: string };
            harvest_early?: { start_month: string; end_month: string };
          };
          sunlight?: string;
          water_requirements?: string;
          soil_type?: string[];
          common_pests?: string[];
          common_diseases?: string[];
          nutrient_preferences?: string[];
          source_metadata?: Array<{
            source_name: string;
            url?: string;
            confidence_score: number;
          }>;
          genus?: string;
          species?: string;
        }

        const transformedPlants = plantsArray.map((plant: RawPlantData) => ({
          // Map common fields
          id: plant.plant_id,
          name: plant.common_name,
          scientificName: plant.scientific_name,
          description: plant.notes || '',

          // Map fields from both structures
          family: plant.family || '',
          type: plant.type || 'unknown',
          categories: [plant.type || 'vegetable'] as ('vegetable' | 'fruit' | 'herb' | 'flower' | 'root_crop' | 'leafy_green')[],
          life_cycle: 'annual' as 'annual' | 'biennial' | 'perennial',
          growth_habit: ['bushy'] as ('upright' | 'bushy' | 'vining' | 'trailing' | 'climbing')[],
          photosynthesis_type: 'C3' as 'C3' | 'C4' | 'CAM',
          edible_parts: plant.edible_parts || [],
          toxic_parts: plant.toxic_parts || [],
          pollination_type: (plant.pollination_type || 'insect') as 'self_pollinating' | 'cross_pollinating' | 'wind' | 'insect',
          sowingSeason: plant.sowingSeason || [],
          sowingMethod: (plant.sowingMethod || 'Direct') as 'Direct' | 'Transplant',
          companions: plant.companion_plants || [],
          antagonists: plant.incompatible_plants || [],
          confidence_score: 0.95,
          sources: (plant.source_metadata || []).map((m) => m.source_name),

          // Map the expanded fields
          plant_id: plant.plant_id,
          common_name: plant.common_name,
          scientific_name: plant.scientific_name,
          growth_stage: plant.growth_stage || [],
          stages: plant.stages?.map((stage) => ({
            id: stage.id,
            name: stage.name,
            durationDays: stage.durationDays,
            waterFrequencyDays: stage.waterFrequencyDays,
            imageAssetId: 'generic_image'
          })) || [],
          seasonality: plant.seasonality,
          sunlight: plant.sunlight,
          water_requirements: plant.water_requirements,
          soil_type: plant.soil_type || [],
          companion_plants: plant.companion_plants || [],
          incompatible_plants: plant.incompatible_plants || [],
          common_pests: plant.common_pests || [],
          common_diseases: plant.common_diseases || [],
          nutrient_preferences: plant.nutrient_preferences || [],
          notes: plant.notes || '',
          source_metadata: plant.source_metadata || [],

          // Additional fields from PlantSpecies
          genus: plant.genus || '',
          species: plant.species || '',
        }));
        
        setPlants(transformedPlants);
      } catch (error) {
        console.error('Failed to load plant knowledge base:', error);
      } finally {
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

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Estimated height of each card
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
                    {selectedPlant.stages?.map((stage, idx) => (
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
                    {!selectedPlant.stages || selectedPlant.stages.length === 0 ? (
                      <div className="text-center py-4 text-stone-600 text-sm">
                        No growth stage data available
                      </div>
                    ) : null}
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
                          {selectedPlant.seasonality.sowing?.start_month || "February"} — {selectedPlant.seasonality.sowing?.end_month || "March"}
                        </p>
                      </div>
                      <div className="relative pl-6 border-l-2 border-garden-600/30">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 bg-garden-600 rounded-full ring-4 ring-stone-900" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-garden-500">Optimal Harvest</span>
                        <p className="text-xs text-stone-300 font-bold mt-1">
                          {selectedPlant.seasonality.harvest?.start_month || "September"} — {selectedPlant.seasonality.harvest?.end_month || "October"}
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
                          {Math.round(s.confidence_score * 100)}%
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const plant = filtered[virtualItem.index];
                
                return (
                  <div
                    key={plant.plant_id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      gridRow: Math.floor(virtualItem.index / 4) + 1,
                      gridColumn: (virtualItem.index % 4) + 1,
                    }}
                    onClick={() => setSelectedPlant(plant)}
                    className="p-4 bg-stone-800/20 rounded-2xl border border-stone-700/30 hover:border-garden-700/50 transition-all group cursor-pointer"
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
                    <p className="mt-2 text-xs text-stone-600 line-clamp-2">{plant.notes}</p>
                  </div>
                );
              })}
            </div>
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
