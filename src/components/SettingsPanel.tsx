import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, MapPin, Palette, Database, Upload, FileType, FileJson } from 'lucide-react';
import { getDatabase } from '../db';
import { applyTheme } from '../utils/theme';
import { exportDatabaseToJson, exportCollectionToCsv, importDatabaseFromJson, downloadFile } from '../db/export-import';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [config, setConfig] = useState<any>(null);
  const [primaryColor, setPrimaryColor] = useState('#22c55e'); // Default garden green
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const db = await getDatabase();
      const settings = await db.settings.findOne('local-user').exec();
      if (settings) setConfig(settings.toJSON());
      
      const savedColor = localStorage.getItem('theme-color');
      if (savedColor) {
        setPrimaryColor(savedColor);
        applyTheme(savedColor);
      }
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

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPrimaryColor(color);
    applyTheme(color);
    localStorage.setItem('theme-color', color);
  };

  const handleExportJson = async () => {
    try {
      const json = await exportDatabaseToJson();
      const filename = `raidas-garden-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(json, filename, 'application/json');
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await exportCollectionToCsv('inventory');
      const filename = `raidas-garden-inventory-${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csv, filename, 'text/csv');
    } catch (error) {
      console.error('CSV Export failed', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setImportStatus('Importing...');
      const result = await importDatabaseFromJson(content);
      setImportStatus(result.message);
      setTimeout(() => setImportStatus(null), 3000);
      if (result.success) {
         // Refresh settings local state if needed
         const db = await getDatabase();
         const settings = await db.settings.findOne('local-user').exec();
         if (settings) setConfig(settings.toJSON());
      }
    };
    reader.readAsText(file);
  };

  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-stone-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-stone-400" />
            <h2 className="text-xl font-bold text-stone-100">Almanac Settings</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* THEME CUSTOMIZATION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400 pb-2 border-b border-stone-800/50">
              <Palette className="w-4 h-4" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-500">Theme Aesthetics</h3>
            </div>
            
            <div className="flex items-center justify-between bg-stone-950 p-4 rounded-xl border border-stone-800">
               <div className="flex flex-col gap-1">
                 <span className="text-sm font-bold text-stone-300">Primary Accent</span>
                 <span className="text-xs text-stone-600">Re-tints the entire interface</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-stone-700 shadow-inner" style={{ backgroundColor: primaryColor }}></div>
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={handleColorChange}
                    className="w-8 h-8 opacity-0 absolute cursor-pointer"
                    title="Choose customized color"
                  />
                  <button className="px-3 py-1.5 bg-stone-800 rounded-lg text-xs font-bold text-stone-400 hover:bg-stone-700 pointer-events-none relative">
                    Customize
                    {/* Overlay input on top for better styling control or use label */}
                    <input 
                      type="color" 
                      value={primaryColor}
                      onChange={handleColorChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </button>
               </div>
            </div>
          </section>


          {/* Location Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400 pb-2 border-b border-stone-800/50">
              <MapPin className="w-4 h-4" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-500">Locale & Environment</h3>
            </div>
            
             <div className="space-y-3">
               <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                 <span>Hemisphere</span>
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
            </div>

            <div className="space-y-2">
               <label className="text-xs text-stone-500">Garden City</label>
               <input 
                type="text" 
                value={config.city} 
                onChange={(e) => updateSetting('city', e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-garden-500/50 transition-colors"
                placeholder="e.g. San Francisco"
              />
            </div>
          </section>


          {/* Data Governance */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400 pb-2 border-b border-stone-800/50">
              <Database className="w-4 h-4" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-500">Data Governance</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExportJson}
                className="p-3 bg-stone-900/50 border border-stone-800 hover:border-stone-600 rounded-xl flex flex-col items-center gap-2 group transition-all"
              >
                <FileJson className="w-6 h-6 text-stone-600 group-hover:text-garden-500 transition-colors" />
                <span className="text-xs font-bold text-stone-400">Backup JSON</span>
              </button>
              
              <button 
                onClick={handleExportCsv}
                className="p-3 bg-stone-900/50 border border-stone-800 hover:border-stone-600 rounded-xl flex flex-col items-center gap-2 group transition-all"
              >
                <FileType className="w-6 h-6 text-stone-600 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-stone-400">Export CSV</span>
              </button>
            </div>

            <div className="pt-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImport} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-stone-800 border border-stone-700 hover:bg-stone-700 hover:border-stone-600 text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Restore from Backup
              </button>
              {importStatus && (
                 <p className={`text-center text-[10px] mt-2 font-bold ${importStatus.includes('success') ? 'text-garden-500' : 'text-stone-500'}`}>
                   {importStatus}
                 </p>
              )}
            </div>
          </section>

          <p className="text-[10px] text-stone-600 italic leading-relaxed pt-4 border-t border-stone-900">
            Raida's Garden v0.1.0 • Local-First Architecture
          </p>
        </div>
      </div>
    </div>
  );
};
