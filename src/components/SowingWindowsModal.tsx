import React, { useMemo, useState } from 'react';
import { X, Calendar, Search } from 'lucide-react';
import { PlantSpecies, Season } from '../schema/knowledge-graph';
import { isSowingSeason } from '../logic/reasoning';

interface SowingWindowsModalProps {
  catalog: PlantSpecies[];
  currentDay: number;
  onClose: () => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsNorth: Season[] = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];

export const SowingWindowsModal: React.FC<SowingWindowsModalProps> = ({ catalog, currentDay, onClose }) => {
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
          <button onClick={onClose} className="p-2 rounded-xl border border-stone-800 text-stone-500 hover:text-stone-200 hover:bg-stone-800/40 transition-colors">
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
              {eligible.map(p => (
                <div key={p.id} className="p-3 rounded-2xl border border-garden-500/20 bg-garden-900/10">
                  <div className="text-sm font-bold text-stone-100">{p.name}</div>
                  <div className="text-[10px] text-stone-500 italic">{p.scientificName}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(p.sowingSeason || []).map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {eligible.length === 0 && <div className="text-xs text-stone-500">No matches are currently in-season.</div>}
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">Out of Window ({ineligible.length})</div>
            <div className="space-y-2">
              {ineligible.map(p => (
                <div key={p.id} className="p-3 rounded-2xl border border-amber-500/10 bg-amber-900/5">
                  <div className="text-sm font-bold text-stone-100">{p.name}</div>
                  <div className="text-[10px] text-stone-500 italic">{p.scientificName}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(p.sowingSeason || []).map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {ineligible.length === 0 && <div className="text-xs text-stone-500">Everything shown is currently in-season.</div>}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-800 text-[10px] text-stone-600">
          Note: month/season is derived from the simulated day (approximation). Next iteration can anchor this to a real calendar date and Dresden frost windows.
        </div>
      </div>
    </div>
  );
};
