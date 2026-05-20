import { useState, useEffect } from "react";
import { getDatabase } from "../db";
import { Subscription } from "rxjs";
import type { PlantedDocument } from "../db/types";
import { useAuth } from "./useAuth";
import { syncPlantedPlantsWithCloud } from "../services/plantedPlantService";
import { setSyncStatus } from "../services/syncStatusService";
import { showWarning } from "../lib/toast";

/**
 * HOOK: usePlantedCards
 * Subscribes to the RxDB 'planted' collection and returns real-time updates.
 */
export const usePlantedCards = (gardenId?: string) => {
  const [cards, setCards] = useState<PlantedDocument[]>([]);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();

      // If no gardenId, do not fetch anything (prevents loading all plants initially)
      if (!gardenId) {
        setCards([]);
        return;
      }

      const query = db.planted.find({ selector: { bedId: gardenId } });

      sub = query.$.subscribe((results) => {
        setCards(results.map((doc) => doc.toJSON()));
      });
    };

    init();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [gardenId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const syncUserPlantedPlants = async () => {
      setSyncStatus("syncing", "Syncing planted garden...");
      const db = await getDatabase();
      const localPlants = (await db.planted.find().exec()).map((doc) =>
        doc.toJSON(),
      );
      const syncedPlants = await syncPlantedPlantsWithCloud(
        userId,
        localPlants,
      );

      if (cancelled) return;

      await Promise.all(syncedPlants.map((plant) => db.planted.upsert(plant)));
      setSyncStatus("synced", "Planted garden synced.");
    };

    syncUserPlantedPlants().catch((error) => {
      console.warn("Planted garden cloud sync failed:", error);
      setSyncStatus(
        "error",
        "Planted garden sync failed. Changes are saved locally.",
      );
      showWarning("Planted garden sync failed. Saved locally for now.");
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return cards;
};
