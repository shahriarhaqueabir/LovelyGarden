import React from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import type { PlantSpecies } from "../schema/knowledge-graph";
import type { WeatherData } from "../services/weatherService";
import { buildGardenCoachContext } from "../ai/buildGardenContext";
import {
  generateGardenGuideInsights,
  type GardenGuideInsight,
  type GardenGuideSeverity,
  type GardenGuideWindow,
} from "../assistant/gardenGuideRules";

interface GardenGuideSheetProps {
  catalog: PlantSpecies[];
  currentDay: number;
  hemisphere: "North" | "South";
  weather: WeatherData | null;
  locationName: string | null;
  aiEnabled: boolean;
  onClose: () => void;
  onOpenGeminiCoach: () => void;
}

const windowConfig: Record<
  GardenGuideWindow,
  { label: string; icon: React.ElementType }
> = {
  past: { label: "Past", icon: History },
  present: { label: "Now", icon: Clock3 },
  future: { label: "Next", icon: CalendarClock },
};

const severityStyles: Record<
  GardenGuideSeverity,
  { badge: string; border: string; icon: React.ElementType }
> = {
  urgent: {
    badge: "bg-red-500/15 text-red-200 border-red-500/30",
    border: "border-red-500/40 bg-red-950/20",
    icon: AlertTriangle,
  },
  warning: {
    badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    border: "border-amber-500/30 bg-amber-950/10",
    icon: AlertTriangle,
  },
  good: {
    badge: "bg-garden-500/15 text-garden-200 border-garden-500/30",
    border: "border-garden-500/30 bg-garden-950/10",
    icon: CheckCircle2,
  },
  info: {
    badge: "bg-stone-800 text-stone-300 border-stone-700",
    border: "border-stone-800 bg-stone-900/70",
    icon: BookOpenCheck,
  },
};

const insightMatchesWindow = (
  insight: GardenGuideInsight,
  activeWindow: GardenGuideWindow | "all",
) => activeWindow === "all" || insight.window === activeWindow;

export const GardenGuideSheet: React.FC<GardenGuideSheetProps> = ({
  catalog,
  currentDay,
  hemisphere,
  weather,
  locationName,
  aiEnabled,
  onClose,
  onOpenGeminiCoach,
}) => {
  const [activeWindow, setActiveWindow] = React.useState<
    GardenGuideWindow | "all"
  >("all");
  const [insights, setInsights] = React.useState<GardenGuideInsight[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshInsights = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const context = await buildGardenCoachContext({
        catalog,
        currentDay,
        hemisphere,
        weather,
        locationName,
      });
      setInsights(generateGardenGuideInsights(context));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Garden Guide could not read garden context.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [catalog, currentDay, hemisphere, locationName, weather]);

  React.useEffect(() => {
    void refreshInsights();
  }, [refreshInsights]);

  const filteredInsights = React.useMemo(
    () =>
      insights.filter((insight) => insightMatchesWindow(insight, activeWindow)),
    [activeWindow, insights],
  );

  const counts = React.useMemo(
    () => ({
      all: insights.length,
      past: insights.filter((insight) => insight.window === "past").length,
      present: insights.filter((insight) => insight.window === "present")
        .length,
      future: insights.filter((insight) => insight.window === "future").length,
    }),
    [insights],
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="garden-guide-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close Garden Guide"
        onClick={onClose}
      />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] min-h-[70dvh] flex-col overflow-hidden rounded-t-2xl border border-stone-800 bg-stone-950 shadow-2xl lg:inset-y-4 lg:left-auto lg:right-4 lg:w-[420px] lg:max-h-none lg:rounded-2xl">
        <header className="border-b border-stone-800 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950/70 text-garden-300">
                <BookOpenCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2
                  id="garden-guide-title"
                  className="truncate text-sm font-black uppercase tracking-wide text-garden-300"
                >
                  Garden Guide
                </h2>
                <p className="truncate text-[11px] font-bold text-stone-500">
                  {aiEnabled
                    ? "Rule guide with AI available"
                    : "Rule-based care, no API key needed"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 hover:border-red-500/40 hover:text-red-300"
              aria-label="Close Garden Guide"
              title="Close Garden Guide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {(["all", "past", "present", "future"] as const).map((window) => {
              const Icon =
                window === "all" ? BookOpenCheck : windowConfig[window].icon;
              const label =
                window === "all" ? "All" : windowConfig[window].label;
              return (
                <button
                  key={window}
                  type="button"
                  onClick={() => setActiveWindow(window)}
                  className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg border text-[10px] font-black uppercase tracking-wide ${
                    activeWindow === window
                      ? "border-garden-500/40 bg-garden-950/40 text-garden-200"
                      : "border-stone-800 bg-stone-900 text-stone-500"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>
                    {label} {counts[window]}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="h-6 w-6 animate-spin text-garden-400" />
              <p className="text-xs font-black uppercase tracking-widest">
                Reading garden signals
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4 text-sm text-stone-400">
                {insights.length === 0
                  ? "No garden signals yet. Start with one garden action and the guide will begin building care cards."
                  : "No guide cards in this window yet. Try All, or refresh after your next garden action."}
              </div>
              {insights.length === 0 && (
                <div className="grid gap-2">
                  {[
                    "Add seeds to your bag",
                    "Create or open a garden sector",
                    "Place one in-season seed",
                    "Log the next watering or harvest",
                  ].map((action) => (
                    <div
                      key={action}
                      className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/70 px-3 py-2 text-xs font-bold text-stone-300"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-garden-400" />
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInsights.map((insight) => {
                const style = severityStyles[insight.severity];
                const SeverityIcon = style.icon;
                const WindowIcon = windowConfig[insight.window].icon;

                return (
                  <article
                    key={insight.id}
                    className={`rounded-xl border p-3 ${style.border}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${style.badge}`}
                          >
                            <SeverityIcon className="h-3 w-3" />
                            {insight.severity}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-stone-800 bg-stone-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-stone-500">
                            <WindowIcon className="h-3 w-3" />
                            {windowConfig[insight.window].label}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-stone-100">
                          {insight.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-stone-300">
                      {insight.body}
                    </p>
                    {insight.evidence.length > 0 && (
                      <div className="mt-3 rounded-lg border border-stone-800 bg-stone-950/70 p-2">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-stone-600">
                          Why
                        </p>
                        <ul className="space-y-1">
                          {insight.evidence.slice(0, 4).map((item) => (
                            <li
                              key={item}
                              className="text-xs leading-5 text-stone-400"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.action && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-stone-950/60 p-2 text-xs font-semibold leading-5 text-garden-200">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{insight.action}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="border-t border-stone-800 bg-stone-950 px-4 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refreshInsights()}
              className="h-11 flex-1 rounded-lg border border-stone-800 bg-stone-900 px-4 text-xs font-black uppercase tracking-widest text-stone-300 hover:border-garden-500/40 hover:text-garden-200"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onOpenGeminiCoach}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-garden-500 px-4 text-xs font-black uppercase tracking-widest text-stone-950 hover:bg-garden-400"
            >
              <Sparkles className="h-4 w-4" />
              {aiEnabled ? "Ask AI" : "Add AI Key"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
