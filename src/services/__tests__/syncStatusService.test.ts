import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSyncStatusSnapshot,
  hasPendingLocalSync,
  setSyncStatus,
} from "../syncStatusService";

describe("syncStatusService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tracks pending local work until a successful sync clears it", () => {
    setSyncStatus("synced", "Reset", { clearPending: true });

    setSyncStatus("error", "Saved locally.");
    expect(hasPendingLocalSync()).toBe(true);
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(1);

    setSyncStatus("syncing", "Retrying...");
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(1);

    setSyncStatus("synced", "Synced.", { clearPending: true });
    expect(hasPendingLocalSync()).toBe(false);
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(0);
  });

  it("keeps pending local work when an unrelated mini-sync succeeds", () => {
    setSyncStatus("synced", "Reset", { clearPending: true });

    setSyncStatus("error", "Planting failed locally.");
    setSyncStatus("synced", "Seed bag synced.");

    expect(hasPendingLocalSync()).toBe(true);
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(1);
  });

  it("does not treat signed-out local mode as pending sync work", () => {
    setSyncStatus("synced", "Reset", { clearPending: true });

    setSyncStatus("error", "Saved locally.");
    setSyncStatus("local", "Signed out.");

    expect(hasPendingLocalSync()).toBe(false);
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(0);
  });
});
