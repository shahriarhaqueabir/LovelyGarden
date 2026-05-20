import { useState, useEffect } from "react";
import { getDatabase } from "../db";
import { Subscription } from "rxjs";
import type { InventoryDocument } from "../db/types";
import { useAuth } from "./useAuth";
import { syncInventoryWithCloud } from "../services/inventoryService";
import { setSyncStatus } from "../services/syncStatusService";
import { showWarning } from "../lib/toast";

/**
 * HOOK: useInventory
 * Subscribes to the RxDB 'inventory' collection and returns real-time updates.
 * (Note: Although schemas.ts didn't have 'inventory' initially, we should ensure it does).
 */
export const useInventory = () => {
  const [items, setItems] = useState<InventoryDocument[]>([]);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();

      // Ensure the collection exists (defensive)
      if (!db.inventory) {
        console.error("Inventory collection not found in DB");
        return;
      }

      const query = db.inventory.find();

      sub = query.$.subscribe((results) => {
        setItems(results.map((doc) => doc.toJSON()));
      });
    };

    init();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const syncUserInventory = async () => {
      setSyncStatus("syncing", "Syncing seed bag...");
      const db = await getDatabase();
      const localItems = (await db.inventory.find().exec()).map((doc) =>
        doc.toJSON(),
      );
      const syncedItems = await syncInventoryWithCloud(userId, localItems);

      if (cancelled) return;

      await Promise.all(syncedItems.map((item) => db.inventory.upsert(item)));
      setItems(syncedItems);
      setSyncStatus("synced", "Seed bag synced.");
    };

    syncUserInventory().catch((error) => {
      console.warn("Inventory cloud sync failed:", error);
      setSyncStatus(
        "error",
        "Seed bag sync failed. Changes are saved locally.",
      );
      showWarning("Seed bag sync failed. Saved locally for now.");
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return items;
};
