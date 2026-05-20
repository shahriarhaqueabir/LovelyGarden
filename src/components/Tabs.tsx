import React from "react";
import { Tab } from "@headlessui/react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export type TabType =
  | "virtual-garden"
  | "profile"
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
    {
      id: "virtual-garden" as TabType,
      label: "🏡 Virtual Garden",
      short: "Garden",
    },
    {
      id: "profile" as TabType,
      label: "👤 Profile",
      short: "Profile",
    },
    {
      id: "sowing-calendar" as TabType,
      label: "📅 Sowing Calendar",
      short: "Sow",
    },
    {
      id: "plant-knowledgebase" as TabType,
      label: "📖 Knowledgebase",
      short: "Plants",
    },
    { id: "seed-inventory" as TabType, label: "📦 Seed Vault", short: "Seeds" },
    // { id: 'seeds-in-hand' as TabType, label: '🧺 Bag' },
    {
      id: "weather-forecast" as TabType,
      label: "🌈 Weather",
      short: "Weather",
    },
    { id: "logbook" as TabType, label: "📜 Logbook", short: "Log" },
    { id: "harvest" as TabType, label: "🧺 Harvest", short: "Harvest" },
    { id: "settings" as TabType, label: "⚙️ Settings", short: "Settings" },
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
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Tab Navigation */}
      <Tab.List className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t border-stone-800 bg-stone-950/95 p-2 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur lg:static lg:flex-wrap lg:border-b lg:border-t-0 lg:bg-stone-900/50 lg:shadow-none">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              cn(
                "relative flex min-w-[4.5rem] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-garden-500/50 lg:min-w-0 lg:flex-none lg:px-4 lg:text-sm lg:font-medium",
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
                <span className="lg:hidden">{tab.short}</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </>
            )}
          </Tab>
        ))}
      </Tab.List>

      {/* Tab Content — view-transition-name hooks into @keyframes in index.css */}
      <Tab.Panels className="relative min-h-0 flex-1 overflow-auto pb-[4.5rem] lg:pb-0">
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
