import { describe, expect, it } from "vitest";
import {
  getSyncStatusSnapshot,
  hasPendingLocalSync,
  setSyncStatus,
} from "../syncStatusService";

describe("syncStatusService", () => {
  it("tracks pending local work until a successful sync clears it", () => {
    setSyncStatus("synced", "Reset");

    setSyncStatus("error", "Saved locally.");
    expect(hasPendingLocalSync()).toBe(true);
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(1);

    setSyncStatus("syncing", "Retrying...");
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(1);

    setSyncStatus("synced", "Synced.");
    expect(hasPendingLocalSync()).toBe(false);
    expect(getSyncStatusSnapshot().pendingLocalCount).toBe(0);
  });
});
