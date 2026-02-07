import React, { useState } from 'react';
import { 
  Settings, 
  Wrench, 
  Database, 
  Globe, 
  Moon, 
  Sun, 
  Bug, 
  Terminal 
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'developer'>('general');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">⚙️ Settings</h1>
        </div>
        <p className="text-stone-400 text-sm">Configure your garden deck experience</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-stone-800">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
            activeSubTab === 'general'
              ? 'bg-stone-800 text-stone-100 border-b-2 border-garden-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            🌍 General
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('developer')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
            activeSubTab === 'developer'
              ? 'bg-stone-800 text-stone-100 border-b-2 border-garden-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            🛠️ Developer Tools
          </div>
        </button>
      </div>

      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
            <h2 className="text-lg font-bold text-stone-100 mb-4">🎨 Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Theme</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      theme === 'light'
                        ? 'bg-stone-700 border-stone-600 text-stone-100'
                        : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-stone-700 border-stone-600 text-stone-100'
                        : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
                >
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-300">Notifications</div>
                  <div className="text-xs text-stone-500">Receive alerts for garden events</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-garden-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-300">Auto Save</div>
                  <div className="text-xs text-stone-500">Automatically save your progress</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-garden-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
            <h2 className="text-lg font-bold text-stone-100 mb-4">👤 Account Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-stone-800/30 rounded-xl">
                <h3 className="font-bold text-stone-100 mb-2">Profile Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-stone-400 mb-1">Username</label>
                    <input
                      type="text"
                      defaultValue="gardener_pro"
                      className="w-full p-2 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-400 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue="gardener@example.com"
                      className="w-full p-2 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-800/30 rounded-xl">
                <h3 className="font-bold text-stone-100 mb-2">Garden Location</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-stone-400 mb-1">Country</label>
                      <select className="w-full p-2 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500">
                        <option>Germany</option>
                        <option>United States</option>
                        <option>Canada</option>
                        <option>United Kingdom</option>
                        <option>France</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-stone-400 mb-1">Region</label>
                      <select className="w-full p-2 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500">
                        <option>Saxony</option>
                        <option>Brandenburg</option>
                        <option>Baden-Württemberg</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-stone-400 mb-1">City</label>
                    <input
                      type="text"
                      defaultValue="Dresden"
                      className="w-full p-2 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'developer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
            <h2 className="text-lg font-bold text-stone-100 mb-4">🛠️ Developer Tools</h2>
            <div className="space-y-4">
              <div className="p-4 bg-stone-800/30 rounded-xl">
                <h3 className="font-bold text-stone-100 mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database
                </h3>
                <div className="space-y-2">
                  <button className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors">
                    Export Data
                  </button>
                  <button className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors">
                    Import Data
                  </button>
                  <button className="w-full py-2 bg-red-900/30 hover:bg-red-800/40 rounded-lg text-sm transition-colors text-red-400">
                    Reset Database
                  </button>
                </div>
              </div>

              <div className="p-4 bg-stone-800/30 rounded-xl">
                <h3 className="font-bold text-stone-100 mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug
                </h3>
                <div className="space-y-2">
                  <button className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors">
                    Enable Debug Mode
                  </button>
                  <button className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors">
                    View Logs
                  </button>
                  <button className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors">
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
            <h2 className="text-lg font-bold text-stone-100 mb-4">🖥️ System Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-800/30 rounded-xl">
                  <h3 className="font-bold text-stone-100 mb-2">Application</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Version:</span>
                      <span className="text-stone-200">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Build:</span>
                      <span className="text-stone-200">20260207</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Environment:</span>
                      <span className="text-stone-200">Development</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-800/30 rounded-xl">
                  <h3 className="font-bold text-stone-100 mb-2">Runtime</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Platform:</span>
                      <span className="text-stone-200">Web</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Framework:</span>
                      <span className="text-stone-200">React 18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Database:</span>
                      <span className="text-stone-200">RxDB + Dexie</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-800/30 rounded-xl">
                <h3 className="font-bold text-stone-100 mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Console
                </h3>
                <div className="bg-stone-900/50 rounded-lg p-4 h-40 overflow-y-auto font-mono text-xs">
                  <div className="text-green-400">$ Starting Garden Deck application...</div>
                  <div className="text-blue-400">[INFO] Database initialized successfully</div>
                  <div className="text-blue-400">[INFO] Hydration complete</div>
                  <div className="text-yellow-400">[WARN] No weather API configured, using mock data</div>
                  <div className="text-green-400">[INFO] Application ready</div>
                  <div className="text-stone-500"># Waiting for input...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-stone-800 flex justify-end">
        <button className="px-6 py-2 bg-garden-600 hover:bg-garden-500 text-stone-950 font-bold rounded-lg text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95">
          💾 Save Changes
        </button>
      </div>
    </div>
  );
};