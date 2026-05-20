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
  History,
  CheckCircle2,
  ClipboardList,
  SunMedium,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  Modifier,
} from "@dnd-kit/core";
import { GardenField } from "./GardenGrid";
import { InventoryTray } from "./InventoryTray";
import { PlantInspector } from "./PlantInspector";
import { usePlantedCards } from "../hooks/usePlantedCards";
import { useLogbook } from "../hooks/useLogbook";
import { useInventory } from "../hooks/useInventory";
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
import {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  toast,
} from "../lib/toast";
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
import {
  deleteCloudPlantedPlant,
  upsertCloudPlantedPlant,
} from "../services/plantedPlantService";
import { syncLogbookWithCloud } from "../services/logbookService";
import { setSyncStatus } from "../services/syncStatusService";

const ObservationTerminal = React.lazy(async () => {
  const m = await import("./ObservationTerminal");
  return { default: m.ObservationTerminal };
});

const getActivatorPoint = (event: Event | null) => {
  if (!event) return null;
  if (event instanceof MouseEvent || event instanceof PointerEvent) {
    return { x: event.clientX, y: event.clientY };
  }
  if (event instanceof TouchEvent) {
    const touch = event.touches[0] || event.changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  return null;
};

const shouldCenterDragOverlay = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(orientation: landscape)").matches;

const snapOverlayCenterToCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
  transform,
}) => {
  if (!shouldCenterDragOverlay()) {
    return transform;
  }

  const activatorPoint = getActivatorPoint(activatorEvent);
  if (!activatorPoint || !activeNodeRect || !overlayNodeRect) {
    return transform;
  }

  return {
    ...transform,
    x:
      transform.x +
      activatorPoint.x -
      activeNodeRect.left -
      overlayNodeRect.width / 2,
    y:
      transform.y +
      activatorPoint.y -
      activeNodeRect.top -
      overlayNodeRect.height / 2,
  };
};

