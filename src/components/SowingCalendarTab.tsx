import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Search } from "lucide-react";
import { PlantSpecies, Season, UserLocation } from "../schema/knowledge-graph";
import { isSowingSeason } from "../logic/reasoning";
import Fuse from "fuse.js";

interface SowingCalendarTabProps {
  catalog: PlantSpecies[];
  currentDay: number;
  hemisphere: "North" | "South";
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthsNorth: Season[] = [
  "Winter",
  "Winter",
  "Spring",
  "Spring",
  "Spring",
  "Summer",
  "Summer",
  "Summer",
  "Autumn",
  "Autumn",
  "Autumn",
  "Winter",
];

import { getSeasonIcon } from "../utils/ui-helpers";

export const SowingCalendarTab: React.FC<SowingCalendarTabProps> = ({
  catalog,
  currentDay,
  hemisphere,
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Real-time month based on currentDay prop
  const realMonth = useMemo(
    () => Math.floor(((currentDay - 1) % 365) / 30.42),
    [currentDay],
  );

  // Calendar month selected for viewing seasonal windows.
  const [activeMonth, setActiveMonth] = useState(realMonth);

  const activeSeason = monthsNorth[activeMonth] || "Spring";

  // Debounce search query - use inline effect to avoid unknown dependency warning
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fuse.js instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(catalog, {
        keys: ["name", "scientificName", "categories", "sunlight"],
        threshold: 0.3,
        includeMatches: false,
      }),
    [catalog],
  );

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return catalog;
    return fuse.search(q).map((result) => result.item);
  }, [catalog, debouncedQuery, fuse]);

  const location = useMemo(
    () =>
      ({
        id: "user_location",
        hemisphere,
        frost_data: {},
      }) as UserLocation,
    [hemisphere],
  );

  const eligible = filtered.filter(
    (p) => isSowingSeason(p, location, activeMonth).eligible,
  );
  const ineligible = filtered.filter(
    (p) => !isSowingSeason(p, location, activeMonth).eligible,
  );

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Sowing Calendar</h1>
        </div>
        <p className="text-stone-400 text-sm">
          Plan your sowing schedule based on seasonal windows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-stone-900/40 rounded-3xl border border-stone-800/60 p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-stone-100 uppercase tracking-tighter">
                Current Conditions
              </h2>
              <div className="flex items-center gap-3 bg-stone-950/50 px-4 py-2 rounded-full border border-stone-800">
                {getSeasonIcon(activeSeason)}
                <span className="text-xs font-bold uppercase tracking-widest text-stone-300">
                  {monthNames[activeMonth]}{" "}
                  <span className="text-stone-600 mx-1">·</span> {activeSeason}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-800/50 hover:border-garden-500/30 transition-colors group">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600 block mb-1 group-hover:text-stone-400 transition-colors">
                  Date
                </span>
                <span className="text-xl font-black text-garden-400 tracking-tighter">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-800/50 hover:border-garden-500/30 transition-colors group">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600 block mb-1 group-hover:text-stone-400 transition-colors">
                  Active Month
                </span>
                <span className="text-2xl font-black text-garden-400 tracking-tighter">
                  {monthNames[activeMonth]}
                </span>
              </div>
              <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-800/50 hover:border-garden-500/30 transition-colors group">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600 block mb-1 group-hover:text-stone-400 transition-colors">
                  Season
                </span>
                <span className="text-2xl font-black text-garden-400 tracking-tighter">
                  {activeSeason}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-800/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-garden-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
                  Planning Window
                </span>
              </div>
              {activeMonth !== realMonth && (
                <button
                  onClick={() => setActiveMonth(realMonth)}
                  className="text-[10px] font-black uppercase tracking-widest text-garden-500 hover:text-garden-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-garden-500" /> Reset
                  to Today
                </button>
              )}
            </div>

            <input
              type="range"
              min="0"
              max="11"
              value={activeMonth}
              onChange={(e) =>
                setActiveMonth(Number.parseInt(e.target.value, 10))
              }
              title="Select calendar month"
              aria-label="Calendar month slider"
              className="w-full h-2 bg-stone-950 rounded-full appearance-none cursor-pointer border border-stone-800/50 overflow-hidden accent-garden-500 hover:accent-garden-400 transition-all"
            />

            <div className="flex justify-between mt-4 px-2">
              {monthNames.map((m, i) => (
                <div key={m} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-1 h-1 rounded-full transition-all duration-300 ${activeMonth === i ? "bg-garden-500 scale-150 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-stone-800"}`}
                  />
                  <span
                    className={`text-[9px] font-black uppercase transition-colors duration-300 ${activeMonth === i ? "text-garden-400" : "text-stone-700"}`}
                  >
                    {m[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6 z-10 relative">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="crop-search"
              className="text-xs font-bold text-stone-500 uppercase tracking-widest"
            >
              Filter Library
            </label>
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-garden-500/50 transition-all">
              <Search className="w-4 h-4 text-stone-500" />
              <input
                id="crop-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, category, or scientific name..."
                title="Search plant species"
                aria-label="Search plant library"
                className="flex-1 bg-transparent border-none text-sm text-stone-200 placeholder:text-stone-700 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-stone-800 rounded-full text-stone-600 hover:text-stone-400 transition-colors"
                >
                  <span className="sr-only">Clear</span>
                  {/* Close icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
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
            <h3 className="font-bold text-garden-400">
              Plant Now ({eligible.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {eligible.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-garden-500/20 bg-garden-900/10"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-stone-100">{p.name}</div>
                    <div className="text-xs text-stone-500 italic">
                      {p.scientificName}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {p.sowingSeason?.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-garden-700/20 bg-garden-900/20 text-garden-400"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {eligible.length === 0 && (
              <div className="text-center py-8 text-stone-500">
                <p>No plants are currently in season for sowing.</p>
                <p className="text-sm mt-2">
                  Try adjusting the active month or check other seasons.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <h3 className="font-bold text-amber-400">
              Out of Window ({ineligible.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {ineligible.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-amber-500/10 bg-amber-900/5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-stone-100">{p.name}</div>
                    <div className="text-xs text-stone-500 italic">
                      {p.scientificName}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {p.sowingSeason?.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/30 text-stone-400"
                    >
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
        <p>
          Note: Seasonal recommendations are based on Northern Hemisphere
          climate zones. Adjustments may be needed for your specific location.
        </p>
      </div>
    </div>
  );
};
