import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { hydrateDatabase, getDatabase, setDatabaseOwnerScope } from "./db";
import { applyTheme, applyBackgroundColor } from "./utils/theme";
import type { PlantSpecies } from "./schema/knowledge-graph";
import { Tabs, TabPanel } from "./components/Tabs";
import ErrorBoundary from "./components/ui/ErrorBoundary";
// Lazy load tabs to improve initial load speed
const VirtualGardenTab = React.lazy(() =>
  import("./components/VirtualGardenTab").then((m) => ({
    default: m.VirtualGardenTab,
  })),
);
const ProfileTab = React.lazy(() =>
  import("./components/ProfileTab").then((m) => ({ default: m.ProfileTab })),
);
const SowingCalendarTab = React.lazy(() =>
  import("./components/SowingCalendarTab").then((m) => ({
    default: m.SowingCalendarTab,
  })),
);
const PlantKnowledgebaseTab = React.lazy(() =>
  import("./components/PlantKnowledgebaseTab").then((m) => ({
    default: m.PlantKnowledgebaseTab,
  })),
);
const SeedInventoryTab = React.lazy(() =>
  import("./components/SeedInventoryTab").then((m) => ({
    default: m.SeedInventoryTab,
  })),
);
const WeatherForecastTab = React.lazy(() =>
  import("./components/WeatherForecastTab").then((m) => ({
    default: m.WeatherForecastTab,
  })),
);
const SettingsTab = React.lazy(() =>
  import("./components/SettingsTab").then((m) => ({ default: m.SettingsTab })),
);
const LogbookTab = React.lazy(() =>
  import("./components/LogbookTab").then((m) => ({ default: m.LogbookTab })),
);
const HarvestTab = React.lazy(() =>
  import("./components/HarvestTab").then((m) => ({ default: m.HarvestTab })),
);
const GardenCoachSheet = React.lazy(() =>
  import("./components/GardenCoachSheet").then((m) => ({
    default: m.GardenCoachSheet,
  })),
);
const GardenGuideSheet = React.lazy(() =>
  import("./components/GardenGuideSheet").then((m) => ({
    default: m.GardenGuideSheet,
  })),
);
import { useWeatherStore } from "./stores/weatherStore";
import { getUserLocation } from "./services/geolocationService";
import { listPlantCatalog } from "./services/referenceDataService";
import { useAuth } from "./hooks/useAuth";
import { signOut } from "./services/authService";
import { AuthScreen } from "./components/AuthScreen";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { SplashScreen } from "./components/SplashScreen";
import { GardenStatusBanner } from "./components/GardenStatusBanner";
import { SeedStore } from "./components/SeedStore";
import { showError, showSuccess } from "./lib/toast";
import { useSyncStatus } from "./hooks/useSyncStatus";
import { setSyncStatus } from "./services/syncStatusService";
import { retryPendingAccountSync } from "./services/syncRetryService";
import { notifyWeatherAlert } from "./services/notificationService";
import {
  ensureCloudUserSettings,
  upsertCloudUserSettings,
} from "./services/userSettingsService";
const queryClient = new QueryClient();

const getDayOfYear = (date: Date) => {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yearStart = new Date(date.getFullYear(), 0, 1);

  return Math.floor((today.getTime() - yearStart.getTime()) / 86400000) + 1;
};