interface VirtualGardenTabProps {
  catalog: PlantSpecies[];
  currentDay: number;
  currentDateTimeLabel: string;
  currentTimestamp: number;
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
  alerts,
  onOpenSeedStore,
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  // Garden State
  const [gardens, setGardens] = useState<GardenDocument[]>([]);
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null);
  const activeGarden = gardens.find((g) => g.id === activeGardenId);

  const plantedCards = usePlantedCards(activeGardenId || undefined);
  const logbookEntries = useLogbook();
  const inventoryItems = useInventory();
  const [selectedPlant, setSelectedPlant] = useState<PlantedDocument | null>(
    null,
  );
  const [spectralLayer, setSpectralLayer] = useState<GridLayer>("normal");
  const [activeSeedCatalogId, setActiveSeedCatalogId] = useState<string | null>(
    null,
  );
  const [selectedSeed, setSelectedSeed] = useState<{
    inventoryId: string;
    catalogId: string;
    name: string;
    type: string;
  } | null>(null);
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
    if (!userId) return;

    let cancelled = false;

    const syncUserGardens = async () => {
      const db = await getDatabase();
      const localGardens = (await db.gardens.find().exec()).map((doc) =>
        doc.toJSON(),
      );
      const syncedGardens = await syncGardensWithCloud(userId, localGardens);

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
      setSyncStatus("error", "Garden sync failed. Changes are saved locally.");
      showWarning("Garden sync failed. Saved locally for now.");
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Sync garden list periodically or subscribe? For now, fetch on updates.
  const refreshGardens = async () => {
    const db = await getDatabase();
    const docs = await db.gardens.find().exec();
    const gardensData = sortGardens(docs.map((d) => d.toJSON()));
    setGardens(gardensData);
  };

  const syncLocalGardenToCloud = async (gardenId: string) => {
    if (!userId) return;

    const db = await getDatabase();
    const garden = await db.gardens.findOne(gardenId).exec();
    if (garden) {
      await upsertCloudGarden(userId, garden.toJSON());
    }
  };

  const syncLocalPlantToCloud = async (plantId: string) => {
    if (!userId) return;

    const db = await getDatabase();
    const plant = await db.planted.findOne(plantId).exec();
    if (plant) {
      await upsertCloudPlantedPlant(userId, plant.toJSON());
    }
  };

  const syncLocalLogbookToCloud = async () => {
    if (!userId) return;

    const db = await getDatabase();
    const entries = (await db.logbook.find().exec()).map((doc) => doc.toJSON());
    await syncLogbookWithCloud(userId, entries);
  };

  const markSyncing = (message: string) => {
    if (userId) setSyncStatus("syncing", message);
  };

  const markSynced = (message: string) => {
    if (userId) setSyncStatus("synced", message);
  };

  const handleCloudSyncError = (message: string, error: unknown) => {
    console.warn(message, error);
    setSyncStatus("error", `${message} Saved locally.`);
    showWarning(`${message} Saved locally for now.`);
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

  const handleTapPlant = async (x: number, y: number) => {
    if (!selectedSeed) return;
    if (!activeGarden) {
      showError("Create a garden before planting.");
      return;
    }

    const totalCells = activeGarden.gridWidth * activeGarden.gridHeight;
    if (plantedCards.length >= totalCells) {
      showError("No open planting space");
      return;
    }

    const existingPlant = plantedCards.find(
      (plant) => plant.gridX === x && plant.gridY === y,
    );
    if (existingPlant) {
      showError("That spot already has a plant.");
      return;
    }

    try {
      const plantId = await plantSeed(
        selectedSeed.catalogId,
        x,
        y,
        selectedSeed.inventoryId,
        activeGarden.id,
      );
      if (user) {
        markSyncing("Syncing planting...");
        try {
          await Promise.all([
            deleteCloudInventoryItem(user.id, selectedSeed.inventoryId),
            syncLocalPlantToCloud(plantId),
            syncLocalLogbookToCloud(),
          ]);
          markSynced("Planting synced.");
        } catch (error) {
          handleCloudSyncError("Planting cloud sync failed.", error);
        }
      }
      const plantedName = selectedSeed.name;
      setSelectedSeed(null);
      setActiveSeedCatalogId(null);
      showUndoAction(`${plantedName} planted`, async () => {
        try {
          const restoredInventoryId = await unplantSeed(plantId);
          if (user) {
            markSyncing("Syncing undo...");
            const db = await getDatabase();
            const inventoryItem = await db.inventory
              .findOne(restoredInventoryId)
              .exec();
            try {
              await Promise.all([
                deleteCloudPlantedPlant(user.id, plantId),
                inventoryItem
                  ? upsertCloudInventoryItem(user.id, inventoryItem.toJSON())
                  : Promise.resolve(),
              ]);
              markSynced("Undo synced.");
            } catch (error) {
              handleCloudSyncError("Undo cloud sync failed.", error);
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
        showError("No open planting space");
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
          markSyncing("Syncing planting...");
          try {
            await Promise.all([
              deleteCloudInventoryItem(user.id, inventoryId),
              syncLocalPlantToCloud(plantId),
              syncLocalLogbookToCloud(),
            ]);
            markSynced("Planting synced.");
          } catch (error) {
            handleCloudSyncError("Planting cloud sync failed.", error);
          }
        }
        showUndoAction("Plant added to garden", async () => {
          try {
            const restoredInventoryId = await unplantSeed(plantId);
            if (user) {
              markSyncing("Syncing undo...");
              const db = await getDatabase();
              const inventoryItem = await db.inventory
                .findOne(restoredInventoryId)
                .exec();
              try {
                await Promise.all([
                  deleteCloudPlantedPlant(user.id, plantId),
                  inventoryItem
                    ? upsertCloudInventoryItem(user.id, inventoryItem.toJSON())
                    : Promise.resolve(),
                ]);
                markSynced("Undo synced.");
              } catch (error) {
                handleCloudSyncError("Undo cloud sync failed.", error);
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
        if (user) {
          markSyncing("Syncing plant move...");
          try {
            await syncLocalPlantToCloud(plant.id);
            await syncLocalLogbookToCloud();
            markSynced("Plant move synced.");
          } catch (error) {
            handleCloudSyncError("Plant move cloud sync failed.", error);
          }
        }
        showUndoAction("Plant moved", async () => {
          try {
            await relocatePlant(
              plant.id,
              plant.gridX,
              plant.gridY,
              activeGarden?.id || "main-garden",
              { logType: "move_undo" },
            );
            if (user) {
              markSyncing("Syncing undo...");
              try {
                await syncLocalPlantToCloud(plant.id);
                await syncLocalLogbookToCloud();
                markSynced("Undo synced.");
              } catch (error) {
                handleCloudSyncError("Undo cloud sync failed.", error);
              }
            }
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
          markSyncing("Syncing unplant...");
          const db = await getDatabase();
          const inventoryItem = await db.inventory.findOne(inventoryId).exec();
          try {
            await Promise.all([
              deleteCloudPlantedPlant(user.id, plant.id),
              inventoryItem
                ? upsertCloudInventoryItem(user.id, inventoryItem.toJSON())
                : Promise.resolve(),
            ]);
            markSynced("Unplant synced.");
          } catch (error) {
            handleCloudSyncError("Unplant cloud sync failed.", error);
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
        showSuccess("New garden created");
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
      if (user) {
        markSyncing("Syncing observation...");
        try {
          await syncLocalPlantToCloud(observationPlant.id);
          markSynced("Observation synced.");
        } catch (error) {
          handleCloudSyncError("Observation cloud sync failed.", error);
        }
      }
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
    const capacityRatio = totalCells > 0 ? occupiedCells / totalCells : 0;

    if (plantedCards.length === 0) {
      return {
        score: 100,
        thirstyCount: 0,
        stressedCount: 0,
        pestCount: 0,
        label: "Ready",
        tone: "text-garden-400",
        factors: [
          {
            label: "Capacity",
            detail:
              totalCells > 0
                ? `${totalCells} open cells ready`
                : "Create a garden",
            impact: "Good",
            tone: "border-garden-500/20 text-garden-300",
          },
        ],
      };
    }

    const avgHydration =
      plantedCards.reduce((sum, plant) => sum + (plant.hydration ?? 100), 0) /
      plantedCards.length;
    const avgStress =
      plantedCards.reduce((sum, plant) => sum + (plant.stressLevel ?? 0), 0) /
      plantedCards.length;
    const thirstyCount = plantedCards.filter(
      (plant) => (plant.hydration ?? 100) < 35,
    ).length;
    const stressedCount = plantedCards.filter(
      (plant) => (plant.stressLevel ?? 0) > 60,
    ).length;
    const pestCount = plantedCards.filter(
      (plant) => plant.healthStatus === "Pest Infestation",
    ).length;
    const hydrationPenalty = Math.max(0, 100 - avgHydration) * 0.45;
    const stressPenalty = avgStress * 0.3;
    const pestPenalty = pestCount * 12;
    const capacityPenalty = capacityRatio > 0.92 ? 6 : 0;
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            hydrationPenalty -
            stressPenalty -
            pestPenalty -
            capacityPenalty,
        ),
      ),
    );

    return {
      score,
      thirstyCount,
      stressedCount,
      pestCount,
      label: score >= 80 ? "Stable" : score >= 55 ? "Watch" : "Care",
      tone:
        score >= 80
          ? "text-garden-400"
          : score >= 55
            ? "text-amber-400"
            : "text-red-400",
      factors: [
        {
          label: "Hydration",
          detail:
            thirstyCount > 0
              ? `${thirstyCount} thirsty`
              : `${Math.round(avgHydration)}% avg`,
          impact: hydrationPenalty > 12 ? "Drag" : "Good",
          tone:
            hydrationPenalty > 12
              ? "border-blue-500/30 text-blue-200"
              : "border-garden-500/20 text-garden-300",
        },
        {
          label: "Stress",
          detail:
            stressedCount > 0
              ? `${stressedCount} high stress`
              : `${Math.round(avgStress)}% avg`,
          impact: stressPenalty > 15 ? "Drag" : "Good",
          tone:
            stressPenalty > 15
              ? "border-amber-500/30 text-amber-200"
              : "border-garden-500/20 text-garden-300",
        },
        {
          label: "Pests",
          detail: pestCount > 0 ? `${pestCount} flagged` : "Clear",
          impact: pestPenalty > 0 ? "Risk" : "Good",
          tone:
            pestPenalty > 0
              ? "border-red-500/30 text-red-200"
              : "border-garden-500/20 text-garden-300",
        },
        {
          label: "Capacity",
          detail: `${occupiedCells}/${totalCells || 0} cells`,
          impact: capacityPenalty > 0 ? "Full" : "Open",
          tone:
            capacityPenalty > 0
              ? "border-amber-500/30 text-amber-200"
              : "border-garden-500/20 text-garden-300",
        },
      ],
    };
  }, [occupiedCells, plantedCards, totalCells]);
  const gardenActivityEvents = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });

    const plantEvents = plantedCards.flatMap((plant) => {
      const plantName =
        catalog.find((item) => item.id === plant.catalogId)?.name ||
        plant.catalogId;
      const events: Array<{
        id: string;
        timestamp: number;
        label: string;
        detail: string;
      }> = [];

      if (plant.plantedDate) {
        events.push({
          id: `${plant.id}-planted`,
          timestamp: plant.plantedDate,
          label: "Planted",
          detail: plantName,
        });
      }

      if (plant.lastWateredDate) {
        events.push({
          id: `${plant.id}-watered`,
          timestamp: plant.lastWateredDate,
          label: "Watered",
          detail: plantName,
        });
      }

      for (const observation of plant.observations ?? []) {
        events.push({
          id: observation.id,
          timestamp: observation.timestamp,
          label: observation.label,
          detail: plantName,
        });
      }

      return events;
    });
    const logbookEvents = logbookEntries
      .filter((entry) => !activeGardenId || entry.bedId === activeGardenId)
      .filter((entry) =>
        ["planting", "move", "move_undo", "harvest", "lost_harvest"].includes(
          entry.type,
        ),
      )
      .map((entry) => ({
        id: entry.id,
        timestamp: entry.date,
        label:
          entry.type === "lost_harvest"
            ? "Lost"
            : entry.type === "move_undo"
              ? "Undo"
              : entry.type === "move"
                ? "Moved"
                : entry.type === "planting"
                  ? "Planted"
                  : "Harvested",
        detail: entry.itemName,
      }));

    return [...plantEvents, ...logbookEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(
        (event, index, events) =>
          index ===
          events.findIndex(
            (candidate) =>
              candidate.label === event.label &&
              candidate.detail === event.detail &&
              Math.abs(candidate.timestamp - event.timestamp) < 1000,
          ),
      )
      .slice(0, 6)
      .map((event) => ({
        ...event,
        dateLabel: Number.isFinite(event.timestamp)
          ? formatter.format(new Date(event.timestamp))
          : "Now",
      }));
  }, [activeGardenId, catalog, logbookEntries, plantedCards]);
  const dailyCareGroups = useMemo(() => {
    type CareTask = {
      id: string;
      label: string;
      detail: string;
      priority: "Now" | "Next";
      tone: string;
      onAction: () => void;
    };

    const now: CareTask[] = [];
    const next: CareTask[] = [];

    for (const plant of plantedCards) {
      const catalogItem = catalog.find((item) => item.id === plant.catalogId);
      const plantName = catalogItem?.name || plant.catalogId;

      if ((plant.hydration ?? 100) < 35) {
        now.push({
          id: `${plant.id}-water`,
          label: "Water",
          detail: `${plantName} is at ${Math.round(plant.hydration ?? 0)}% hydration.`,
          priority: "Now",
          tone: "border-blue-500/30 bg-blue-950/20 text-blue-200",
          onAction: () => setSelectedPlant(plant),
        });
      }

      if (
        (plant.stressLevel ?? 0) > 60 ||
        plant.healthStatus === "Pest Infestation"
      ) {
        now.push({
          id: `${plant.id}-check`,
          label: "Check",
          detail: `${plantName} needs a closer look.`,
          priority: "Now",
          tone: "border-amber-500/30 bg-amber-950/20 text-amber-200",
          onAction: () => setSelectedPlant(plant),
        });
      }

      if (catalogItem?.stages?.length) {
        const currentStageId = calculateCurrentStage(
          plant.plantedDate,
          catalogItem.stages,
          currentTimestamp,
        );
        const currentStageIndex = catalogItem.stages.findIndex(
          (stage) => stage.id === currentStageId,
        );
        if (currentStageIndex >= catalogItem.stages.length - 1) {
          next.push({
            id: `${plant.id}-harvest`,
            label: "Harvest",
            detail: `${plantName} is in ${catalogItem.stages[currentStageIndex]?.name || "final"} stage.`,
            priority: "Next",
            tone: "border-garden-500/30 bg-garden-950/20 text-garden-200",
            onAction: () => setSelectedPlant(plant),
          });
        }
      }
    }

    const openCells = Math.max(0, totalCells - occupiedCells);
    const seasonalSeedNames = inventoryItems
      .map((item) => catalog.find((plant) => plant.id === item.catalogId))
      .filter((plant): plant is PlantSpecies => Boolean(plant))
      .filter(
        (plant) =>
          isSowingSeason(
            plant,
            { id: "user_location", hemisphere: "North", frost_data: {} },
            currentMonth,
          ).eligible,
      )
      .map((plant) => plant.name);

    if (openCells > 0 && seasonalSeedNames.length > 0) {
      next.push({
        id: "seasonal-planting",
        label: "Plant",
        detail: `${seasonalSeedNames.slice(0, 2).join(", ")} ${seasonalSeedNames.length > 2 ? `+${seasonalSeedNames.length - 2}` : ""} in season.`,
        priority: "Next",
        tone: "border-garden-500/30 bg-garden-950/20 text-garden-200",
        onAction: () => setPlantNowMode(true),
      });
    }

    const weatherAlerts = alerts.filter(
      (alert) => !alert.toLowerCase().includes("conditions normal"),
    );
    if (weatherAlerts.length > 0) {
      now.push({
        id: "weather-alert",
        label: "Weather",
        detail: weatherAlerts[0],
        priority: "Now",
        tone: "border-red-500/30 bg-red-950/20 text-red-200",
        onAction: () => setSpectralLayer("health"),
      });
    }

    return {
      Now: now.slice(0, 3),
      Next: next.slice(0, 3),
      count: now.length + next.length,
    };
  }, [
    alerts,
    catalog,
    currentMonth,
    currentTimestamp,
    inventoryItems,
    occupiedCells,
    plantedCards,
    totalCells,
  ]);

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
        <header className="z-30 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 bg-stone-950/88 px-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:gap-4">
            {/* 1. Cycle Day */}
            <div className="bg-stone-900/80 px-2 sm:px-3 py-1.5 rounded-full border border-stone-700/80 text-xs font-black text-garden-300 uppercase tracking-widest shadow-inner flex items-center gap-1 sm:gap-2 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-garden-500" />{" "}
              <span>{currentDateTimeLabel}</span>
              <span className="text-stone-500">Day {currentDay}</span>
            </div>

            {/* 2. Grid Capacity */}
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest shadow-inner shrink-0 ${
                isGridFull
                  ? "bg-red-900/30 border-red-700 text-red-400"
                  : "bg-stone-900/80 border-stone-700/80 text-stone-300"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>
                {occupiedCells}/{totalCells}
              </span>
            </div>
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/80 px-2 py-1.5 text-xs font-bold uppercase tracking-widest shadow-inner sm:flex sm:px-3">
              <Activity className={`h-3.5 w-3.5 ${gardenHealth.tone}`} />
              <span className="text-stone-500">{gardenHealth.label}</span>
            </div>
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/80 px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-stone-400 shadow-inner sm:flex sm:px-3">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              <span>{gardenHealth.thirstyCount} Water</span>
              <span className="text-stone-700">/</span>
              <span>{gardenHealth.stressedCount} Watch</span>
              {gardenHealth.pestCount > 0 && (
                <>
                  <span className="text-stone-700">/</span>
                  <span className="text-red-400">
                    {gardenHealth.pestCount} Pest
                  </span>
                </>
              )}
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
            <div className="hidden xl:flex bg-stone-900/85 p-1 rounded-xl border border-stone-700/80 shadow-inner shrink-0 scale-90 origin-right">
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
                Health
              </button>
              <button
                onClick={() => setSpectralLayer("nutrients")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "nutrients" ? "bg-purple-900/40 text-purple-400 shadow-md" : "text-stone-500"}`}
              >
                Nutrients
              </button>
              <button
                onClick={() => setSpectralLayer("companions")}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${spectralLayer === "companions" ? "bg-garden-900/40 text-garden-400 shadow-md" : "text-stone-500"}`}
              >
                Companion Fit
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
          {/* LEFT SIDEBAR: BAG */}
          <div className="hidden xl:flex">
            <InventoryTray
              catalog={catalog}
              onOpenStore={onOpenSeedStore || (() => {})}
              isVertical={true}
              plantNowMode={plantNowMode}
              onTogglePlantNow={() => setPlantNowMode((v) => !v)}
              plantNowSet={plantNowSet}
              selectedSeedInventoryId={selectedSeed?.inventoryId}
              onSelectSeed={(seed) => {
                if (selectedSeed?.inventoryId === seed.inventoryId) {
                  setSelectedSeed(null);
                  setActiveSeedCatalogId(null);
                  return;
                }
                setSelectedSeed(seed);
                setActiveSeedCatalogId(seed.catalogId);
                showInfo(`Tap an open garden space to plant ${seed.name}.`);
              }}
            />
          </div>

          {/* MAIN CONTENT COLUMN */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-primary/20">
            <div className="relative flex h-11 items-center gap-2 overflow-x-auto border-b border-stone-800/80 bg-stone-950/76 px-2 shadow-lg backdrop-blur-md no-scrollbar sm:h-12 sm:px-4">
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
                        title="Primary garden"
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
                    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-stone-700/80 bg-stone-950/82 p-2 shadow-lg backdrop-blur-md no-scrollbar sm:gap-2">
                      <div className="shrink-0 border-r border-stone-700 px-2 text-[11px] font-bold uppercase text-stone-400 sm:text-[13px]">
                        {activeGarden.type}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 border-r border-stone-700 px-2 text-[11px] font-bold uppercase text-stone-400 sm:text-[13px]">
                        <SunMedium className="h-3.5 w-3.5 text-amber-300" />
                        {activeGarden.sunExposure}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 border-r border-stone-700 px-2 text-[11px] font-bold uppercase text-stone-400 sm:text-[13px]">
                        <Droplets className="h-3.5 w-3.5 text-blue-300" />
                        {activeGarden.soilType}
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
                    {selectedSeed && (
                      <div className="flex max-w-full items-center gap-2 rounded-xl border border-garden-500/30 bg-garden-950/80 px-3 py-2 text-xs font-semibold text-garden-100 shadow-lg backdrop-blur-md">
                        <Sprout className="h-4 w-4 text-garden-300" />
                        <span className="truncate">
                          Tap an open space to plant {selectedSeed.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeed(null);
                            setActiveSeedCatalogId(null);
                          }}
                          className="ml-auto rounded-lg border border-garden-400/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-garden-200 hover:bg-garden-500/10"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeGarden && (
                  <div className="hidden shrink-0 border-b border-stone-800 bg-stone-950/45 px-3 py-2 backdrop-blur-sm sm:px-5 xl:block lg:px-6">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                      <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                        <History className="h-3.5 w-3.5 text-garden-400" />
                        Recent
                      </div>
                      {gardenActivityEvents.length > 0 ? (
                        gardenActivityEvents.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/80 px-3 text-left text-[11px] text-stone-300"
                            title={`${event.label}: ${event.detail}`}
                          >
                            <span className="font-black uppercase text-garden-300">
                              {event.label}
                            </span>
                            <span className="max-w-28 truncate text-stone-500">
                              {event.detail}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-stone-600">
                              {event.dateLabel}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="h-9 rounded-lg border border-dashed border-stone-800 px-3 py-2 text-[11px] font-semibold text-stone-600">
                          Plant, water, or observe to start the garden timeline.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeGarden && (
                  <div className="shrink-0 border-b border-stone-800/80 bg-stone-950/48 px-3 py-2 backdrop-blur-sm sm:px-5 lg:px-6">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                      <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                        <ClipboardList className="h-3.5 w-3.5 text-garden-400" />
                        Today
                      </div>
                      {dailyCareGroups.count === 0 ? (
                        <div className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-garden-500/20 bg-garden-950/10 px-3 text-[11px] font-semibold text-garden-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          All clear for now
                        </div>
                      ) : (
                        <>
                          {(["Now", "Next"] as const).flatMap((group) =>
                            dailyCareGroups[group].map((task) => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={task.onAction}
                                className={`flex h-10 max-w-[18rem] shrink-0 items-center gap-2 rounded-lg border px-3 text-left text-[11px] ${task.tone}`}
                                title={`${task.label}: ${task.detail}`}
                              >
                                <span className="rounded bg-stone-950/50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                  {task.priority}
                                </span>
                                <span className="font-black uppercase">
                                  {task.label}
                                </span>
                                <span className="truncate text-stone-400">
                                  {task.detail}
                                </span>
                              </button>
                            )),
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeGarden && (
                  <div className="shrink-0 border-b border-stone-800/80 bg-stone-950/42 px-3 py-2 backdrop-blur-sm sm:px-5 lg:px-6">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                      <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                        <Activity
                          className={`h-3.5 w-3.5 ${gardenHealth.tone}`}
                        />
                        Health
                      </div>
                      {gardenHealth.factors.map((factor) => (
                        <div
                          key={factor.label}
                          className={`flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-stone-900/70 px-3 text-[11px] ${factor.tone}`}
                          title={`${factor.label}: ${factor.detail}`}
                        >
                          <span className="font-black uppercase">
                            {factor.label}
                          </span>
                          <span className="text-stone-500">
                            {factor.detail}
                          </span>
                          <span className="rounded bg-stone-950/60 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
                            {factor.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* THE FIELD */}

                <main className="flex flex-1 items-center justify-center overflow-y-auto overflow-x-hidden px-3 pb-4 pt-16 sm:px-5 sm:pb-5 sm:pt-20 xl:p-12">
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
                        if (user) {
                          markSyncing("Syncing plant removal...");
                          try {
                            await deleteCloudPlantedPlant(user.id, item.id);
                            markSynced("Plant removal synced.");
                          } catch (error) {
                            handleCloudSyncError(
                              "Plant removal cloud sync failed.",
                              error,
                            );
                          }
                        }
                        showInfo("Plant removed from garden");
                      }}
                      onOpenObservation={setObservationPlant}
                      onPlantAt={handleTapPlant}
                      currentDay={currentTimestamp}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <AlertCircle className="w-12 h-12 text-stone-500 mb-4" />
                      <h3 className="text-center text-[21px] font-bold uppercase tracking-widest text-stone-400">
                        No Garden Yet
                      </h3>
                      <p className="text-stone-500 text-[15px] mt-2">
                        Create a garden bed to begin planting.
                      </p>
                      <button
                        onClick={() => {
                          setDialogMode("create");
                          setShowGardenDialog(true);
                        }}
                        className="mt-6 px-6 py-2 bg-garden-600 text-stone-900 rounded-lg font-bold uppercase tracking-widest hover:bg-garden-500 transition-colors"
                      >
                        Create Garden
                      </button>
                    </div>
                  )}
                </main>
              </div>

              {/* RIGHT PANE: INTELLIGENCE (Inspector stays docked if plant selected) */}
              <aside
                className={`fixed inset-x-3 bottom-24 top-24 z-40 flex flex-col overflow-hidden rounded-2xl border border-border-primary glass transition-all duration-500 xl:static xl:inset-auto xl:bottom-auto xl:top-auto xl:rounded-none xl:border-l ${
                  selectedPlant
                    ? "translate-y-0 opacity-100 xl:w-[26rem]"
                    : "pointer-events-none translate-y-8 opacity-0 xl:w-0 xl:translate-y-0 xl:opacity-100"
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
                      Plant Details
                    </p>
                    <p className="text-[12px] text-stone-600 italic">
                      Select a plant to see care history, lifecycle, and notes.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>

          <div className="xl:hidden">
            <InventoryTray
              catalog={catalog}
              onOpenStore={onOpenSeedStore || (() => {})}
              droppableId="inventory-tray-mobile"
              plantNowMode={plantNowMode}
              onTogglePlantNow={() => setPlantNowMode((v) => !v)}
              plantNowSet={plantNowSet}
              selectedSeedInventoryId={selectedSeed?.inventoryId}
              onSelectSeed={(seed) => {
                if (selectedSeed?.inventoryId === seed.inventoryId) {
                  setSelectedSeed(null);
                  setActiveSeedCatalogId(null);
                  return;
                }
                setSelectedSeed(seed);
                setActiveSeedCatalogId(seed.catalogId);
                showInfo(`Tap an open garden space to plant ${seed.name}.`);
              }}
            />
          </div>
        </div>

        <DragOverlay
          dropAnimation={null}
          adjustScale={false}
          modifiers={[snapOverlayCenterToCursor]}
        >
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
