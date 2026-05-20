type SyncState = "idle" | "syncing" | "synced" | "local" | "error";

export interface SyncStatusSnapshot {
  state: SyncState;
  message: string;
  pendingLocalCount: number;
  updatedAt: number;
}

type Listener = (snapshot: SyncStatusSnapshot) => void;

const STORAGE_KEY = "lovely-garden-sync-status";

const defaultSnapshot: SyncStatusSnapshot = {
  state: "idle",
  message: "Sync idle",
  pendingLocalCount: 0,
  updatedAt: Date.now(),
};

const readPersistedSnapshot = (): SyncStatusSnapshot | null => {
  if (typeof globalThis.localStorage === "undefined") return null;

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SyncStatusSnapshot>;
    if (
      !parsed.state ||
      typeof parsed.message !== "string" ||
      typeof parsed.pendingLocalCount !== "number" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }
    return parsed as SyncStatusSnapshot;
  } catch {
    return null;
  }
};

const persistSnapshot = (nextSnapshot: SyncStatusSnapshot) => {
  if (typeof globalThis.localStorage === "undefined") return;

  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshot));
  } catch {
    // Storage persistence is a convenience; sync state still works in memory.
  }
};

let snapshot: SyncStatusSnapshot = readPersistedSnapshot() ?? defaultSnapshot;

const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener(snapshot));
};

export const getSyncStatusSnapshot = () => snapshot;

export const subscribeToSyncStatus = (listener: Listener) => {
  listeners.add(listener);
  listener(snapshot);

  return () => {
    listeners.delete(listener);
  };
};

export const setSyncStatus = (
  state: SyncState,
  message: string,
  options: { clearPending?: boolean } = {},
): SyncStatusSnapshot => {
  const hasPendingLocalWork = state === "error";
  const shouldClearPending = state === "local" || options.clearPending;

  snapshot = {
    state,
    message,
    pendingLocalCount: hasPendingLocalWork
      ? Math.max(snapshot.pendingLocalCount, 1)
      : shouldClearPending
        ? 0
        : snapshot.pendingLocalCount,
    updatedAt: Date.now(),
  };
  persistSnapshot(snapshot);
  emit();
  return snapshot;
};

export const hasPendingLocalSync = () => snapshot.pendingLocalCount > 0;
