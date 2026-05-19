import { useState, useEffect } from "react";
import { getDatabase } from "../db";
import { Subscription } from "rxjs";
import type { InventoryDocument } from "../db/types";
import { useAuth } from "./useAuth";
import { syncInventoryWithCloud } from "../services/inventoryService";

/**
 * HOOK: useInventory
 * Subscribes to the RxDB 'inventory' collection and returns real-time updates.
 * (Note: Although schemas.ts didn't have 'inventory' initially, we should ensure it does).
 */
export const useInventory = () => {
  const [items, setItems] = useState<InventoryDocument[]>([]);
  const { user } = useAuth();

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
    if (!user) return;

    let cancelled = false;

    const syncUserInventory = async () => {
      const db = await getDatabase();
      const localItems = (await db.inventory.find().exec()).map((doc) =>
        doc.toJSON(),
      );
      const syncedItems = await syncInventoryWithCloud(user.id, localItems);

      if (cancelled) return;

      await Promise.all(syncedItems.map((item) => db.inventory.upsert(item)));
      setItems(syncedItems);
    };

    syncUserInventory().catch((error) => {
      console.warn("Inventory cloud sync failed:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return items;
};
