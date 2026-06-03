import React from "react";
import { Tab } from "@headlessui/react";
import { motion } from "motion/react";
import {
  BookOpen,
  CalendarDays,
  CloudSun,
  Flower2,
  Home,
  NotebookTabs,
  Settings,
  Sprout,
  UserRound,
} from "lucide-react";
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
  selectedIndex?: number;
  onTabChange?: (index: number) => void;
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

export const Tabs: React.FC<TabsProps> = ({
  children,
  selectedIndex: controlledIndex,
  onTabChange,
}) => {
  const isControlled = controlledIndex !== undefined;
  const [internalIndex, setInternalIndex] = React.useState(0);
  const selectedIndex = isControlled ? controlledIndex : internalIndex;

  // Mobile tab bar auto-hide on scroll
  const [tabBarVisible, setTabBarVisible] = React.useState(true);
  const lastScrollYRef = React.useRef(0);

  const tabs = [
    {
      id: "virtual-garden" as TabType,
      label: "Virtual Garden",
      short: "Garden",
      icon: Home,
    },
    {
      id: "profile" as TabType,
      label: "Profile",
      short: "Profile",
      icon: UserRound,
    },
    {
      id: "sowing-calendar" as TabType,
      label: "Sowing Calendar",
      short: "Sow",
      icon: CalendarDays,
    },
    {
      id: "plant-knowledgebase" as TabType,
      label: "Knowledgebase",
      short: "Plants",
      icon: BookOpen,
    },
    {
      id: "seed-inventory" as TabType,
      label: "Seed Vault",
      short: "Seeds",
      icon: Sprout,
    },
    {
      id: "weather-forecast" as TabType,
      label: "Weather",
      short: "Weather",
      icon: CloudSun,
    },
    {
      id: "logbook" as TabType,
      label: "Logbook",
      short: "Log",
      icon: NotebookTabs,
    },
    {
      id: "harvest" as TabType,
      label: "Harvest",
      short: "Harvest",
      icon: Flower2,
    },
    {
      id: "settings" as TabType,
      label: "Settings",
      short: "Settings",
      icon: Settings,
    },
  ];

  const childrenArray = React.Children.toArray(children);

  // Use the native View Transitions API for smooth, hardware-accelerated tab
  // switching. Falls back to an instant state update on browsers without support.
  const handleTabChange = React.useCallback(
    (index: number) => {
      const update = () => {
        if (isControlled) {
          onTabChange?.(index);
        } else {
          setInternalIndex(index);
        }
      };
      if (typeof document.startViewTransition !== "function") {
        update();
        return;
      }
      document.startViewTransition(() => {
        React.startTransition(() => {
          update();
        });
      });
    },
    [isControlled, onTabChange],
  );

  // Track scroll position on the panels container to auto-hide mobile tab bar
  const panelsRef = React.useRef<HTMLDivElement>(null);
  const handlePanelsScroll = React.useCallback(() => {
    const el = panelsRef.current;
    if (!el) return;
    const currentY = el.scrollTop;
    const diff = currentY - lastScrollYRef.current;

    if (currentY <= 0) {
      setTabBarVisible(true);
    } else if (diff > 5) {
      // Scrolling down
      setTabBarVisible(false);
    } else if (diff < -5) {
      // Scrolling up
      setTabBarVisible(true);
    }
    lastScrollYRef.current = currentY;
  }, []);

  return (
    <Tab.Group
      selectedIndex={selectedIndex}
      onChange={handleTabChange}
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Tab Navigation */}
      <Tab.List
        className={cn(
          "app-tab-list fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto overflow-y-hidden border-t border-stone-800 bg-stone-950/95 p-2 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur no-scrollbar transition-transform duration-300 ease-in-out lg:static lg:flex-wrap lg:border-b lg:border-t-0 lg:bg-stone-900/50 lg:shadow-none lg:translate-y-0",
          tabBarVisible ? "translate-y-0" : "translate-y-full lg:translate-y-0",
        )}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              cn(
                "relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-garden-500/50 lg:min-w-0 lg:flex-none lg:gap-2 lg:px-4 lg:text-sm lg:font-medium",
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
                <tab.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selected ? "text-white" : "text-stone-500",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn("lg:hidden", selected ? "inline" : "sr-only")}
                >
                  {tab.short}
                </span>
                <span className="hidden lg:inline">{tab.label}</span>
              </>
            )}
          </Tab>
        ))}
      </Tab.List>

      {/* Tab Content — view-transition-name hooks into @keyframes in index.css */}
      <Tab.Panels
        ref={panelsRef}
        onScroll={handlePanelsScroll}
        className={cn(
          "app-tab-panels relative min-h-0 flex-1 overflow-auto transition-all duration-300",
          tabBarVisible ? "pb-[4.5rem]" : "pb-0",
          "lg:pb-0",
        )}
      >
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
