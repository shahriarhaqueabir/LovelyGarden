import React, { useMemo, useState, useEffect } from 'react';
import { X, Calendar, Search } from 'lucide-react';
import { PlantSpecies, Season, UserLocation } from '../schema/knowledge-graph';
import { isSowingSeason } from '../logic/reasoning';

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

interface SowingWindowsModalProps {
  catalog: PlantSpecies[];
  currentDay: number;
  onClose: () => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsNorth: Season[] = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];

// Map month names to indices for easier comparison
const monthToIndex: Record<string, number> = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
  'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
};

export const SowingWindowsModal: React.FC<SowingWindowsModalProps> = ({ catalog, currentDay, onClose }) => {
  const [query, setQuery] = useState('');
  const [plantKB, setPlantKB] = useState<PlantKB[]>([]);

  useEffect(() => {
    const loadPlantKB = async () => {
      try {
        const response = await fetch('/data/plants-kb.json');
        const data = await response.json();
        setPlantKB(data.plants || []);
      } catch (error) {
        console.error('Failed to load plant knowledge base:', error);
        setPlantKB([]);
      }
    };
    loadPlantKB();
  }, []);

  // Approx mapping: day 1 ~ Jan 1
  const currentMonth = Math.floor(((currentDay - 1) % 365) / 30.42);
  const currentSeason = monthsNorth[currentMonth] || 'Spring';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(p => {
      const hay = `${p.name ?? ''} ${p.scientificName ?? ''} ${(p.categories || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, query]);

  const location = useMemo(() => ({ id: 'user_location', hemisphere: 'North', frost_data: {} } as UserLocation), []);

  const eligible = filtered.filter(p => isSowingSeason(p, location, currentMonth).eligible);
  const ineligible = filtered.filter(p => !isSowingSeason(p, location, currentMonth).eligible);

  // Function to get detailed sowing info from plantKB
  const getDetailedSowingInfo = (plantId: string) => {
    // Convert catalog ID format to plantKB format (e.g., "tomato-beefsteak" to "plant_tomato")
    const normalizedId = `plant_${plantId.replace(/-/g, '_')}`;
    const kbPlant = plantKB.find(p => p.plant_id === normalizedId);
    
    if (!kbPlant || !kbPlant.seasonality) {
      return null;
    }
    
    return kbPlant.seasonality;
  };


  // Function to get all months in sowing window
  const getSowingMonths = (startMonth: string, endMonth: string) => {
    const startIndex = monthToIndex[startMonth] ?? 0;
    const endIndex = monthToIndex[endMonth] ?? 11;
    const months = [];
    
    if (startIndex <= endIndex) {
      // Normal range
      for (let i = startIndex; i <= endIndex; i++) {
        months.push(monthNames[i]);
      }
    } else {
      // Wrap-around range
      for (let i = startIndex; i < 12; i++) {
        months.push(monthNames[i]);
      }
      for (let i = 0; i <= endIndex; i++) {
        months.push(monthNames[i]);
      }
    }
    
    return months;
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[46rem] max-w-[95vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 glass border border-stone-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-garden-400" />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-stone-400">Sowing Windows</div>
              <div className="text-sm font-bold text-stone-100">Current: {monthNames[currentMonth]} · {currentSeason}</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl border border-stone-800 text-stone-500 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
            aria-label="Close sowing windows"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-2 w-full bg-stone-950/50 border border-stone-800 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-stone-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${catalog.length} species...`}
              className="w-full bg-transparent outline-none text-xs text-stone-200 placeholder:text-stone-600"
            />
          </div>
          <div className="mt-2 text-[10px] text-stone-600 font-mono">Showing {filtered.length}/{catalog.length}</div>
        </div>

        <div className="grid grid-cols-2 gap-0 max-h-[60vh] overflow-hidden">
          <div className="p-6 overflow-y-auto border-r border-stone-800">
            <div className="text-[10px] font-black uppercase tracking-widest text-garden-400 mb-3">Plant Now ({eligible.length})</div>
            <div className="space-y-2">
              {eligible.map(p => {
                const detailedInfo = getDetailedSowingInfo(p.id);
                return (
                  <div key={p.id} className="p-3 rounded-2xl border border-garden-500/20 bg-garden-900/10">
                    <div className="text-sm font-bold text-stone-100">{p.name}</div>
                    <div className="text-[10px] text-stone-500 italic">{p.scientificName}</div>
                    
                    {detailedInfo && (
                      <div className="mt-2 space-y-1">
                        {detailedInfo.sowing && (
                          <div className="text-[9px]">
                            <span className="text-stone-500">Sowing:</span>{' '}
                            <span className="text-garden-400">
                              {detailedInfo.sowing.start_month} - {detailedInfo.sowing.end_month}
                            </span>
                          </div>
                        )}
                        {detailedInfo.sowing_indoor && (
                          <div className="text-[9px]">
                            <span className="text-stone-500">Indoor sowing:</span>{' '}
                            <span className="text-garden-400">
                              {detailedInfo.sowing_indoor.start_month} - {detailedInfo.sowing_indoor.end_month}
                            </span>
                          </div>
                        )}
                        {detailedInfo.transplant_outdoor && (
                          <div className="text-[9px]">
                            <span className="text-stone-500">Transplant:</span>{' '}
                            <span className="text-garden-400">
                              {detailedInfo.transplant_outdoor.start_month} - {detailedInfo.transplant_outdoor.end_month}
                            </span>
                          </div>
                        )}
                        
                        {/* Show all sowing months as badges */}
                        {detailedInfo.sowing && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getSowingMonths(detailedInfo.sowing.start_month, detailedInfo.sowing.end_month).map(month => (
                              <span 
                                key={month} 
                                className={`text-[8px] px-1 py-0.5 rounded border ${
                                  month === monthNames[currentMonth] 
                                    ? 'bg-garden-500/30 border-garden-400 text-garden-200' 
                                    : 'border-stone-800 bg-stone-900/50 text-stone-400'
                                }`}
                              >
                                {month}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!detailedInfo && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.sowingSeason || []).map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {eligible.length === 0 && <div className="text-xs text-stone-500">No matches are currently in-season.</div>}
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">Out of Window ({ineligible.length})</div>
            <div className="space-y-2">
              {ineligible.map(p => {
                const detailedInfo = getDetailedSowingInfo(p.id);
                return (
                  <div key={p.id} className="p-3 rounded-2xl border border-amber-500/10 bg-amber-900/5">
                    <div className="text-sm font-bold text-stone-100">{p.name}</div>
                    <div className="text-[10px] text-stone-500 italic">{p.scientificName}</div>
                    
                    {detailedInfo && (
                      <div className="mt-2 space-y-1">
                        {detailedInfo.sowing && (
                          <div className="text-[9px]">
                            <span className="text-stone-500">Sowing:</span>{' '}
                            <span className="text-amber-400">
                              {detailedInfo.sowing.start_month} - {detailedInfo.sowing.end_month}
                            </span>
                          </div>
                        )}
                        {detailedInfo.sowing_indoor && (
                          <div className="text-[9px]">
                            <span className="text-stone-500">Indoor sowing:</span>{' '}
                            <span className="text-amber-400">
                              {detailedInfo.sowing_indoor.start_month} - {detailedInfo.sowing_indoor.end_month}
                            </span>
                          </div>
                        )}
                        {detailedInfo.transplant_outdoor && (
                          <div className="text-[9px]">
                            <span className="text-stone-500">Transplant:</span>{' '}
                            <span className="text-amber-400">
                              {detailedInfo.transplant_outdoor.start_month} - {detailedInfo.transplant_outdoor.end_month}
                            </span>
                          </div>
                        )}
                        
                        {/* Show all sowing months as badges */}
                        {detailedInfo.sowing && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getSowingMonths(detailedInfo.sowing.start_month, detailedInfo.sowing.end_month).map(month => (
                              <span 
                                key={month} 
                                className={`text-[8px] px-1 py-0.5 rounded border ${
                                  month === monthNames[currentMonth] 
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200' 
                                    : 'border-stone-800 bg-stone-900/50 text-stone-400'
                                }`}
                              >
                                {month}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!detailedInfo && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.sowingSeason || []).map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {ineligible.length === 0 && <div className="text-xs text-stone-500">Everything shown is currently in-season.</div>}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-800 text-[10px] text-stone-600">
          Note: Month/season is derived from the simulated day (approximation). Detailed sowing windows from knowledge base. 
          Current month highlighted in sowing period.
        </div>
      </div>
    </div>
  );
};
