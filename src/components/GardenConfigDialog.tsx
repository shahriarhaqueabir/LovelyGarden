
import React, { useState } from 'react';
import { X, Sprout, LayoutGrid, Sun, Droplets } from 'lucide-react';

interface GardenConfigDialogProps {
  onClose: () => void;
  onSave: (config: GardenConfig) => void;
  initialConfig?: GardenConfig | null;
  mode: 'create' | 'edit';
}

export interface GardenConfig {
  id?: string;
  name: string;
  type: string;
  soilType: string;
  sunExposure: string;
  gridWidth: number;
  gridHeight: number;
}

const GARDEN_TYPES = ['In-ground', 'Raised Bed', 'Container', 'Greenhouse'];
const SOIL_TYPES = ['Loam', 'Clay', 'Sandy', 'Custom Mix'];
const SUN_EXPOSURE = ['Full Sun', 'Partial Shade', 'Full Shade'];

export const GardenConfigDialog: React.FC<GardenConfigDialogProps> = ({ onClose, onSave, initialConfig, mode }) => {
  const [name, setName] = useState(initialConfig?.name || '');
  const [type, setType] = useState(initialConfig?.type || GARDEN_TYPES[0]);
  const [soilType, setSoilType] = useState(initialConfig?.soilType || SOIL_TYPES[0]);
  const [sunExposure, setSunExposure] = useState(initialConfig?.sunExposure || SUN_EXPOSURE[0]);
  const [width, setWidth] = useState(initialConfig?.gridWidth || 4);
  const [height, setHeight] = useState(initialConfig?.gridHeight || 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialConfig?.id,
      name,
      type,
      soilType,
      sunExposure,
      gridWidth: width,
      gridHeight: height
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-stone-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-garden-500" />
              <h2 className="text-xl font-bold text-stone-100">{mode === 'create' ? 'Establish New Garden' : 'Configure Garden'}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-stone-500 tracking-widest">Designation</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. South Terrace, Herb Spiral..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:border-garden-500 outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-500 tracking-widest flex items-center gap-2">
                   Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-300 outline-none focus:border-garden-500"
                >
                  {GARDEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

               {/* Soil */}
               <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-500 tracking-widest flex items-center gap-2">
                   <Droplets className="w-3 h-3" /> Substrate
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-300 outline-none focus:border-garden-500"
                >
                  {SOIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Sun Exposure */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-500 tracking-widest flex items-center gap-2">
                   <Sun className="w-3 h-3" /> Solar Access
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUN_EXPOSURE.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSunExposure(s)}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                        sunExposure === s 
                          ? 'bg-amber-900/40 border-amber-500 text-amber-400' 
                          : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
            </div>
            
            {/* Grid Dimensions (Square) */}
            <div className="space-y-3 pt-2 border-t border-stone-800/50">
               <div className="flex items-center justify-between">
                 <label className="text-xs font-bold uppercase text-stone-500 tracking-widest flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3" /> Grid Matrix (Square)
                 </label>
                 <span className="text-[10px] text-stone-600 italic">1 unit = 20x20cm</span>
               </div>
               
               {mode === 'edit' && (
                 <div className="bg-amber-900/10 border border-amber-900/30 rounded p-2 text-[10px] text-amber-500/80 mb-2">
                   ⚠️ Grid dimensions are fixed after sector initialization.
                 </div>
               )}

               <div className="flex gap-4 items-center">
                 <div className="flex-1 space-y-1">
                   <span className="text-[10px] text-stone-500 uppercase font-bold">Dimension</span>
                   <input 
                      type="number" 
                      min={2} 
                      max={10} 
                      value={width} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setWidth(val);
                        setHeight(val);
                      }}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg py-2 px-3 text-center text-stone-200 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={mode === 'edit'}
                   />
                 </div>
                 <div className="flex-1 flex items-center justify-center pt-5">
                    <span className="text-[10px] text-stone-600 font-bold uppercase tracking-tighter bg-stone-950 px-3 py-2 rounded-lg border border-stone-900">
                      {width} × {width} Matrix
                    </span>
                 </div>
               </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 bg-stone-950/50 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-garden-600 hover:bg-garden-500 text-stone-950 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'create' ? 'Initialize Sector' : 'Update Specs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
