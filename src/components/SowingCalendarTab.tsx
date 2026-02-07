import React, { useState, useMemo } from 'react';
import { Calendar, Search, Sun } from 'lucide-react';
import { PlantSpecies, Season } from '../schema/knowledge-graph';
import { isSowingSeason } from '../logic/reasoning';

interface SowingCalendarTabProps {
  catalog: PlantSpecies[];
  currentDay: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsNorth: Season[] = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];

export const SowingCalendarTab: React.FC<SowingCalendarTabProps> = ({ catalog, currentDay }) => {
  const [query, setQuery] = useState('');

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

  const location = useMemo(() => ({ hemisphere: 'North' } as any), []);

  const eligible = filtered.filter(p => isSowingSeason(p, location, currentMonth).eligible);
  const ineligible = filtered.filter(p => !isSowingSeason(p, location, currentMonth).eligible);

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Sowing Calendar</h1>
        </div>
        <p className="text-stone-400 text-sm">Plan your sowing schedule based on seasonal windows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-100">Current Conditions</h2>
            <div className="flex items-center gap-2 text-stone-400">
              <Sun className="w-4 h-4" />
              <span className="text-sm">{monthNames[currentMonth]} · {currentSeason}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Current Day</span>
              <span className="font-bold text-garden-400">{currentDay}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Current Month</span>
              <span className="font-bold text-garden-400">{monthNames[currentMonth]}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Current Season</span>
              <span className="font-bold text-garden-400">{currentSeason}</span>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6 z-10 relative">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Filter Library</label>
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-garden-500/50 transition-all">
              <Search className="w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, category, or scientific name..."
                className="flex-1 bg-transparent border-none text-sm text-stone-200 placeholder:text-stone-700 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-stone-800 rounded-full text-stone-600 hover:text-stone-400 transition-colors"
                >
                  <span className="sr-only">Clear</span>
                  {/* Close icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-600 mt-1">
              <span>Looking for specific crops?</span>
              <span>{filtered.length} found</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 flex-1">
        <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-garden-500 rounded-full"></div>
            <h3 className="font-bold text-garden-400">Plant Now ({eligible.length})</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {eligible.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-garden-500/20 bg-garden-900/10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-stone-100">{p.name}</div>
                    <div className="text-xs text-stone-500 italic">{p.scientificName}</div>
                  </div>
                  <div className="flex gap-1">
                    {p.sowingSeason?.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.categories?.map(cat => (
                    <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded border border-garden-700/20 bg-garden-900/20 text-garden-400">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {eligible.length === 0 && (
              <div className="text-center py-8 text-stone-500">
                <p>No plants are currently in season for sowing.</p>
                <p className="text-sm mt-2">Try adjusting the temporal axis or check other seasons.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <h3 className="font-bold text-amber-400">Out of Window ({ineligible.length})</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ineligible.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-amber-500/10 bg-amber-900/5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-stone-100">{p.name}</div>
                    <div className="text-xs text-stone-500 italic">{p.scientificName}</div>
                  </div>
                  <div className="flex gap-1">
                    {p.sowingSeason?.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.categories?.map(cat => (
                    <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/30 text-stone-400">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {ineligible.length === 0 && (
              <div className="text-center py-8 text-stone-500">
                <p>All plants are currently in season for sowing!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-stone-600 p-4 bg-stone-900/20 rounded-xl border border-stone-800">
        <p>Note: Seasonal recommendations are based on Northern Hemisphere climate zones. Adjustments may be needed for your specific location.</p>
      </div>
    </div>
  );
};