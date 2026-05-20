import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
  AlertCircle,
  Calendar,
  LayoutGrid,
  Sprout,
  Plus,
  Edit,
  Activity,
  Droplets,
  Undo2,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from "@dnd-kit/core";
import { GardenField } from "./GardenGrid";
import { InventoryTray } from "./InventoryTray";
import { PlantInspector } from "./PlantInspector";
import { usePlantedCards } from "../hooks/usePlantedCards";
import { getDatabase } from "../db";
import {
  createGarden,
  updateGarden,
  plantSeed,
  relocatePlant,
  unplantSeed,
  addPlantObservation,
} from "../db/queries";
import { calculateCurrentStage } from "../logic/lifecycle";
import { GardenConfigDialog, GardenConfig } from "./GardenConfigDialog";
import { isSowingSeason } from "../logic/reasoning";
import { showSuccess, showError, showInfo, toast } from "../lib/toast";
import { PlantedDocument, GridLayer, GardenDocument } from "../db/types";
import { PlantSpecies } from "../schema/knowledge-graph";
import { Subscription } from "rxjs";
import { ObservationPattern } from "../logic/diagnostics";
import { useAuth } from "../hooks/useAuth";
import {
  syncGardensWithCloud,
  upsertCloudGarden,
} from "../services/gardenService";
import {
  deleteCloudInventoryItem,
  upsertCloudInventoryItem,
} from "../services/inventoryService";

const ObservationTerminal = React.lazy(async () => {
  const m = await import("./ObservationTerminal");
  return { default: m.ObservationTerminal };
});

interface VirtualGardenTabProps {
  catalog: PlantSpecies[];
  currentDay: number;
  currentDateTimeLabel: string;
  currentTimestamp: number;
  xp: number;
  alerts: string[];
  onOpenSeedStore?: () => void;
}

const sortGardens = <T extends { id?: string; createdDate?: number }>(
  gardenList: T[],
): T[] =>
  [...gardenList].sort((a, b) => {
    if (a.id === "main-garden") return -1;
    if (b.id === "main-garden") return 1;
    return (a.createdDate || 0) - (b.createdDate || 0);
  });

