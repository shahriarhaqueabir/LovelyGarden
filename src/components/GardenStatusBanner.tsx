import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  CloudSun,
  ChevronDown,
  ChevronUp,
  Droplets,
  MapPin,
  RefreshCw,
  Thermometer,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { SyncStatusSnapshot } from "../services/syncStatusService";
import type { WeatherData } from "../services/weatherService";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GardenStatusBannerProps {
  weather: WeatherData | null;
  weatherLoading: boolean;
  alerts: string[];
  syncStatus: SyncStatusSnapshot;
  isOnline: boolean;
  locationName: string | null;
  onRetrySync: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const weatherLabel = (code: number): string => {
  if (code < 3) return "Sunny";
  if (code < 50) return "Cloudy";
  return "Rainy";
};

interface AlertMeta {
  icon: React.ElementType;
  severity: "critical" | "warning" | "info";
  label: string;
}

const classifyAlert = (alert: string): AlertMeta => {
  if (alert.includes("Frost"))
    return { icon: AlertTriangle, severity: "critical", label: alert };
  if (alert.includes("Storm"))
    return { icon: AlertTriangle, severity: "critical", label: alert };
  if (alert.includes("Heat Wave"))
    return { icon: AlertTriangle, severity: "warning", label: alert };
  if (alert.includes("Drought"))
    return { icon: AlertTriangle, severity: "warning", label: alert };
  if (alert.includes("Cold Snap"))
    return { icon: AlertTriangle, severity: "warning", label: alert };
  if (alert.includes("Heavy Rain"))
    return { icon: AlertTriangle, severity: "warning", label: alert };
  if (alert.includes("Normal"))
    return { icon: CheckCircle2, severity: "info", label: "All clear" };
  return { icon: AlertTriangle, severity: "info", label: alert };
};

const severityStyles: Record<string, string> = {
  critical: "border-red-500/30 bg-red-950/25 text-red-200",
  warning: "border-amber-500/25 bg-amber-950/20 text-amber-200",
  info: "border-garden-500/20 bg-garden-950/15 text-garden-300",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const GardenStatusBanner: React.FC<GardenStatusBannerProps> = ({
  weather,
  weatherLoading,
  alerts,
  syncStatus,
  isOnline,
  locationName,
  onRetrySync,
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeAlerts = alerts.filter(
    (a) => !a.includes("Normal") && !a.includes("✅"),
  );
  const hasAlerts = activeAlerts.length > 0;
  const allClear = alerts.length === 1 && alerts[0].includes("Normal");
  // Sync display
  const syncColor =
    syncStatus.state === "error"
      ? "text-red-400"
      : isOnline
        ? "text-garden-400"
        : "text-amber-400";
  const SyncIcon = syncStatus.state === "error" || !isOnline ? CloudOff : Cloud;

  // Weather condition row (always visible)
  const conditionRow = (
    <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider min-w-0">
      {/* Weather */}
      {weather ? (
        <>
          <div className="flex items-center gap-1.5 shrink-0" title="Condition">
            <CloudSun className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-stone-300">
              {weatherLabel(weather.current.weather_code)}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 shrink-0"
            title="Temperature"
          >
            <Thermometer className="h-3.5 w-3.5 text-pink-300" />
            <span className="text-stone-300">
              {weather.current.temperature_2m}°C
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" title="Humidity">
            <Droplets className="h-3.5 w-3.5 text-blue-300" />
            <span className="text-stone-300">
              {weather.current.relative_humidity_2m}%
            </span>
          </div>
        </>
      ) : weatherLoading ? (
        <span className="text-stone-500 italic">Loading weather…</span>
      ) : (
        <span className="text-stone-600 italic">Weather unavailable</span>
      )}

      {/* Location */}
      {locationName && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-stone-400">
          <MapPin className="h-3 w-3 text-red-300" />
          <span className="truncate max-w-28">{locationName}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-2" />

      {/* Sync status */}
      {syncStatus.state !== "idle" && (
        <div
          className="flex items-center gap-1.5 shrink-0"
          title={syncStatus.message}
        >
          <SyncIcon className={`h-3.5 w-3.5 ${syncColor}`} />
          <span className={`hidden sm:inline ${syncColor}`}>
            {syncStatus.state === "error"
              ? "Sync error"
              : syncStatus.state === "syncing"
                ? "Syncing…"
                : isOnline
                  ? "Online"
                  : "Offline"}
          </span>
          {syncStatus.pendingLocalCount > 0 && (
            <button
              type="button"
              onClick={onRetrySync}
              disabled={!isOnline || syncStatus.state === "syncing"}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/20 bg-black/10 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title={isOnline ? "Retry sync" : "Offline — retry when connected"}
              aria-label="Retry sync"
            >
              <RefreshCw
                className={`h-2.5 w-2.5 ${syncStatus.state === "syncing" ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      )}

      {/* Expand toggle (mobile/tablet) */}
      {(hasAlerts || !allClear) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex lg:hidden items-center gap-1 text-stone-500 hover:text-stone-300 shrink-0"
          aria-label={expanded ? "Collapse alerts" : "Expand alerts"}
        >
          <span className="text-[10px] font-bold">
            {hasAlerts ? activeAlerts.length : 0}
          </span>
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );

  // Alerts row (expandable on < lg, always visible on lg+)
  const alertsRow =
    hasAlerts || !allClear ? (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800/60",
          "max-lg:overflow-hidden transition-all duration-200",
          expanded
            ? "max-lg:max-h-40"
            : "max-lg:max-h-0 max-lg:pt-0 max-lg:border-transparent",
          "lg:max-h-none",
        )}
      >
        {hasAlerts ? (
          activeAlerts.map((alert, i) => {
            const meta = classifyAlert(alert);
            const Icon = meta.icon;
            return (
              <div
                key={i}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  severityStyles[meta.severity],
                )}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-56">{meta.label}</span>
              </div>
            );
          })
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-garden-500/20 bg-garden-950/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-garden-400">
            <CheckCircle2 className="h-3 w-3" />
            Conditions normal
          </div>
        )}
      </div>
    ) : null;

  return (
    <div
      className={cn(
        "border-b border-stone-800/60 bg-stone-950/90 px-3 py-2 text-stone-400 backdrop-blur-sm",
        "sm:px-5",
      )}
    >
      {/* Row 1 — Conditions */}
      {conditionRow}

      {/* Row 2 — Alerts */}
      {alertsRow}
    </div>
  );
};
