type SyncState = "idle" | "syncing" | "synced" | "local" | "error";

export interface SyncStatusSnapshot {
  state: SyncState;
  message: string;
  pendingLocalCount: number;
  updatedAt: number;
}

type Listener = (snapshot: SyncStatusSnapshot) => void;

let snapshot: SyncStatusSnapshot = {
  state: "idle",
  message: "Sync idle",
  pendingLocalCount: 0,
  updatedAt: Date.now(),
};

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
): SyncStatusSnapshot => {
  const hasPendingLocalWork = state === "error" || state === "local";

  snapshot = {
    state,
    message,
    pendingLocalCount: hasPendingLocalWork
      ? Math.max(snapshot.pendingLocalCount, 1)
      : state === "syncing"
        ? snapshot.pendingLocalCount
        : 0,
    updatedAt: Date.now(),
  };
  emit();
  return snapshot;
};

export const hasPendingLocalSync = () => snapshot.pendingLocalCount > 0;
