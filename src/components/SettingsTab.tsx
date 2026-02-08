import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Wrench, 
  Database, 
  Globe, 
  Bug, 
  Terminal,
  Download,
  Upload,
  Sparkles,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { getDatabase } from '../db';
import { exportDatabaseToJson, importDatabaseFromJson, downloadFile } from '../db/export-import';
import { applyTheme } from '../utils/theme';

export const SettingsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'developer'>('general');
  const [config, setConfig] = useState<any>(null);
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [locationCity, setLocationCity] = useState('Dresden');
  const [hemisphere, setHemisphere] = useState('North');
  
  const [, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<{ type: string; msg: string }[]>([]);

  const addLog = (type: string, msg: string) => {
    setLogs(prev => [{ type, msg }, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const db = await getDatabase();
      const settings = await db.settings.findOne('local-user').exec();
      if (settings) {
        const data = settings.toJSON();
        setConfig(data);
        setLocationCity(data.city || 'Dresden');
        setHemisphere(data.hemisphere || 'North');
        
        /* 
        const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark';
        if (savedMode) {
          setTheme(savedMode);
          toggleThemeMode(savedMode);
        }

        const savedAccent = localStorage.getItem('theme-color');
        if (savedAccent) {
          setAccentColor(savedAccent);
        }
        */
        addLog('INFO', 'User configuration synchronized.');
      }
    };
    fetchSettings();
    addLog('INFO', 'Database initialized successfully.');
  }, []);

  const handleSave = async () => {
    try {
      const db = await getDatabase();
      await db.settings.upsert({
        ...config,
        id: 'local-user',
        city: locationCity,
        hemisphere: hemisphere,
        firstLoadComplete: true
      });
      
      localStorage.setItem('theme-color', accentColor);
      applyTheme(accentColor);
      // Logic for autoSave/notifications would go here in a real app
      
      addLog('SUCCESS', 'Configuration persisted to disk.');
      alert('Settings saved successfully!');
    } catch (e) {
      addLog('ERROR', 'Failed to persist configuration.');
      console.error(e);
    }
  };

  const handleExport = async () => {
    addLog('INFO', 'Preparing system snapshot...');
    const json = await exportDatabaseToJson();
    const filename = `garden-deck-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(json, filename, 'application/json');
    addLog('SUCCESS', 'Export complete.');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      addLog('INFO', 'Reading transmission stream...');
      const result = await importDatabaseFromJson(content);
      setImportStatus(result.message);
      addLog(result.success ? 'SUCCESS' : 'ERROR', result.message);
      
      if (result.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
    if (confirm('⚠️ FATORY RESET WARNING ⚠️\n\nThis will ERASE all gardens, plants, and progress. This action is irreversible.\n\nContinue?')) {
      addLog('WARN', 'Initiating self-destruct sequence...');
      const db = await getDatabase();
      await db.remove();
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleClearCache = () => {
    addLog('INFO', 'Flushing local buffer...');
    localStorage.clear();
    window.location.reload();
  };

  if (!config) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <Sparkles className="w-8 h-8 text-garden-500 animate-spin" />
        <span className="text-stone-500 text-sm font-mono uppercase tracking-widest">Hydrating Core...</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100 uppercase tracking-tighter">⚙️ Deck Controller</h1>
        </div>
        <p className="text-stone-400 text-sm tracking-tight">Configure your botanical command center</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-stone-800">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-6 py-2 rounded-t-lg text-[11px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'general'
              ? 'bg-stone-800 text-stone-100 border-b-2 border-garden-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            Locale
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('developer')}
          className={`px-6 py-2 rounded-t-lg text-[11px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'developer'
              ? 'bg-stone-800 text-stone-100 border-b-2 border-garden-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-3 h-3" />
            Developer
          </div>
        </button>
      </div>

      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
               <Palette className="w-3 h-3 text-garden-500" /> Preferences
            </h2>
            <div className="space-y-6">
              {/* 
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Theme Protocol</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTheme('light');
                      toggleThemeMode('light');
                    }}
                    className={`flex-1 py-3 px-3 rounded-xl border transition-all text-xs font-bold ${
                      theme === 'light'
                        ? 'bg-garden-500 text-stone-950 border-garden-400'
                        : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sun className="w-4 h-4" />
                      LIGHT
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                      toggleThemeMode('dark');
                    }}
                    className={`flex-1 py-3 px-3 rounded-xl border transition-all text-xs font-bold ${
                      theme === 'dark'
                        ? 'bg-garden-500 text-stone-950 border-garden-400'
                        : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Moon className="w-4 h-4" />
                      DARK
                    </div>
                  </button>
                </div>
              </div> 
              */}

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Botanical Accent</label>
                <div className="flex flex-wrap gap-3">
                  {['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setAccentColor(color);
                        applyTheme(color);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        accentColor === color ? 'border-stone-100 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color} accent`}
                    />
                  ))}
                  <div className="relative group">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        applyTheme(e.target.value);
                      }}
                      className="w-8 h-8 rounded-full border-2 border-transparent bg-stone-900 cursor-pointer overflow-hidden p-0"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-900 text-[10px] font-bold px-2 py-1 rounded border border-stone-800 pointer-events-none">
                      CUSTOM
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Language Lexicon</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs font-bold focus:outline-none focus:border-garden-500/50"
                >
                  <option value="en">English (US)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-stone-300">Alerts</span>
                  <span className="text-[10px] text-stone-600 uppercase font-black">Environmental Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-garden-500 peer-checked:after:bg-stone-950"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
               <MapPin className="w-3 h-3 text-garden-500" /> Environment Deployment
            </h2>
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Active City</label>
                    <input
                      type="text"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-garden-500/50"
                      placeholder="Enter city..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Hemisphere Alignment</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHemisphere('North')}
                        className={`flex-1 py-3 px-3 rounded-xl border transition-all text-xs font-bold ${
                          hemisphere === 'North'
                            ? 'bg-garden-500 text-stone-950 border-garden-400'
                            : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                        }`}
                      >
                        NORTHERN
                      </button>
                      <button
                        onClick={() => setHemisphere('South')}
                        className={`flex-1 py-3 px-3 rounded-xl border transition-all text-xs font-bold ${
                          hemisphere === 'South'
                            ? 'bg-garden-500 text-stone-950 border-garden-400'
                            : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                        }`}
                      >
                        SOUTHERN
                      </button>
                    </div>
                  </div>
               </div>

               <div className="p-4 bg-garden-900/10 border border-garden-900/20 rounded-xl">
                 <div className="flex items-start gap-4">
                   <div className="p-2 bg-garden-900/30 rounded-lg">
                      <Bug className="w-5 h-5 text-garden-500" />
                   </div>
                   <div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-garden-400 mb-1">Environmental Sync</h3>
                     <p className="text-[11px] text-stone-400 leading-relaxed">
                       Your location is used to calculate solar irradiation, moisture evaporation rates, and local planting windows (Zone 7b for Dresden).
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'developer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
               <Database className="w-3 h-3 text-garden-500" /> Data Transmission
            </h2>
            <div className="space-y-3">
               <button 
                onClick={handleExport}
                className="w-full py-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all flex items-center justify-center gap-2"
               >
                 <Download className="w-3 h-3" /> Export System JSON
               </button>
               
               <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImport} 
              />
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all flex items-center justify-center gap-2"
               >
                 <Upload className="w-3 h-3" /> Import System JSON
               </button>

               <div className="h-4" />

               <button 
                onClick={handleClearCache}
                className="w-full py-4 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all flex items-center justify-center gap-2"
               >
                 <RefreshCw className="w-3 h-3" /> Clear Cache
               </button>
               
               <button 
                onClick={handleFactoryReset}
                className="w-full py-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-all flex items-center justify-center gap-2"
               >
                 <Trash2 className="w-3 h-3" /> Factory Reset
               </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
               <Terminal className="w-3 h-3 text-garden-500" /> System Metrics
            </h2>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 shadow-inner">
                    <span className="text-[9px] font-black uppercase text-stone-600 block mb-1">Architecture</span>
                    <span className="text-xs font-bold text-stone-300">Local-First (Dexie)</span>
                  </div>
                  <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 shadow-inner">
                    <span className="text-[9px] font-black uppercase text-stone-600 block mb-1">Deck Version</span>
                    <span className="text-xs font-bold text-stone-300">0.1.0-Sim</span>
                  </div>
               </div>

               <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 shadow-inner">
                 <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                    <span className="text-[9px] font-black uppercase text-stone-500 tracking-widest flex items-center gap-2">
                       <Terminal className="w-3 h-3" /> Console Output
                    </span>
                    <span className="text-[8px] font-mono text-stone-700 uppercase">Live Transmission</span>
                 </div>
                 <div className="font-mono text-[10px] space-y-1 h-32 overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className={`w-12 shrink-0 ${log.type === 'ERROR' ? 'text-red-500' : log.type === 'WARN' ? 'text-amber-500' : log.type === 'SUCCESS' ? 'text-garden-500' : 'text-blue-500'}`}>
                          [{log.type}]
                        </span>
                        <span className="text-stone-400">{log.msg}</span>
                      </div>
                    ))}
                    <div className="text-stone-700 animate-pulse">_ Waiting for diagnostic input...</div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-stone-800 flex justify-end">
        <button 
          onClick={handleSave}
          className="px-10 py-3 bg-garden-600 hover:bg-garden-400 text-stone-950 font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// Internal palette wrapper because it's used in the code but not defined
const Palette = ({ className }: { className?: string }) => <Sparkles className={className} />;
const MapPin = ({ className }: { className?: string }) => <div className={className} />;