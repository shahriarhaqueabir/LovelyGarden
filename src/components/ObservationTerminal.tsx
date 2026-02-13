import React, { useState } from 'react';
import { X, Search, ChevronRight, Activity, Droplets, FlaskConical, Bug, Sprout, CheckCircle2, AlertCircle } from 'lucide-react';
import { DiagnosticCategory, getExtendedObservations, ObservationPattern } from '../logic/diagnostics';
import { PlantedDocument } from '../db/types';

interface ObservationTerminalProps {
  plant: PlantedDocument;
  catalog?: import('../db/types').CatalogDocument[];
  onClose: () => void;
  onSave: (pattern: ObservationPattern) => void;
}

export const ObservationTerminal: React.FC<ObservationTerminalProps> = ({ plant, catalog, onClose, onSave }) => {
  const [selectedCategory, setSelectedCategory] = useState<DiagnosticCategory>('Moisture');
  const [selectedObsId, setSelectedObsId] = useState<string | null>(null);
  const [view, setView] = useState<'browse' | 'diagnostic'>('browse');

  const categories: { id: DiagnosticCategory; icon: React.ReactNode; label: string; color: string }[] = [
    { id: 'Moisture', icon: <Droplets className="w-4 h-4" />, label: 'Hydration', color: 'text-blue-400' },
    { id: 'Pests', icon: <Bug className="w-4 h-4" />, label: 'Pathogens', color: 'text-amber-400' },
    { id: 'Nutrient', icon: <FlaskConical className="w-4 h-4" />, label: 'Nutriments', color: 'text-purple-400' },
    { id: 'Fertility', icon: <Activity className="w-4 h-4" />, label: 'Soil Bio', color: 'text-green-400' },
    { id: 'Growth', icon: <Sprout className="w-4 h-4" />, label: 'Vitality', color: 'text-emerald-400' },
  ];

  const currentCatalogItem = catalog?.find(c => c.id === plant.catalogId);
  const patterns = getExtendedObservations(currentCatalogItem);
  const filteredObservations = patterns.filter(o => o.category === selectedCategory);
  const currentObservation = patterns.find(o => o.id === selectedObsId);

  const handleSelectObservation = (obs: ObservationPattern) => {
    setSelectedObsId(obs.id);
    setView('diagnostic');
  };

  const handleConfirm = () => {
    if (currentObservation) {
      onSave(currentObservation);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-4xl bg-[#0c0a09] border border-stone-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-stone-800 bg-stone-900/40 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-garden-500/10 rounded-lg border border-garden-500/20">
                <Activity className="w-5 h-5 text-garden-400" />
              </div>
              <h2 className="text-2xl font-black text-stone-100 uppercase tracking-tighter">Diagnostics Terminal</h2>
            </div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">Analyzing: <span className="text-stone-300">{plant.catalogId}</span> at {plant.gridX},{plant.gridY}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-500 transition-all" title="Close Diagnostics">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR: CATEGORIES */}
          <div className="w-48 border-r border-stone-800 bg-stone-950/40 p-4 space-y-2">
            <div className="text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] mb-4 px-2">Axis</div>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setView('browse'); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat.id 
                    ? 'bg-stone-800 border-stone-700 ' + cat.color 
                    : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-900/50'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* MAIN PANEL */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0a09]">
            {view === 'browse' ? (
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-stone-600" />
                  <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Select Observable Pattern</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {filteredObservations.map(obs => (
                    <button
                      key={obs.id}
                      onClick={() => handleSelectObservation(obs)}
                      className="group w-full flex items-center justify-between p-4 bg-stone-900/30 border border-stone-800 hover:border-stone-600 rounded-2xl transition-all text-left"
                    >
                      <div>
                        <div className="text-sm font-bold text-stone-200 group-hover:text-garden-400 transition-colors">{obs.label}</div>
                        <div className="text-[11px] text-stone-500 mt-1 line-clamp-1">{obs.diagnostic}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-garden-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                  {filteredObservations.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                       <Search className="w-12 h-12 mx-auto mb-4 text-stone-600" />
                       <div className="text-sm font-bold uppercase tracking-widest">No Patterns Found</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-8 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8">
                  <div className="text-[10px] font-black text-garden-400 uppercase tracking-widest mb-2 px-2 py-0.5 bg-garden-500/10 border border-garden-500/20 inline-block rounded">Diagnostic Result</div>
                  <h3 className="text-3xl font-black text-stone-100 leading-tight">{currentObservation?.label}</h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* REASON */}
                  <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle className="w-16 h-16 text-garden-400" />
                     </div>
                     <div className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-garden-500 rounded-full" /> Reason / Diagnosis
                     </div>
                     <p className="text-stone-300 leading-relaxed font-medium">
                        {currentObservation?.diagnostic}
                     </p>
                  </div>

                  {/* SOLUTION */}
                  <div className="p-6 bg-garden-950/20 border border-garden-900/40 rounded-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 className="w-16 h-16 text-garden-400" />
                     </div>
                     <div className="text-[10px] font-black text-garden-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-garden-400 rounded-full" /> Solution / Prescription
                     </div>
                     <p className="text-garden-100 leading-relaxed font-bold">
                        {currentObservation?.prescription}
                     </p>
                  </div>

                  {/* STATE IMPACT PREVIEW */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     {currentObservation?.impact.hydration !== undefined && (
                        <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-xl text-center">
                           <div className="text-[9px] font-black text-stone-500 uppercase mb-1">Hydration</div>
                           <div className="text-sm font-bold text-blue-400">{currentObservation.impact.hydration}%</div>
                        </div>
                     )}
                     {currentObservation?.impact.stress !== undefined && (
                        <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-xl text-center">
                           <div className="text-[9px] font-black text-stone-500 uppercase mb-1">Stress Impact</div>
                           <div className="text-sm font-bold text-red-400">+{currentObservation.impact.stress}%</div>
                        </div>
                     )}
                     {currentObservation?.impact.n !== undefined && (
                        <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-xl text-center">
                           <div className="text-[9px] font-black text-stone-500 uppercase mb-1">Nitrogen</div>
                           <div className="text-sm font-bold text-green-400">{currentObservation.impact.n}%</div>
                        </div>
                     )}
                  </div>
                </div>

                <div className="mt-auto pt-8 flex gap-4">
                  <button 
                    onClick={() => setView('browse')}
                    className="flex-1 py-4 bg-stone-900 border border-stone-800 rounded-2xl text-stone-400 font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
                  >
                    Back to Selection
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="flex-[2] py-4 bg-garden-600 hover:bg-garden-500 text-stone-950 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Commit Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
