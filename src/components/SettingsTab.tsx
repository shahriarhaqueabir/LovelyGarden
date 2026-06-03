import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Settings,
  Download,
  Sparkles,
  Palette,
  Cloud,
  ShieldCheck,
  User,
  Ruler,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { getDatabase } from "../db";
import { exportDatabaseToJson, downloadFile } from "../db/export-import";
import { applyTheme, applyBackgroundColor } from "../utils/theme";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { WeatherSettings } from "./WeatherSettings";
import { useAuth } from "../hooks/useAuth";
import {
  ensureCloudUserSettings,
  updateCloudUserPreferences,
} from "../services/userSettingsService";
import type { GardenExperienceLevel } from "../services/userSettingsService";
import {
  requestNotificationPermission,
  setNotificationsEnabled,
} from "../services/notificationService";
import { showSuccess, showError } from "../lib/toast";
import i18n from "../lib/i18n";
import { useTranslation } from "react-i18next";
export const SettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [accentColor, setAccentColor] = useState("#22c55e");
  const [backgroundColor, setBackgroundColor] = useState("#090c0a");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);
  const [locationCity, setLocationCity] = useState("");
  const [hemisphere, setHemisphere] = useState("North");

  // Garden Profile
  const [displayName, setDisplayName] = useState("");
  const [gardenNickname, setGardenNickname] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<GardenExperienceLevel>("beginner");
  const [hardinessZone, setHardinessZone] = useState("");
  const [growingStyle, setGrowingStyle] = useState("");
  const [preferredUnits, setPreferredUnits] = useState<"metric" | "imperial">(
    "metric",
  );
  const [gardenGoals, setGardenGoals] = useState("");

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Track initial loaded values for dirty detection
  const initialValuesRef = useRef<Record<string, unknown>>({});

  const isDirty = useMemo(() => {
    const initial = initialValuesRef.current;
    return (
      accentColor !== (initial.accentColor as string) ||
      backgroundColor !== (initial.backgroundColor as string) ||
      language !== (initial.language as string) ||
      notifications !== (initial.notifications as boolean) ||
      locationCity !== (initial.locationCity as string) ||
      hemisphere !== (initial.hemisphere as string) ||
      displayName !== (initial.displayName as string) ||
      gardenNickname !== (initial.gardenNickname as string) ||
      experienceLevel !== (initial.experienceLevel as string) ||
      hardinessZone !== (initial.hardinessZone as string) ||
      growingStyle !== (initial.growingStyle as string) ||
      preferredUnits !== (initial.preferredUnits as string) ||
      gardenGoals !== (initial.gardenGoals as string)
    );
  }, [
    accentColor,
    backgroundColor,
    language,
    notifications,
    locationCity,
    hemisphere,
    displayName,
    gardenNickname,
    experienceLevel,
    hardinessZone,
    growingStyle,
    preferredUnits,
    gardenGoals,
  ]);

  // Apply background color when it changes
  useEffect(() => {
    applyBackgroundColor(backgroundColor);
  }, [backgroundColor]);

  // Wire language changes to i18n immediately
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Auto-save settings after a debounce when any value changes
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!config) return; // don't auto-save before initial load
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accentColor,
    backgroundColor,
    language,
    notifications,
    locationCity,
    hemisphere,
    displayName,
    gardenNickname,
    experienceLevel,
    hardinessZone,
    growingStyle,
    preferredUnits,
    gardenGoals,
  ]);

  // Warn when navigating away with unsaved changes
  useEffect(() => {
    if (!config) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [config, isDirty]);

  useEffect(() => {
    const fetchSettings = async () => {
      const db = await getDatabase();
      const settings = await db.settings.findOne("local-user").exec();
      if (settings) {
        let data = settings.toJSON();
        if (user) {
          const cloudSettings = await ensureCloudUserSettings(user.id, data, {
            accentColor: localStorage.getItem("theme-color") || "#22c55e",
            backgroundColor: localStorage.getItem("bg-color") || "#090c0a",
            language: "en",
            notifications: true,
          });

          data = {
            ...data,
            firstLoadComplete: cloudSettings.firstLoadComplete,
            hemisphere: cloudSettings.hemisphere ?? data.hemisphere,
            city: cloudSettings.city ?? data.city,
            currentDay: cloudSettings.currentDay ?? data.currentDay,
            dataVersion: cloudSettings.dataVersion ?? data.dataVersion,
          };

          await db.settings.upsert({ ...data, id: "local-user" });

          if (cloudSettings.preferences?.accentColor) {
            setAccentColor(cloudSettings.preferences.accentColor);
            applyTheme(cloudSettings.preferences.accentColor);
          }
          if (cloudSettings.preferences?.backgroundColor) {
            setBackgroundColor(cloudSettings.preferences.backgroundColor);
            applyBackgroundColor(cloudSettings.preferences.backgroundColor);
          }
          if (cloudSettings.preferences?.language) {
            setLanguage(cloudSettings.preferences.language);
          }
          if (cloudSettings.preferences?.notifications !== undefined) {
            setNotifications(cloudSettings.preferences.notifications);
          }
          // Load profile from cloud
          if (cloudSettings.preferences?.profile) {
            const p = cloudSettings.preferences.profile;
            if (p.displayName) setDisplayName(p.displayName);
            if (p.gardenNickname) setGardenNickname(p.gardenNickname);
            if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
            if (p.hardinessZone) setHardinessZone(p.hardinessZone);
            if (p.growingStyle) setGrowingStyle(p.growingStyle);
            if (p.preferredUnits) setPreferredUnits(p.preferredUnits);
            if (p.gardenGoals) setGardenGoals(p.gardenGoals);
          } else {
            // Fallback to localStorage profile
            loadProfileFromLocal();
          }
        } else {
          // Load profile from localStorage for local-only users
          loadProfileFromLocal();
        }

        setConfig(data);
        setLocationCity(data.city || "");
        setHemisphere(data.hemisphere || "North");

        // Load saved colors from localStorage
        const savedAccent = localStorage.getItem("theme-color");
        if (savedAccent) {
          setAccentColor(savedAccent);
        }
        const savedBgColor = localStorage.getItem("bg-color");
        if (savedBgColor) {
          setBackgroundColor(savedBgColor);
          applyBackgroundColor(savedBgColor);
        }
      }
    };

    const loadProfileFromLocal = () => {
      try {
        const raw = localStorage.getItem("garden-profile");
        if (raw) {
          const p = JSON.parse(raw);
          if (p.displayName) setDisplayName(p.displayName);
          if (p.gardenNickname) setGardenNickname(p.gardenNickname);
          if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
          if (p.hardinessZone) setHardinessZone(p.hardinessZone);
          if (p.growingStyle) setGrowingStyle(p.growingStyle);
          if (p.preferredUnits) setPreferredUnits(p.preferredUnits);
          if (p.gardenGoals) setGardenGoals(p.gardenGoals);
        }
      } catch {
        // Ignore invalid profile data
      }
    };

    fetchSettings();
  }, [user]);

  // Persist initial values for dirty tracking after they're loaded
  useEffect(() => {
    if (config) {
      initialValuesRef.current = {
        accentColor,
        backgroundColor,
        language,
        notifications,
        locationCity,
        hemisphere,
        displayName,
        gardenNickname,
        experienceLevel,
        hardinessZone,
        growingStyle,
        preferredUnits,
        gardenGoals,
      };
    }
    // Only run when config is first set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!config]);

  const handleSave = async () => {
    try {
      const db = await getDatabase();
      const savedSettings = {
        ...config,
        id: "local-user",
        city: locationCity,
        hemisphere: hemisphere,
        firstLoadComplete: true,
      };

      await db.settings.upsert(savedSettings);

      // Save profile to localStorage
      const profile = {
        displayName,
        gardenNickname,
        experienceLevel,
        hardinessZone,
        growingStyle,
        preferredUnits,
        gardenGoals,
      };
      localStorage.setItem("garden-profile", JSON.stringify(profile));

      if (user) {
        await updateCloudUserPreferences(user.id, savedSettings, {
          accentColor,
          backgroundColor,
          language,
          notifications,
          profile,
        });
      }

      localStorage.setItem("theme-color", accentColor);
      localStorage.setItem("bg-color", backgroundColor);
      applyTheme(accentColor);
      applyBackgroundColor(backgroundColor);

      // Update initial values so dirty state resets
      initialValuesRef.current = {
        ...initialValuesRef.current,
        accentColor,
        backgroundColor,
        language,
        notifications,
        locationCity,
        hemisphere,
        displayName,
        gardenNickname,
        experienceLevel,
        hardinessZone,
        growingStyle,
        preferredUnits,
        gardenGoals,
      };

      // Show brief "Saved!" feedback instead of an alert
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2000);
    } catch (e) {
      console.error("Failed to persist configuration.", e);
    }
  };

  const handleExport = async () => {
    const json = await exportDatabaseToJson();
    const filename = `garden-deck-backup-${new Date().toISOString().split("T")[0]}.json`;
    downloadFile(json, filename, "application/json");
  };

  const handleClearCache = () => {
    if (
      confirm(
        t(
          "settings.clearCacheConfirm",
          "Clear all local data? This will reload the app.",
        ),
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!config)
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="md" label={t("common.loading")} />
      </div>
    );

  // --- Shared input classes ---
  const inputClass =
    "w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs font-bold focus:outline-none focus:border-garden-500/50 placeholder:text-stone-700";
  const labelClass =
    "block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3";

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100 uppercase tracking-tighter">
            {t("settings.title")}
          </h1>
        </div>
        <p className="text-stone-400 text-sm tracking-tight">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preferences + Profile */}
        <div className="lg:col-span-1 space-y-6">
          {/* Preferences */}
          <div className="bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
              <Palette className="w-3 h-3 text-garden-500" />{" "}
              {t("settings.preferences")}
            </h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>{t("settings.accent")}</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "#22c55e",
                    "#3b82f6",
                    "#f59e0b",
                    "#ef4444",
                    "#a855f7",
                    "#ec4899",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setAccentColor(color);
                        applyTheme(color);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        accentColor === color
                          ? "border-stone-100 scale-110 shadow-lg"
                          : "border-transparent hover:scale-105"
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
                      {t("settings.custom")}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("settings.background")}</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "#090c0a",
                    "#0c0a09",
                    "#1c1917",
                    "#0f172a",
                    "#1e293b",
                    "#000000",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        backgroundColor === color
                          ? "border-stone-100 scale-110 shadow-lg"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color} background`}
                    />
                  ))}
                  <div className="relative group">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded-full border-2 border-transparent bg-stone-900 cursor-pointer overflow-hidden p-0"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-900 text-[10px] font-bold px-2 py-1 rounded border border-stone-800 pointer-events-none">
                      {t("settings.custom")}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("settings.language")}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={inputClass}
                >
                  <option value="en">English (US)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-stone-300">
                    {t("settings.notifications")}
                  </span>
                  <span className="text-[10px] text-stone-600 uppercase font-black">
                    {t("settings.notificationsDesc")}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={async (e) => {
                      const enabled = e.target.checked;
                      if (enabled) {
                        const granted = await requestNotificationPermission();
                        if (!granted) {
                          showError(
                            "Notification permission denied. Check your browser settings.",
                          );
                          setNotifications(false);
                          setNotificationsEnabled(false);
                          return;
                        }
                        showSuccess(
                          "Notifications enabled for weather alerts.",
                        );
                      }
                      setNotifications(enabled);
                      setNotificationsEnabled(enabled);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-garden-500 peer-checked:after:bg-stone-950"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Garden Profile */}
          <div className="bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
              <User className="w-3 h-3 text-garden-500" />{" "}
              {t("settings.profile")}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.displayName")}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Gardener"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.gardenNickname")}
                </label>
                <input
                  type="text"
                  value={gardenNickname}
                  onChange={(e) => setGardenNickname(e.target.value)}
                  placeholder="My Little Eden"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.experienceLevel")}
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as GardenExperienceLevel)
                  }
                  className={inputClass}
                >
                  <option value="beginner">{t("settings.beginner")}</option>
                  <option value="learning">{t("settings.learning")}</option>
                  <option value="confident">{t("settings.confident")}</option>
                  <option value="expert">{t("settings.expert")}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.hardinessZone")}
                </label>
                <input
                  type="text"
                  value={hardinessZone}
                  onChange={(e) => setHardinessZone(e.target.value)}
                  placeholder="e.g. 7b"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.growingStyle")}
                </label>
                <input
                  type="text"
                  value={growingStyle}
                  onChange={(e) => setGrowingStyle(e.target.value)}
                  placeholder="e.g. Raised Beds, Containers"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.preferredUnits")}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreferredUnits("metric")}
                    className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      preferredUnits === "metric"
                        ? "bg-garden-500/20 border-garden-500/50 text-garden-300"
                        : "bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700"
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    {t("settings.metric")}
                  </button>
                  <button
                    onClick={() => setPreferredUnits("imperial")}
                    className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      preferredUnits === "imperial"
                        ? "bg-garden-500/20 border-garden-500/50 text-garden-300"
                        : "bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700"
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    {t("settings.imperial")}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                  {t("settings.gardenGoals")}
                </label>
                <textarea
                  value={gardenGoals}
                  onChange={(e) => setGardenGoals(e.target.value)}
                  placeholder="e.g. Grow enough tomatoes for winter sauce..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weather Location + Advanced */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather Location */}
          <div className="bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-6 flex items-center gap-2">
              <Cloud className="w-3 h-3 text-garden-500" />{" "}
              {t("settings.weatherLocation")}
            </h2>
            <div className="space-y-6">
              <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-garden-500/20 bg-garden-950/30 p-2">
                      {user ? (
                        <ShieldCheck className="h-4 w-4 text-garden-400" />
                      ) : (
                        <Cloud className="h-4 w-4 text-stone-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                        {t("settings.cloudSession")}
                      </div>
                      <div className="mt-1 text-xs font-bold text-stone-300">
                        {authLoading
                          ? t("common.loading")
                          : user
                            ? user.email
                            : t("settings.notSignedIn")}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                      user
                        ? "border-garden-500/30 bg-garden-950/30 text-garden-400"
                        : "border-stone-800 bg-stone-900 text-stone-500"
                    }`}
                  >
                    {user ? t("settings.ready") : t("settings.local")}
                  </span>
                </div>
              </div>
              <WeatherSettings />
            </div>
          </div>

          {/* Advanced / Data Management */}
          <div className="bg-stone-900 shadow-xl rounded-2xl border border-stone-800 p-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-stone-500 hover:text-stone-300 transition-colors w-full text-left"
            >
              {showAdvanced ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {t("settings.advanced")}
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-3">
                <p className="text-[10px] leading-5 text-stone-500">
                  {t("settings.exportDesc")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className="flex-1 py-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-3 h-3" /> {t("settings.export")}
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="flex-1 py-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" /> {t("settings.clearCache")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div className="mt-auto pt-6 border-t border-stone-800 flex items-center justify-end gap-4">
        {isDirty && (
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {t("settings.unsavedChanges")}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`px-10 py-3 font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95 ${
            isDirty
              ? "btn-primary text-stone-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              : "bg-stone-800 text-stone-600 cursor-not-allowed"
          }`}
        >
          {showSavedFeedback ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> {t("settings.saved")}
            </span>
          ) : (
            t("common.save")
          )}
        </button>
      </div>
    </div>
  );
};