export const VirtualGardenTab: React.FC<VirtualGardenTabProps> = ({
  catalog,
  currentDay,
  currentDateTimeLabel,
  currentTimestamp,
  xp,
  alerts,
  onOpenSeedStore,
}) => {
  const { user } = useAuth();
  // Garden State
  const [gardens, setGardens] = useState<GardenDocument[]>([]);
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null);
  const activeGarden = gardens.find((g) => g.id === activeGardenId);

  const plantedCards = usePlantedCards(activeGardenId || undefined);
  const [selectedPlant, setSelectedPlant] = useState<PlantedDocument | null>(
    null,
  );
  const [spectralLayer, setSpectralLayer] = useState<GridLayer>("normal");
  const [activeSeedCatalogId, setActiveSeedCatalogId] = useState<string | null>(
    null,
  );
  const [activeDragPreview, setActiveDragPreview] = useState<{
    kind: "seed" | "plant";
    name: string;
    type?: string;
  } | null>(null);
  const [plantNowMode, setPlantNowMode] = useState(false);
  const [observationPlant, setObservationPlant] =
    useState<PlantedDocument | null>(null);

  // Sprint 2: "Plant Now" filter - derived via useMemo to avoid cascading renders
  const currentMonth = useMemo(
    () => Math.floor(((currentDay - 1) % 365) / 30.42),
    [currentDay],
  );
  const plantNowSet = useMemo(() => {
    if (!plantNowMode) return new Set<string>();
    const newSet = new Set<string>();
    for (const c of catalog) {
      const res = isSowingSeason(
        c,
        { id: "user_location", hemisphere: "North", frost_data: {} },
        currentMonth,
      );
      if (res.eligible) newSet.add(c.id);
    }
    return newSet;
  }, [plantNowMode, catalog, currentMonth]);

  // Dialog State
  const [showGardenDialog, setShowGardenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  // Reactive subscription for gardens
  useEffect(() => {
    let sub: Subscription;
    const initSub = async () => {
      const db = await getDatabase();
      sub = db.gardens.find().$.subscribe((docs) => {
        const gardensData = sortGardens(docs.map((d) => d.toJSON()));
        setGardens(gardensData);

        // Auto-select first garden if none selected
        if (gardensData.length > 0) {
          setActiveGardenId((prev) => {
            if (prev && gardensData.some((garden) => garden.id === prev)) {
              return prev;
            }
            return gardensData[0].id;
          });
        }
      });
    };
    initSub();
    return () => sub && sub.unsubscribe();
  }, []); // Run once to setup subscription

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const syncUserGardens = async () => {
      const db = await getDatabase();
      const localGardens = (await db.gardens.find().exec()).map((doc) =>
        doc.toJSON(),
      );
      const syncedGardens = await syncGardensWithCloud(user.id, localGardens);

      if (cancelled) return;

      await Promise.all(
        syncedGardens.map((garden) => db.gardens.upsert(garden)),
      );

      const sortedGardens = sortGardens(syncedGardens);
      setGardens(sortedGardens);
      setActiveGardenId((prev) => {
        if (prev && sortedGardens.some((garden) => garden.id === prev)) {
          return prev;
        }
        return sortedGardens[0]?.id ?? null;
      });
    };

    syncUserGardens().catch((error) => {
      console.warn("Garden cloud sync failed:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Sync garden list periodically or subscribe? For now, fetch on updates.
  const refreshGardens = async () => {
    const db = await getDatabase();
    const docs = await db.gardens.find().exec();
    const gardensData = sortGardens(docs.map((d) => d.toJSON()));
    setGardens(gardensData);
  };

  const syncLocalGardenToCloud = async (gardenId: string) => {
    if (!user) return;

    const db = await getDatabase();
    const garden = await db.gardens.findOne(gardenId).exec();
    if (garden) {
      await upsertCloudGarden(user.id, garden.toJSON());
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idStr = active.id.toString();
    if (idStr.startsWith("seed-")) {
      const catalogId = active.data.current?.id as string | undefined;
      const name = active.data.current?.name as string | undefined;
      const type = active.data.current?.type as string | undefined;
      setActiveSeedCatalogId(catalogId || null);
      setActiveDragPreview({
        kind: "seed",
        name: name || catalogId || "Seed",
        type,
      });
    } else if (idStr.startsWith("planted-")) {
      const plant = active.data.current?.item as PlantedDocument;
      setActiveSeedCatalogId(plant?.catalogId || null);
      setActiveDragPreview({
        kind: "plant",
        name:
          catalog.find((item) => item.id === plant?.catalogId)?.name ||
          plant?.catalogId ||
          "Plant",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSeedCatalogId(null);
    setActiveDragPreview(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // CASE 1: Planting from Bag to Grid
    if (activeId.startsWith("seed-") && overId.startsWith("slot-")) {
      if (!activeGarden) {
        showError("No active garden selected");
        return;
      }

      const inventoryId = activeId.replace("seed-", "");
      const catalogId = active.data.current?.id;
      const { x, y } = over.data.current as { x: number; y: number };

      const totalCells = activeGarden.gridWidth * activeGarden.gridHeight;
      const occupiedCells = plantedCards.length;

      if (occupiedCells >= totalCells) {
        showError("Expand Grid to Plant");
        return;
      }

      const existingPlant = plantedCards.find(
        (p) => p.gridX === x && p.gridY === y,
      );
      if (existingPlant) {
        showError("Slot already occupied");
        return;
      }

      try {
        const plantId = await plantSeed(
          catalogId,
          x,
          y,
          inventoryId,
          activeGarden.id,
        );
        if (user) {
          deleteCloudInventoryItem(user.id, inventoryId).catch((error) => {
            console.warn("Inventory cloud delete failed:", error);
          });
        }
        showUndoAction("Plant added to garden", async () => {
          try {
            const restoredInventoryId = await unplantSeed(plantId);
            if (user) {
              const db = await getDatabase();
              const inventoryItem = await db.inventory
                .findOne(restoredInventoryId)
                .exec();
              if (inventoryItem) {
                upsertCloudInventoryItem(user.id, inventoryItem.toJSON()).catch(
                  (error) => {
                    console.warn("Inventory cloud upsert failed:", error);
                  },
                );
              }
            }
            showSuccess("Planting undone");
          } catch {
            showError("Could not undo planting");
          }
        });
      } catch {
        showError("Failed to plant seed");
      }
    }

    // CASE 2: Relocating within Grid
    else if (activeId.startsWith("planted-") && overId.startsWith("slot-")) {
      const plant = active.data.current?.item as PlantedDocument;
      const { x, y } = over.data.current as { x: number; y: number };

      if (plant.gridX === x && plant.gridY === y) return; // Same slot

      const existingPlant = plantedCards.find(
        (p) => p.gridX === x && p.gridY === y,
      );
      if (existingPlant) {
        showError("Target slot occupied");
        return;
      }

      try {
        await relocatePlant(plant.id, x, y, activeGarden?.id || "main-garden");
        showUndoAction("Plant unit relocated", async () => {
          try {
            await relocatePlant(
              plant.id,
              plant.gridX,
              plant.gridY,
              activeGarden?.id || "main-garden",
            );
            showSuccess("Move undone");
          } catch {
            showError("Could not undo move");
          }
        });
      } catch {
        showError("Failed to relocate plant");
      }
    }

    // CASE 3: Unplanting back to Bag
    else if (
      activeId.startsWith("planted-") &&
      (overId === "inventory-tray" || overId === "inventory-tray-mobile")
    ) {
      const plant = active.data.current?.item as PlantedDocument;
      const catalogItem = catalog.find((c) => c.id === plant.catalogId);

      if (!catalogItem) return;

      // Rule: Only unplant if in first stage (use real wall-clock time)
      const currentStageId = calculateCurrentStage(
        plant.plantedDate,
        catalogItem.stages,
        Date.now(),
      );
      const isFirstStage =
        catalogItem.stages.length > 0 &&
        currentStageId === catalogItem.stages[0].id;

      if (!isFirstStage) {
        showError("Only young plants can be returned to Bag");
        return;
      }

      try {
        const inventoryId = await unplantSeed(plant.id);
        if (user) {
          const db = await getDatabase();
          const inventoryItem = await db.inventory.findOne(inventoryId).exec();
          if (inventoryItem) {
            upsertCloudInventoryItem(user.id, inventoryItem.toJSON()).catch(
              (error) => {
                console.warn("Inventory cloud upsert failed:", error);
              },
            );
          }
        }
        showSuccess("Plant returned to Bag");
      } catch {
        showError("Failed to unplant");
      }
    }
  };

  const handleSaveGarden = async (config: GardenConfig) => {
    try {
      if (dialogMode === "create") {
        const newId = await createGarden(config);
        await syncLocalGardenToCloud(newId);
        await refreshGardens();
        setActiveGardenId(newId); // Immediately switch to new garden
        showSuccess("New garden sector established");
      } else {
        // Edit
        if (!config.id) return;
        await updateGarden(config.id, {
          name: config.name,
          type: config.type,
          soilType: config.soilType,
          sunExposure: config.sunExposure,
          gridWidth: config.gridWidth,
          gridHeight: config.gridHeight,
          backgroundColor: config.backgroundColor,
          theme: config.theme,
        });
        await syncLocalGardenToCloud(config.id);
        await refreshGardens();
        showSuccess("Garden specs updated");
      }
    } catch (err) {
      console.error("Failed to save garden:", err);
      showError("Failed to save garden configuration");
    }
  };

  const handleSaveObservation = async (pattern: ObservationPattern) => {
    if (!observationPlant) return;
    try {
      await addPlantObservation(observationPlant.id, pattern);
      showSuccess(`Status updated: ${pattern.label}`);
      setObservationPlant(null);
    } catch (err) {
      console.error("Failed to save observation:", err);
      showError("Failed to log observation");
    }
  };

  // Calculate grid capacity
  const totalCells = activeGarden
    ? activeGarden.gridWidth * activeGarden.gridHeight
    : 0;
  const occupiedCells = plantedCards.length;
  const isGridFull = occupiedCells >= totalCells;
  const activeGardenConfig: GardenConfig | null = activeGarden
    ? {
        ...activeGarden,
        soilType: activeGarden.soilType ?? "Loam",
        sunExposure: activeGarden.sunExposure ?? "Full Sun",
      }
    : null;
  const gardenHealth = useMemo(() => {
    if (plantedCards.length === 0) {
      return {
        score: 100,
        thirstyCount: 0,
        stressedCount: 0,
        label: "Ready",
        tone: "text-garden-400",
      };
    }

    const avgHydration =
      plantedCards.reduce((sum, plant) => sum + (plant.hydration ?? 100), 0) /
      plantedCards.length;
    const avgStress =
      plantedCards.reduce((sum, plant) => sum + (plant.stressLevel ?? 0), 0) /
      plantedCards.length;
    const score = Math.max(0, Math.round(avgHydration - avgStress * 0.65));
    const thirstyCount = plantedCards.filter(
      (plant) => (plant.hydration ?? 100) < 35,
    ).length;
    const stressedCount = plantedCards.filter(
      (plant) => (plant.stressLevel ?? 0) > 60,
    ).length;

    return {
      score,
      thirstyCount,
      stressedCount,
      label: score >= 80 ? "Stable" : score >= 55 ? "Watch" : "Care",
      tone:
        score >= 80
          ? "text-garden-400"
          : score >= 55
            ? "text-amber-400"
            : "text-red-400",
    };
  }, [plantedCards]);

  const showUndoAction = (message: string, onUndo: () => Promise<void>) => {
    toast.custom(
      (toastInstance) => (
        <div className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm font-semibold text-stone-100 shadow-xl">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(toastInstance.id);
              void onUndo();
            }}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-garden-500 px-3 text-xs font-black uppercase tracking-wide text-stone-950 hover:bg-garden-400"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
        </div>
      ),
      { duration: 6000, position: "top-right" },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col overflow-hidden bg-app-background font-sans text-stone-100">
        {/* Garden Configuration Dialog */}
        {showGardenDialog && (
          <GardenConfigDialog
            mode={dialogMode}
            initialConfig={dialogMode === "edit" ? activeGardenConfig : null}
            onClose={() => setShowGardenDialog(false)}
            onSave={handleSaveGarden}
            isGardenEmpty={plantedCards.length === 0}
          />
        )}

        {/* HUD OVERLAY */}
        <header className="z-30 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-stone-800 px-2 glass sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:gap-4">
            {/* 1. Cycle Day */}
            <div className="bg-stone-900 px-2 sm:px-3 py-1.5 rounded-full border border-stone-800 text-xs font-black text-garden-400 uppercase tracking-widest shadow-inner flex items-center gap-1 sm:gap-2 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-garden-500" />{" "}
              <span>{currentDateTimeLabel}</span>
              <span className="text-stone-500">Day {currentDay}</span>
            </div>

            {/* 2. Grid Capacity */}
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest shadow-inner shrink-0 ${
                isGridFull
                  ? "bg-red-900/30 border-red-700 text-red-400"
                  : "bg-stone-900 border-stone-800 text-stone-400"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>
                {occupiedCells}/{totalCells}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-2 py-1.5 text-xs font-bold uppercase tracking-widest shadow-inner sm:px-3">
              <Activity className={`h-3.5 w-3.5 ${gardenHealth.tone}`} />
              <span className={gardenHealth.tone}>{gardenHealth.score}</span>
              <span className="text-stone-500">{gardenHealth.label}</span>
            </div>
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-stone-500 shadow-inner sm:flex sm:px-3">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              <span>{gardenHealth.thirstyCount} Water</span>
              <span className="text-stone-700">/</span>
              <span>{gardenHealth.stressedCount} Watch</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 overflow-x-auto no-scrollbar sm:gap-4">
            {/* 4. Global Alerts Marquee - Hidden below xl */}
            <div className="max-w-[150px] overflow-hidden hidden 2xl:block border-r border-stone-800 pr-4 mr-2">
              <div className="animate-marquee whitespace-nowrap text-[10px] text-stone-500 uppercase tracking-widest">
                {alerts.join(" • ")}
              </div>
            </div>

            {/* 6. Spectral Layer Toggle - Hidden below lg */}
            <div className="hidden xl:flex bg-stone-900 p-1 rounded-xl border border-stone-800 shadow-inner shrink-0 scale-90 origin-right">
              <button
                onClick={() => setSpectralLayer("normal")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "normal" ? "bg-stone-800 text-white shadow-md" : "text-stone-500"}`}
              >
                Visual
              </button>
              <button
                onClick={() => setSpectralLayer("hydration")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "hydration" ? "bg-blue-900/40 text-blue-400 shadow-md" : "text-stone-500"}`}
              >
                H2O
              </button>
              <button
                onClick={() => setSpectralLayer("health")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "health" ? "bg-red-900/40 text-red-400 shadow-md" : "text-stone-500"}`}
              >
                Blight
              </button>
              <button
                onClick={() => setSpectralLayer("nutrients")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "nutrients" ? "bg-purple-900/40 text-purple-400 shadow-md" : "text-stone-500"}`}
              >
                N-P-K
              </button>
              <button
                onClick={() => setSpectralLayer("companions")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "companions" ? "bg-garden-900/40 text-garden-400 shadow-md" : "text-stone-500"}`}
              >
                Companions
              </button>
            </div>

            {/* 7. XP/Level Tracker - Hidden below sm */}
            <div className="hidden sm:flex items-center gap-2 bg-stone-900 px-2 sm:px-3 py-1.5 rounded-full border border-stone-800 shrink-0">
              <span className="text-[10px] font-bold text-garden-400">
                XP: {xp}
              </span>
              <div className="h-1.5 w-12 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-garden-500 rounded-full"
                  style={{ width: `${((xp % 100) / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* LEFT SIDEBAR: BAG */}
          <div className="hidden lg:flex">
            <InventoryTray
              catalog={catalog}
              onOpenStore={onOpenSeedStore || (() => {})}
              isVertical={true}
              plantNowMode={plantNowMode}
              onTogglePlantNow={() => setPlantNowMode((v) => !v)}
              plantNowSet={plantNowSet}
            />
          </div>

          {/* MAIN CONTENT COLUMN */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-primary/20">
            <div className="relative flex h-12 items-center gap-2 overflow-x-auto border-b border-stone-800 px-2 shadow-lg glass-panel no-scrollbar sm:px-4">
              <div className="absolute inset-0 shimmer-bg opacity-30 pointer-events-none" />
              {Array.from({ length: 5 }).map((_, i) => {
                const garden = gardens[i];
                const isActive = garden?.id && activeGardenId === garden.id;

                return (
                  <button
                    key={garden ? garden.id : `slot-${i}`}
                    onClick={() => {
                      if (garden) setActiveGardenId(garden.id || null);
                      else {
                        setDialogMode("create");
                        setShowGardenDialog(true);
                      }
                    }}
                    className={`
                                relative h-full px-4 sm:px-6 flex items-center justify-center text-xs sm:text-[13px] font-bold uppercase tracking-widest transition-all border-r border-t border-stone-800 flex-shrink-0 min-w-[5.25rem] max-w-[100px] sm:max-w-[120px] lg:max-w-[150px] z-10
                                ${i === 0 ? "border-l" : ""}
                                ${
                                  isActive
                                    ? "bg-bg-primary text-garden-400 border-b-bg-primary translate-y-[1px]"
                                    : garden
                                      ? "bg-[#090c0a] text-stone-500 hover:text-stone-300 hover:bg-stone-800 border-b-border-primary"
                                      : "bg-[#090c0a]/30 text-stone-700 hover:text-stone-500 hover:bg-[#090c0a]/50 border-b-border-primary"
                                }`}
                    title={garden ? garden.name : `Create Garden ${i + 1}`}
                  >
                    {garden ? (
                      <span className="truncate block w-full text-center">
                        {garden.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 opacity-60">
                        <Plus className="w-3 h-3" />{" "}
                        <span className="hidden sm:inline">Garden {i + 1}</span>
                      </span>
                    )}
                    {i === 0 && garden && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                        title="Primary Axis"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative flex min-h-0 flex-1 overflow-hidden">
              {/* CENTER PANE: TACTICAL FIELD */}
              <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden terrain-texture">
                {/* Garden Config Controls (Edit/Delete Active) */}
                {activeGarden && (
                  <div className="absolute left-2 right-2 top-2 z-20 flex flex-col gap-2 sm:left-4 sm:right-auto sm:top-4">
                    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/80 p-2 shadow-lg backdrop-blur-sm no-scrollbar sm:gap-2">
                      <div className="shrink-0 border-r border-stone-700 px-2 text-[11px] font-bold uppercase text-stone-400 sm:text-[13px]">
                        {activeGarden.type}
                      </div>
                      <div className="shrink-0 border-r border-stone-700 px-2 text-[11px] font-bold uppercase text-stone-400 sm:text-[13px]">
                        ☀️ {activeGarden.sunExposure}
                      </div>
                      <div className="shrink-0 border-r border-stone-700 px-2 text-[11px] font-bold uppercase text-stone-400 sm:text-[13px]">
                        💧 {activeGarden.soilType}
                      </div>
                      <button
                        onClick={() => {
                          setDialogMode("edit");
                          setShowGardenDialog(true);
                        }}
                        className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-500 hover:text-garden-400 transition-colors"
                        title="Configure Garden"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* THE FIELD */}

                <main className="flex flex-1 items-center justify-center overflow-auto p-4 pt-16 sm:p-8 sm:pt-20 lg:p-12">
                  {activeGarden ? (
                    <GardenField
                      key={activeGarden.id} // Force remount on garden switch to clear grid state
                      items={plantedCards}
                      onSelect={setSelectedPlant}
                      layer={spectralLayer}
                      activeSeedCatalogId={activeSeedCatalogId}
                      catalog={catalog}
                      rows={activeGarden.gridHeight}
                      cols={activeGarden.gridWidth}
                      onDelete={async (item: PlantedDocument) => {
                        const db = await import("../db").then((m) =>
                          m.getDatabase(),
                        );
                        await db.planted.findOne(item.id).remove();
                        showInfo("Plant removed from garden");
                      }}
                      onOpenObservation={setObservationPlant}
                      currentDay={currentTimestamp}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <AlertCircle className="w-12 h-12 text-stone-500 mb-4" />
                      <h3 className="text-center text-[21px] font-bold uppercase tracking-widest text-stone-400">
                        No Sector Online
                      </h3>
                      <p className="text-stone-500 text-[15px] mt-2">
                        Initialize a garden sector to begin operations.
                      </p>
                      <button
                        onClick={() => {
                          setDialogMode("create");
                          setShowGardenDialog(true);
                        }}
                        className="mt-6 px-6 py-2 bg-garden-600 text-stone-900 rounded-lg font-bold uppercase tracking-widest hover:bg-garden-500 transition-colors"
                      >
                        Initialize Sector
                      </button>
                    </div>
                  )}
                </main>
              </div>

              {/* RIGHT PANE: INTELLIGENCE (Inspector stays docked if plant selected) */}
              <aside
                className={`fixed inset-x-3 bottom-24 top-24 z-40 flex flex-col overflow-hidden rounded-2xl border border-border-primary glass transition-all duration-500 lg:static lg:inset-auto lg:bottom-auto lg:top-auto lg:rounded-none lg:border-l ${
                  selectedPlant
                    ? "translate-y-0 opacity-100 lg:w-[26rem]"
                    : "pointer-events-none translate-y-8 opacity-0 lg:w-0 lg:translate-y-0 lg:opacity-100"
                }`}
              >
                {selectedPlant && (
                  <PlantInspector
                    plant={selectedPlant}
                    catalogItem={
                      catalog.find((c) => c.id === selectedPlant.catalogId) as
                        | PlantSpecies
                        | undefined
                    }
                    companionScore={1}
                    currentDay={currentTimestamp}
                    onClose={() => setSelectedPlant(null)}
                    docked
                  />
                )}
                {!selectedPlant && (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-20">
                    <span className="text-2xl">ℹ️</span>
                    <p className="text-[13px] font-bold uppercase tracking-widest text-stone-500">
                      Intelligence Node Inactive
                    </p>
                    <p className="text-[12px] text-stone-600 italic">
                      Select a plant unit from the tactical field to initialize
                      link...
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>

          <div className="lg:hidden">
            <InventoryTray
              catalog={catalog}
              onOpenStore={onOpenSeedStore || (() => {})}
              droppableId="inventory-tray-mobile"
              plantNowMode={plantNowMode}
              onTogglePlantNow={() => setPlantNowMode((v) => !v)}
              plantNowSet={plantNowSet}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null} adjustScale={false}>
          {activeDragPreview ? (
            <div
              className={
                activeDragPreview.kind === "seed"
                  ? "pointer-events-none flex h-[100px] w-[80px] flex-col items-center justify-center rounded-3xl border border-garden-400 bg-stone-900/95 p-2 text-center shadow-[0_0_30px_rgba(34,197,94,0.35)]"
                  : "pointer-events-none flex size-[120px] flex-col items-center justify-center rounded-3xl border-2 border-garden-400 bg-stone-900/95 p-3 text-center shadow-[0_0_30px_rgba(34,197,94,0.35)]"
              }
            >
              <Sprout
                className={
                  activeDragPreview.kind === "seed"
                    ? "h-5 w-5 text-garden-300"
                    : "h-10 w-10 text-garden-300"
                }
              />
              <div className="mt-2 line-clamp-2 text-[11px] font-black leading-tight text-garden-200">
                {activeDragPreview.name}
              </div>
              {activeDragPreview.type && (
                <div className="mt-1 line-clamp-1 text-[10px] italic text-garden-400">
                  {activeDragPreview.type.replace("_", " ")}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>

        {observationPlant && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
                <div className="text-white">Loading...</div>
              </div>
            }
          >
            <ObservationTerminal
              plant={observationPlant}
              catalog={catalog}
              onClose={() => setObservationPlant(null)}
              onSave={handleSaveObservation}
            />
          </Suspense>
        )}
      </div>
    </DndContext>
  );
};
