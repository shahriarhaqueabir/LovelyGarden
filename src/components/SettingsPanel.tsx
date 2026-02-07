import React, { useState, useEffect } from 'react';
import { Settings, X, Globe, MapPin } from 'lucide-react';
import { getDatabase } from '../db';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const db = await getDatabase();
      const settings = await db.settings.findOne('local-user').exec();
      if (settings) setConfig(settings.toJSON());
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const db = await getDatabase();
    await db.settings.upsert({
      ...config,
      [key]: value
    });
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-stone-400" />
            <h2 className="text-xl font-bold text-stone-100">Almanac Settings</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hemisphere */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-stone-400">
              <Globe className="w-4 h-4" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-500">Hemisphere</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateSetting('hemisphere', 'North')}
                className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                  config.hemisphere === 'North' 
                  ? 'bg-garden-900/30 border-garden-500 text-garden-400' 
                  : 'bg-stone-800/40 border-stone-700 text-stone-500 hover:border-stone-600'
                }`}
              >
                Northern
              </button>
              <button 
                onClick={() => updateSetting('hemisphere', 'South')}
                className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                  config.hemisphere === 'South' 
                  ? 'bg-garden-900/30 border-garden-500 text-garden-400' 
                  : 'bg-stone-800/40 border-stone-700 text-stone-500 hover:border-stone-600'
                }`}
              >
                Southern
              </button>
            </div>
          </section>

          {/* Location */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-stone-400">
              <MapPin className="w-4 h-4" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-500">Garden City</h3>
            </div>
            <input 
              type="text" 
              value={config.city} 
              onChange={(e) => updateSetting('city', e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-garden-500/50 transition-colors"
              placeholder="e.g. San Francisco"
            />
          </section>

          <p className="text-[10px] text-stone-600 italic leading-relaxed">
            Changing these settings will adjust sowing windows and seasonal recommendations across your grimoire.
          </p>
        </div>

        <div className="p-6 bg-stone-950/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
