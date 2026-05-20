import { useState, useEffect } from "react";
import { getDatabase } from "../db";
import { Subscription } from "rxjs";
import type { LogbookDocument } from "../db/types";
import { useAuth } from "./useAuth";
import { syncLogbookWithCloud } from "../services/logbookService";
import { setSyncStatus } from "../services/syncStatusService";
import { showWarning } from "../lib/toast";

/**
 * HOOK: useLogbook
 * Subscribes to the RxDB 'logbook' collection and returns real-time updates.
 */
export const useLogbook = () => {
  const [entries, setEntries] = useState<LogbookDocument[]>([]);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();

      if (!db.logbook) {
        console.error("Logbook collection not found in DB");
        return;
      }

      // Sort by date descending
      const query = db.logbook.find({
        sort: [{ date: "desc" }],
      });

      sub = query.$.subscribe((results) => {
        setEntries(results.map((doc) => doc.toJSON()));
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

    const syncUserLogbook = async () => {
      setSyncStatus("syncing", "Syncing logbook...");
      const db = await getDatabase();
      const localEntries = (await db.logbook.find().exec()).map((doc) =>
        doc.toJSON(),
      );
      const syncedEntries = await syncLogbookWithCloud(userId, localEntries);

      if (cancelled) return;

      await Promise.all(syncedEntries.map((entry) => db.logbook.upsert(entry)));
      setEntries(syncedEntries);
      setSyncStatus("synced", "Logbook synced.");
    };

    syncUserLogbook().catch((error) => {
      console.warn("Logbook cloud sync failed:", error);
      setSyncStatus("error", "Logbook sync failed. Changes are saved locally.");
      showWarning("Logbook sync failed. Saved locally for now.");
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return entries;
};
