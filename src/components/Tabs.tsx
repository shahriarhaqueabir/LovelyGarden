import React from "react";
import { Tab } from "@headlessui/react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export type TabType =
  | "virtual-garden"
  | "sowing-calendar"
  | "plant-knowledgebase"
  | "seed-inventory"
  | "seeds-in-hand"
  | "weather-forecast"
  | "logbook"
  | "harvest"
  | "settings";

interface TabsProps {
  children: React.ReactNode;
}

interface TabButtonProps {
  id: TabType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "text-white"
          : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-button"
          className="absolute inset-0 bg-garden-600 rounded-lg shadow-md -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span>{label}</span>
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const tabs = [
    { id: "virtual-garden" as TabType, label: "🏡 Virtual Garden" },
    { id: "sowing-calendar" as TabType, label: "📅 Sowing Calendar" },
    { id: "plant-knowledgebase" as TabType, label: "📖 Knowledgebase" },
    { id: "seed-inventory" as TabType, label: "📦 Seed Vault" },
    // { id: 'seeds-in-hand' as TabType, label: '🧺 Bag' },
    { id: "weather-forecast" as TabType, label: "🌈 Weather" },
    { id: "logbook" as TabType, label: "📜 Logbook" },
    { id: "harvest" as TabType, label: "🧺 Harvest" },
    { id: "settings" as TabType, label: "⚙️ Settings" },
  ];

  const childrenArray = React.Children.toArray(children);

  // Use the native View Transitions API for smooth, hardware-accelerated tab
  // switching. Falls back to an instant state update on browsers without support.
  const handleTabChange = React.useCallback((index: number) => {
    if (typeof document.startViewTransition !== "function") {
      setSelectedIndex(index);
      return;
    }
    document.startViewTransition(() => {
      React.startTransition(() => {
        setSelectedIndex(index);
      });
    });
  }, []);

  return (
    <Tab.Group
      selectedIndex={selectedIndex}
      onChange={handleTabChange}
      className="flex flex-col h-full"
    >
      {/* Tab Navigation */}
      <Tab.List className="flex gap-1 p-2 bg-stone-900/50 border-b border-stone-800 flex-wrap">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-garden-500/50",
                selected
                  ? "text-white"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50",
              )
            }
          >
            {({ selected }) => (
              <>
                {selected && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-garden-600 rounded-lg shadow-md -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span>{tab.label}</span>
              </>
            )}
          </Tab>
        ))}
      </Tab.List>

      {/* Tab Content — view-transition-name hooks into @keyframes in index.css */}
      <Tab.Panels className="flex-1 overflow-auto relative">
        <Tab.Panel
          key={tabs[selectedIndex]?.id || selectedIndex}
          static
          className="h-full"
          style={{ viewTransitionName: "tab-content" }}
        >
          {childrenArray[selectedIndex]}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export const TabPanel: React.FC<{ id: TabType; children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="h-full">{children}</div>;
};
