import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
  Sprout, 
  Calendar, 
  BookOpen, 
  Package, 
  CloudSun, 
  Settings
} from 'lucide-react';

export type TabType = 
  | 'virtual-garden'
  | 'sowing-calendar'
  | 'plant-knowledgebase'
  | 'seed-inventory'
  | 'seeds-in-hand'
  | 'weather-forecast'
  | 'settings';

interface TabsProps {
  children: React.ReactNode;
}

interface TabButtonProps {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "text-white" 
          : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab"
          className="absolute inset-0 bg-garden-600 rounded-lg shadow-md -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {icon}
      <span>{label}</span>
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('virtual-garden');

  const tabs = [
    { id: 'virtual-garden' as TabType, label: '🏡 Virtual Garden', icon: <Sprout className="w-4 h-4" /> },
    { id: 'sowing-calendar' as TabType, label: '📅 Sowing Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'plant-knowledgebase' as TabType, label: '📖 Knowledgebase', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'seed-inventory' as TabType, label: '📦 Seed Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'seeds-in-hand' as TabType, label: '🤲 Seeds in Hand', icon: <Package className="w-4 h-4" /> },
    { id: 'weather-forecast' as TabType, label: '🌈 Weather', icon: <CloudSun className="w-4 h-4" /> },
    { id: 'settings' as TabType, label: '⚙️ Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-2 bg-stone-900/50 border-b border-stone-800 flex-wrap">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          {tabs.map(tab => tab.id === activeTab && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {React.Children.toArray(children).find((child: any) => 
                React.isValidElement(child) && (child.props as { id: string }).id === activeTab
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const TabPanel: React.FC<{ id: TabType; children: React.ReactNode }> = ({ children }) => {
  return <div className="h-full">{children}</div>;
};