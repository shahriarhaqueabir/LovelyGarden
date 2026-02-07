import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, Sun, Droplets } from 'lucide-react';

interface PlantKB {
  plant_id: string;
  common_name: string;
  scientific_name: string;
  type: string;
  family: string;
  growth_stage: string[];
  seasonality: {
    sowing?: { start_month: string; end_month: string };
    sowing_indoor?: { start_month: string; end_month: string };
    transplant_outdoor?: { start_month: string; end_month: string };
    harvest?: { start_month: string; end_month: string };
    harvest_early?: { start_month: string; end_month: string };
  };
  sunlight: string;
  water_requirements: string;
  soil_type: string[];
  companion_plants: string[];
  incompatible_plants: string[];
  common_pests: string[];
  common_diseases: string[];
  nutrient_preferences: string[];
  notes: string;
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
        setPlants(data.plants || []);
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

  const getSunlightIcon = (sunlight: string) => {
    switch (sunlight) {
      case 'full_sun': return <Sun className="w-4 h-4 text-amber-400" />;
      case 'partial_sun': return <Sun className="w-4 h-4 text-yellow-300" />;
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-stone-100">{selectedPlant.common_name}</h2>
              <p className="text-sm text-stone-500 italic">{selectedPlant.scientific_name}</p>
              <div className="mt-3 flex gap-2">
                <span className="text-xs px-2 py-1 bg-garden-900/30 text-garden-400 rounded border border-garden-700/30">
                  {selectedPlant.type}
                </span>
                <span className="text-xs px-2 py-1 bg-stone-800 text-stone-400 rounded border border-stone-700">
                  {selectedPlant.family}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-stone-800/30 rounded-xl border border-stone-700/30">
                <div className="flex items-center gap-2 mb-2">
                  {getSunlightIcon(selectedPlant.sunlight)}
                  <span className="text-xs uppercase tracking-wider text-stone-500">Sunlight</span>
                </div>
                <p className="text-sm text-stone-300 capitalize">{selectedPlant.sunlight.replace('_', ' ')}</p>
              </div>
              <div className="p-4 bg-stone-800/30 rounded-xl border border-stone-700/30">
                <div className="flex items-center gap-2 mb-2">
                  {getWaterIcon(selectedPlant.water_requirements)}
                  <span className="text-xs uppercase tracking-wider text-stone-500">Water</span>
                </div>
                <p className="text-sm text-stone-300 capitalize">{selectedPlant.water_requirements}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Growing Season</h4>
              <div className="space-y-2">
                {selectedPlant.seasonality.sowing && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Sowing:</span>
                    <span className="text-stone-300">{selectedPlant.seasonality.sowing.start_month} - {selectedPlant.seasonality.sowing.end_month}</span>
                  </div>
                )}
                {selectedPlant.seasonality.sowing_indoor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Indoor Sowing:</span>
                    <span className="text-stone-300">{selectedPlant.seasonality.sowing_indoor.start_month} - {selectedPlant.seasonality.sowing_indoor.end_month}</span>
                  </div>
                )}
                {selectedPlant.seasonality.transplant_outdoor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Transplant Outdoors:</span>
                    <span className="text-stone-300">{selectedPlant.seasonality.transplant_outdoor.start_month} - {selectedPlant.seasonality.transplant_outdoor.end_month}</span>
                  </div>
                )}
                {selectedPlant.seasonality.harvest && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Harvest:</span>
                    <span className="text-stone-300">{selectedPlant.seasonality.harvest.start_month} - {selectedPlant.seasonality.harvest.end_month}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Soil Type</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlant.soil_type.map(soil => (
                  <span key={soil} className="text-xs px-2 py-1 bg-stone-800 text-stone-400 rounded">
                    {soil.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Companion Plants</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlant.companion_plants.map(plant => (
                    <span key={plant} className="text-xs px-2 py-1 bg-garden-900/20 text-garden-400 rounded border border-garden-700/20">
                      {plant.replace('plant_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Incompatible With</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlant.incompatible_plants.map(plant => (
                    <span key={plant} className="text-xs px-2 py-1 bg-red-900/20 text-red-400 rounded border border-red-700/20">
                      {plant.replace('plant_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Common Pests</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlant.common_pests.map(pest => (
                    <span key={pest} className="text-xs px-2 py-1 bg-amber-900/20 text-amber-400 rounded border border-amber-700/20">
                      {pest.replace('pest_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Common Diseases</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlant.common_diseases.map(disease => (
                    <span key={disease} className="text-xs px-2 py-1 bg-red-900/20 text-red-400 rounded border border-red-700/20">
                      {disease.replace('disease_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Nutrient Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlant.nutrient_preferences.map(nutrient => (
                  <span key={nutrient} className="text-xs px-2 py-1 bg-purple-900/20 text-purple-400 rounded border border-purple-700/20">
                    {nutrient.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-stone-800/20 rounded-xl border border-stone-700/30">
              <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Notes</h4>
              <p className="text-sm text-stone-400 leading-relaxed">{selectedPlant.notes}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto">
          {filtered.map((plant) => (
            <div
              key={plant.plant_id}
              onClick={() => setSelectedPlant(plant)}
              className="p-4 bg-stone-800/20 rounded-2xl border border-stone-700/30 hover:border-garden-700/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-200">{plant.common_name}</h3>
                  <p className="text-xs text-stone-500 italic">{plant.scientific_name}</p>
                </div>
                <div className="flex gap-1">
                  {getSunlightIcon(plant.sunlight)}
                  {getWaterIcon(plant.water_requirements)}
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
          ))}
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