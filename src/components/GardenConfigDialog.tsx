
import React from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Sprout, LayoutGrid, Sun, Droplets } from 'lucide-react';


interface GardenConfigDialogProps {
  onClose: () => void;
  onSave: (config: GardenConfig) => void;
  initialConfig?: GardenConfig | null;
  mode: 'create' | 'edit';
  isGardenEmpty?: boolean;
}


export interface GardenConfig {
  id?: string;
  name: string;
  type: string;
  soilType: string;
  sunExposure: string;
  gridWidth: number;
  gridHeight: number;
  backgroundColor?: string;
  theme?: string;
}

const GARDEN_TYPES = ['In-ground', 'Raised Bed', 'Container', 'Greenhouse'];
const SOIL_TYPES = ['Loam', 'Clay', 'Sandy', 'Custom Mix'];
const SUN_EXPOSURE = ['Full Sun', 'Partial Shade', 'Full Shade'];

const BIOMES = [
  { id: 'forest', name: 'Forest', color: '#14532d' },
  { id: 'midnight', name: 'Midnight', color: '#1e1b4b' },
  { id: 'moss_manor', name: 'Moss Manor', color: '#1a3c22' },
  { id: 'sky_haven', name: 'Sky Haven', color: '#0c2e4d' },
  { id: 'twilight_cabin', name: 'Twilight Cabin', color: '#2d334a' },
  { id: 'autumn_villa', name: 'Autumn Villa', color: '#4d0a0a' },
  { id: 'oasis', name: 'Oasis', color: '#064e3b' },
];

// Zod schema for form validation
const gardenConfigSchema = z.object({
  name: z.string().min(1, 'Garden name is required').max(50, 'Name must be 50 characters or less'),
  type: z.string(),
  soilType: z.string(),
  sunExposure: z.string(),
  gridWidth: z.number().min(1).max(10),
  gridHeight: z.number().min(1).max(10),
});

type GardenConfigFormData = z.infer<typeof gardenConfigSchema>;

export const GardenConfigDialog: React.FC<GardenConfigDialogProps> = ({ onClose, onSave, initialConfig, mode, isGardenEmpty }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GardenConfigFormData>({
    resolver: zodResolver(gardenConfigSchema),
    defaultValues: {
      name: initialConfig?.name || '',
      type: initialConfig?.type || GARDEN_TYPES[0],
      soilType: initialConfig?.soilType || SOIL_TYPES[0],
      sunExposure: initialConfig?.sunExposure || SUN_EXPOSURE[0],
      gridWidth: initialConfig?.gridWidth || 4,
      gridHeight: initialConfig?.gridHeight || 4,
    },
  });

  const sunExposure = watch('sunExposure');

  const onSubmit = (data: GardenConfigFormData) => {
    onSave({
      id: initialConfig?.id,
      ...data,
      backgroundColor: BIOMES[0].color,
      theme: BIOMES[0].id
    });
    onClose();
  };


  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="p-6 border-b border-stone-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-garden-500" />
                <Dialog.Title className="text-xl font-bold text-stone-100">
                  {mode === 'create' ? 'Establish New Garden' : 'Configure Garden'}
                </Dialog.Title>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="text-stone-500 hover:text-stone-300"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-500 tracking-widest">Designation</label>
                <input
                  {...register('name')}
                  placeholder="e.g. South Terrace, Herb Spiral..."
                  className={`w-full bg-stone-950 border rounded-xl px-4 py-3 text-sm text-stone-200 focus:border-garden-500 outline-none transition-colors ${
                    errors.name ? 'border-red-500' : 'border-stone-800'
                  }`}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-stone-500 tracking-widest flex items-center gap-2">
                     Type
                  </label>
                  <select
                    {...register('type')}
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
                    {...register('soilType')}
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
                        onClick={() => setValue('sunExposure', s)}
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
              
              {/* Grid Dimensions */}
              <div className="space-y-3 pt-2 border-t border-stone-800/50">
                 <div className="flex items-center justify-between">
                   <label className="text-xs font-bold uppercase text-stone-500 tracking-widest flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" /> Grid Matrix
                   </label>
                   <span className="text-[10px] text-stone-600 italic">1 unit = 20x20cm</span>
                 </div>
                 
                 {(mode === 'edit' && !isGardenEmpty) && (
                   <div className="bg-amber-900/10 border border-amber-900/30 rounded p-2 text-[10px] text-amber-500/80 mb-2">
                     ⚠️ Grid dimensions are fixed while plants are present to preserve spatial coordinates.
                   </div>
                 )}

                 <div className="flex gap-4 items-center">
                   <div className="flex-1 space-y-1">
                     <span className="text-[10px] text-stone-500 uppercase font-bold">Width (Cols)</span>
                      <input 
                         type="number" 
                         min={1}
                         max={10}
                         {...register('gridWidth', { valueAsNumber: true })}
                         disabled={mode === 'edit' && !isGardenEmpty}
                         className="w-full bg-stone-950 border border-stone-800 rounded-lg py-2 px-3 text-center text-stone-200 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                   </div>
                   <span className="text-stone-600 font-bold">×</span>
                   <div className="flex-1 space-y-1">
                     <span className="text-[10px] text-stone-500 uppercase font-bold">Height (Rows)</span>
                      <input 
                         type="number" 
                         min={1}
                         max={10}
                         {...register('gridHeight', { valueAsNumber: true })}
                         disabled={mode === 'edit' && !isGardenEmpty}
                         className="w-full bg-stone-950 border border-stone-800 rounded-lg py-2 px-3 text-center text-stone-200 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      />
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
                disabled={isSubmitting}
                className="px-6 py-2 bg-garden-600 hover:bg-garden-500 text-stone-950 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === 'create' ? 'Initialize Sector' : 'Update Specs'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

};
