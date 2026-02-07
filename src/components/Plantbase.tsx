import React, { useMemo, useState, useEffect } from 'react';
import { X, Search, BookOpen, Sun, Droplets } from 'lucide-react';

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

interface PlantbaseProps {
  onClose: () => void;
}

export const Plantbase: React.FC<PlantbaseProps> = ({ onClose }) => {
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
      <div className="fixed inset-y-0 left-0 w-96 bg-stone-900/60 backdrop-blur-3xl border-r border-stone-800 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-stone-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-garden-400" />
              <h2 className="text-xl font-bold text-stone-100">Plantbase</h2>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Plant Detail */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <button 
              onClick={() => setSelectedPlant(null)}
              className="text-[10px] text-garden-400 hover:text-garden-300 uppercase tracking-widest font-bold"
            >
              ← Back to list
            </button>

            <div>
              <h3 className="text-2xl font-bold text-stone-100">{selectedPlant.common_name}</h3>
              <p className="text-sm text-stone-500 italic">{selectedPlant.scientific_name}</p>
              <div className="mt-2 flex gap-2">
                <span className="text-[10px] px-2 py-1 bg-garden-900/30 text-garden-400 rounded border border-garden-700/30">
                  {selectedPlant.type}
                </span>
                <span className="text-[10px] px-2 py-1 bg-stone-800 text-stone-400 rounded border border-stone-700">
                  {selectedPlant.family}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-stone-800/30 rounded-xl border border-stone-700/30">
                <div className="flex items-center gap-2 mb-1">
                  {getSunlightIcon(selectedPlant.sunlight)}
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Sunlight</span>
                </div>
                <p className="text-xs text-stone-300 capitalize">{selectedPlant.sunlight.replace('_', ' ')}</p>
              </div>
              <div className="p-3 bg-stone-800/30 rounded-xl border border-stone-700/30">
                <div className="flex items-center gap-2 mb-1">
                  {getWaterIcon(selectedPlant.water_requirements)}
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Water</span>
                </div>
                <p className="text-xs text-stone-300 capitalize">{selectedPlant.water_requirements}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Growing Season</h4>
              <div className="space-y-2">
                {selectedPlant.seasonality.sowing && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Sowing:</span>
                    <span className="text-stone-300">{selectedPlant.seasonality.sowing.start_month} - {selectedPlant.seasonality.sowing.end_month}</span>
                  </div>
                )}
                {selectedPlant.seasonality.harvest && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Harvest:</span>
                    <span className="text-stone-300">{selectedPlant.seasonality.harvest.start_month} - {selectedPlant.seasonality.harvest.end_month}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Soil Type</h4>
              <div className="flex flex-wrap gap-1">
                {selectedPlant.soil_type.map(soil => (
                  <span key={soil} className="text-[9px] px-2 py-1 bg-stone-800 text-stone-400 rounded">
                    {soil.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {selectedPlant.companion_plants.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Companion Plants</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedPlant.companion_plants.map(plant => (
                    <span key={plant} className="text-[9px] px-2 py-1 bg-garden-900/20 text-garden-400 rounded border border-garden-700/20">
                      {plant.replace('plant_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedPlant.incompatible_plants.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Incompatible With</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedPlant.incompatible_plants.map(plant => (
                    <span key={plant} className="text-[9px] px-2 py-1 bg-red-900/20 text-red-400 rounded border border-red-700/20">
                      {plant.replace('plant_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-stone-800/20 rounded-xl border border-stone-700/30">
              <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Notes</h4>
              <p className="text-xs text-stone-400 leading-relaxed">{selectedPlant.notes}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 w-96 bg-stone-900/60 backdrop-blur-3xl border-r border-stone-800 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-garden-400" />
            <h2 className="text-xl font-bold text-stone-100">Plantbase</h2>
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
              placeholder={`Search ${plants.length} plants...`}
              className="w-full bg-transparent outline-none text-xs text-stone-200 placeholder:text-stone-600"
            />
          </div>
          <div className="mt-2 text-[10px] text-stone-600 font-mono">
            Showing {filtered.length}/{plants.length}
          </div>
        </div>

        {/* Plant List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-6 text-center text-stone-500 text-xs">
              Loading plant knowledge base...
            </div>
          ) : (
            filtered.map((plant) => (
              <div 
                key={plant.plant_id}
                onClick={() => setSelectedPlant(plant)}
                className="p-4 bg-stone-800/20 rounded-2xl border border-stone-700/30 hover:border-garden-700/50 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-200">{plant.common_name}</h3>
                    <p className="text-[10px] text-stone-500 italic">{plant.scientific_name}</p>
                  </div>
                  <div className="flex gap-1">
                    {getSunlightIcon(plant.sunlight)}
                    {getWaterIcon(plant.water_requirements)}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-garden-900/20 text-garden-400 rounded border border-garden-700/20">
                    {plant.type}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-stone-900 text-stone-500 rounded border border-stone-800">
                    {plant.family}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-stone-600 line-clamp-2">{plant.notes}</p>
              </div>
            ))
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-6 text-center text-stone-500 text-xs">
              No plants match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