const AppContent: React.FC = () => {
  const [catalog, setCatalog] = useState<PlantSpecies[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [showSeedStore, setShowSeedStore] = useState(false);
  const [showGardenGuide, setShowGardenGuide] = useState(false);
  const [showGardenCoach, setShowGardenCoach] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [hemisphere, setHemisphere] = useState<"North" | "South">("North");
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const syncStatus = useSyncStatus();
  const currentDay = React.useMemo(
    () => getDayOfYear(currentDateTime),
    [currentDateTime],
  );
  const currentDateTimeLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(currentDateTime),
    [currentDateTime],
  );

  // New weather store
  const {
    data: weather,
    isLoading: loading,
    locationName,
    setLocation,
    fetchWeatherData,
  } = useWeatherStore();

  const alerts = React.useMemo(() => {
    if (!weather) return [];
    const activeAlerts: string[] = [];

    if (weather.current.temperature_2m <= 0) {
      activeAlerts.push("❄️ Frost Warning: Cover sensitive plants!");
    } else if (weather.current.temperature_2m <= 4) {
      activeAlerts.push("🌡️ Cold Snap: Protect seedlings.");
    }

    if (weather.current.temperature_2m >= 30) {
      activeAlerts.push("🔥 Heat Wave: Ensure adequate hydration.");
    }

    // Map weather codes to conditions
    const currentCondition = weather.current.weather_code;
    if (currentCondition >= 95) {
      // Thunderstorm
      activeAlerts.push("⛈️ Storm Warning: Heavy rain and wind.");
    } else if (
      (currentCondition >= 51 && currentCondition <= 67) || // Rain
      (currentCondition >= 80 && currentCondition <= 82)
    ) {
      // Showers
      if (weather.current.precipitation > 5) {
        activeAlerts.push("🌧️ Heavy Rain: Check drainage.");
      }
    } else if (weather.current.relative_humidity_2m < 20) {
      activeAlerts.push("🌵 Drought Warning: Water crops immediately.");
    }

    return activeAlerts.length > 0 ? activeAlerts : ["✅ Conditions Normal"];
  }, [weather]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  // Fire browser notifications for weather alerts
  React.useEffect(() => {
    if (alerts.length > 0) {
      const activeAlert = alerts.find((a) => !a.includes("Conditions Normal"));
      notifyWeatherAlert(activeAlert || alerts[0]);
    }
  }, [alerts]);

  React.useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  React.useEffect(() => {
    if (!userId || !isOnline || syncStatus.pendingLocalCount === 0) return;

    retryPendingAccountSync(userId).catch((error) => {
      console.warn("Retry sync failed:", error);
      setSyncStatus("error", "Retry failed. Changes are still saved locally.");
    });
  }, [isOnline, syncStatus.pendingLocalCount, userId]);

  // Automatic Shutdown Heartbeat
  React.useEffect(() => {
    const localHeartbeatHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    if (!localHeartbeatHosts.has(window.location.hostname)) return;

    // The local launcher serves the app and heartbeat endpoint on the same port.
    const sendHeartbeat = () => {
      fetch("/api/heartbeat").catch(() => {
        // Launcher likely closed
      });
    };

    // Initial heartbeat
    sendHeartbeat();

    // Pulse every 5 seconds
    const interval = setInterval(sendHeartbeat, 5000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    setDatabaseOwnerScope(userId ?? null);
  }, [userId]);

  React.useEffect(() => {
    if (authLoading || !userId) return;

    // Hold subscription references so we can clean them up on unmount.
    let catalogSub: { unsubscribe(): void } | null = null;
    let settingsSub: { unsubscribe(): void } | null = null;

    const init = async () => {
      await hydrateDatabase();
      const db = await getDatabase();

      let loadedRemoteCatalog = false;
      try {
        const remoteCatalog = await listPlantCatalog();
        if (remoteCatalog.length > 0) {
          setCatalog(remoteCatalog);
          loadedRemoteCatalog = true;
        }
      } catch (error) {
        console.warn("Falling back to local catalog data:", error);
      }

      if (!loadedRemoteCatalog) {
        // Subscribe to local catalog for hydration fallback/offline use.
        catalogSub = db.catalog.find().$.subscribe((docs) => {
          if (docs) {
            setCatalog(docs.map((doc) => doc.toJSON()));
          }
        });
      }

      // Apply Theme
      const savedTheme = localStorage.getItem("theme-color");
      if (savedTheme) applyTheme(savedTheme);

      // Apply Background Color
      const savedBgColor = localStorage.getItem("bg-color") || "#090c0a";
      applyBackgroundColor(savedBgColor);

      /*
      const savedMode = localStorage.getItem('theme-mode');
      if (savedMode === 'light') toggleThemeMode('light');
      */

      const settings = await db.settings.findOne("local-user").exec();
      if (settings) {
        setHemisphere(
          (settings.hemisphere as import("./schema/knowledge-graph").UserLocation["hemisphere"]) ||
            "North",
        );
      }

      settingsSub = db.settings.findOne("local-user").$.subscribe((s) => {
        if (s) {
          setHemisphere(
            (s.hemisphere as import("./schema/knowledge-graph").UserLocation["hemisphere"]) ||
              "North",
          );
        }
      });

      // Request geolocation if not already set, then fetch weather
      try {
        const { latitude, longitude } = useWeatherStore.getState();
        if (latitude === null || longitude === null) {
          const coords = await getUserLocation();
          setLocation(coords.latitude, coords.longitude);
          await fetchWeatherData(true);
        } else {
          await fetchWeatherData();
        }
      } catch (err) {
        console.warn("Location/Weather initialization skipped:", err);
        // Fallback or handle error - store already handles error states
        fetchWeatherData();
      }
    };
    init();

    // Refresh weather every 1 hour
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 3600000);

    return () => {
      clearInterval(interval);
      catalogSub?.unsubscribe();
      settingsSub?.unsubscribe();
    };
  }, [authLoading, userId, setLocation, fetchWeatherData]);

  React.useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const syncSettingsFromCloud = async () => {
      try {
        await hydrateDatabase();
        const db = await getDatabase();
        const localSettingsDoc = await db.settings.findOne("local-user").exec();
        if (!localSettingsDoc || cancelled) {
          setOnboardingComplete(true);
          return;
        }

        const localSettings = localSettingsDoc.toJSON();
        const cloudSettings = await ensureCloudUserSettings(userId, {
          ...localSettings,
          firstLoadComplete: false,
        });
        if (cancelled) return;

        await db.settings.upsert({
          ...localSettings,
          id: "local-user",
          firstLoadComplete: cloudSettings.firstLoadComplete,
          hemisphere: cloudSettings.hemisphere ?? localSettings.hemisphere,
          city: cloudSettings.city ?? localSettings.city,
          currentDay: cloudSettings.currentDay ?? localSettings.currentDay,
          dataVersion: cloudSettings.dataVersion ?? localSettings.dataVersion,
        });
        setOnboardingComplete(cloudSettings.firstLoadComplete);
      } catch (error) {
        console.warn("Cloud settings sync skipped:", error);
        setSyncStatus("error", "Settings sync failed. Changes stay local.");
        setOnboardingComplete(true);
      }
    };

    syncSettingsFromCloud();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSignOut = async () => {
    setSyncStatus("syncing", "Signing out...");
    const { error } = await signOut();
    if (error) {
      setSyncStatus("error", "Sign-out failed.");
      showError(error.message);
      return;
    }
    setDatabaseOwnerScope(null);
    setSyncStatus("local", "Signed out. Local account data is separated.");
    showSuccess("Cloud session disconnected.");
  };

  const handleRetrySync = async () => {
    if (!userId) return;
    if (!isOnline) {
      showError("You are offline. Retry when the connection returns.");
      return;
    }

    try {
      await retryPendingAccountSync(userId);
      showSuccess("Saved local changes synced.");
    } catch (error) {
      console.warn("Manual retry sync failed:", error);
      setSyncStatus("error", "Retry failed. Changes are still saved locally.");
      showError("Retry failed. Changes are still saved locally.");
    }
  };

  const handleAssistantOpen = () => {
    setShowGardenCoach(true);
  };

  const handleCoachClose = () => {
    setShowGardenCoach(false);
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    setSavingOnboarding(true);

    try {
      const db = await getDatabase();
      const settings = await db.settings.findOne("local-user").exec();
      const nextSettings = {
        ...(settings?.toJSON() ?? {
          id: "local-user",
          hemisphere,
          currentDay,
          dataVersion: 0,
        }),
        firstLoadComplete: true,
      };

      await db.settings.upsert(nextSettings);
      await upsertCloudUserSettings(user.id, nextSettings);
      setOnboardingComplete(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not finish onboarding.";
      showError(message);
    } finally {
      setSavingOnboarding(false);
    }
  };

  if (authLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    }
    return <AuthScreen onBack={() => setShowAuth(false)} />;
  }

  if (onboardingComplete === null) {
    return <SplashScreen />;
  }

  if (!onboardingComplete) {
    return (
      <OnboardingScreen
        isSaving={savingOnboarding}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col overflow-y-auto overflow-x-hidden bg-app-background font-sans text-text-primary selection:bg-garden-500/30">
      <header className="app-header z-30 flex min-h-14 items-center justify-between gap-3 border-b border-stone-800 px-3 py-2 glass sm:px-5 lg:h-16 lg:px-8">
        <button
          onClick={() => setActiveTabIndex(0)}
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <div className="w-5 h-5 bg-garden-500 rounded-full animate-pulse" />
          <h1 className="truncate text-[11px] font-black uppercase tracking-tighter text-garden-500 sm:text-xs">
            <span className="sm:hidden">LovelyGarden</span>
            <span className="hidden sm:inline">LovelyGarden</span>
          </h1>
        </button>
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4 lg:gap-6">
          <div className="flex min-w-0 items-center gap-2">
            {user ? (
              <>
                <div
                  className={`inline-flex items-center justify-center rounded-full border p-1.5 ${
                    syncStatus.state === "error"
                      ? "border-red-500/30 bg-red-950/20 text-red-300"
                      : isOnline
                        ? "border-garden-500/20 bg-garden-950/20 text-garden-300"
                        : "border-amber-500/30 bg-amber-950/20 text-amber-300"
                  }`}
                  title={
                    syncStatus.message ||
                    (isOnline
                      ? "Online. Changes can sync to your account."
                      : "Offline. Changes are saved locally and will be available to sync when the connection returns.")
                  }
                >
                  {syncStatus.state === "error" ? (
                    <CloudOff className="h-4 w-4" />
                  ) : isOnline ? (
                    <Cloud className="h-4 w-4" />
                  ) : (
                    <CloudOff className="h-4 w-4" />
                  )}
                  {syncStatus.pendingLocalCount > 0 && (
                    <button
                      type="button"
                      onClick={handleRetrySync}
                      disabled={!isOnline || syncStatus.state === "syncing"}
                      className="-mr-0.5 ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/20 bg-black/10 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        isOnline
                          ? "Retry saved local changes now"
                          : "Retry when you are back online"
                      }
                      aria-label="Retry sync"
                    >
                      <RefreshCw
                        className={`h-2.5 w-2.5 ${
                          syncStatus.state === "syncing" ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>
                <div
                  className="hidden md:flex items-center gap-2 rounded-full border border-garden-500/20 bg-garden-950/20 px-3 py-1.5"
                  title={user.email ?? "Signed in"}
                >
                  <UserCircle className="h-4 w-4 text-garden-400" />
                  <span className="max-w-40 truncate text-[11px] font-bold text-garden-300">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-500 hover:border-red-500/40 hover:text-red-400"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <GardenStatusBanner
        weather={weather}
        weatherLoading={loading}
        alerts={alerts}
        syncStatus={syncStatus}
        isOnline={isOnline}
        locationName={locationName}
        onRetrySync={handleRetrySync}
      />

      <React.Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-20">
            <LoadingSpinner size="lg" label="Initializing Interface" />
          </div>
        }
      >
        <Tabs selectedIndex={activeTabIndex} onTabChange={setActiveTabIndex}>
          <TabPanel id="virtual-garden">
            <ErrorBoundary>
              <VirtualGardenTab
                catalog={catalog}
                currentDay={currentDay}
                currentDateTimeLabel={currentDateTimeLabel}
                currentTimestamp={currentDateTime.getTime()}
                alerts={alerts}
                onOpenSeedStore={() => setShowSeedStore(true)}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="profile">
            <ErrorBoundary>
              <ProfileTab />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="sowing-calendar">
            <ErrorBoundary>
              <SowingCalendarTab
                catalog={catalog}
                currentDay={currentDay}
                hemisphere={hemisphere}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="plant-knowledgebase">
            <ErrorBoundary>
              <PlantKnowledgebaseTab />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="seed-inventory">
            <ErrorBoundary>
              <SeedInventoryTab catalog={catalog} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="weather-forecast">
            <ErrorBoundary>
              <WeatherForecastTab />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="logbook">
            <ErrorBoundary>
              <LogbookTab />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="harvest">
            <ErrorBoundary>
              <HarvestTab />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel id="settings">
            <ErrorBoundary>
              <SettingsTab />
            </ErrorBoundary>
          </TabPanel>
        </Tabs>

        {/* Seed Store Modal */}
        {showSeedStore && (
          <ErrorBoundary>
            <SeedStore
              catalog={catalog}
              onClose={() => setShowSeedStore(false)}
              currentDay={currentDay}
            />
          </ErrorBoundary>
        )}
        {!showGardenGuide && !showGardenCoach && (
          <button
            type="button"
            onClick={handleAssistantOpen}
            className="assistant-fab fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-garden-500/30 btn-primary text-stone-950 shadow-2xl shadow-garden-950/50 hover:bg-garden-400 lg:bottom-6 lg:right-6"
            aria-label="Open Garden Coach"
            title="Open Garden Coach"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}
        {showGardenGuide && (
          <GardenGuideSheet
            catalog={catalog}
            currentDay={currentDay}
            hemisphere={hemisphere}
            weather={weather}
            onClose={() => setShowGardenGuide(false)}
            onOpenGeminiCoach={() => {
              setShowGardenGuide(false);
              setShowGardenCoach(true);
            }}
          />
        )}
        {showGardenCoach && (
          <GardenCoachSheet
            catalog={catalog}
            currentDay={currentDay}
            hemisphere={hemisphere}
            weather={weather}
            onClose={() => setShowGardenCoach(false)}
            onConnectionLost={handleCoachClose}
          />
        )}
      </React.Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
