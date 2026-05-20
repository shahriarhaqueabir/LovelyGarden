import { beforeEach, describe, expect, it, vi } from "vitest";

const callOrder: string[] = [];
const upsertLocalGarden = vi.fn();
const upsertLocalInventory = vi.fn();
const upsertLocalPlanted = vi.fn();
const upsertLocalLogbook = vi.fn();

vi.mock("../../db", () => ({
  getDatabase: vi.fn(async () => ({
    gardens: {
      find: () => ({
        exec: async () => [
          { toJSON: () => ({ id: "garden-1", name: "Garden" }) },
        ],
      }),
      upsert: upsertLocalGarden,
    },
    inventory: {
      find: () => ({
        exec: async () => [
          { toJSON: () => ({ id: "inventory-1", catalogId: "plant-1" }) },
        ],
      }),
      upsert: upsertLocalInventory,
    },
    planted: {
      find: () => ({
        exec: async () => [
          { toJSON: () => ({ id: "planted-1", bedId: "garden-1" }) },
        ],
      }),
      upsert: upsertLocalPlanted,
    },
    logbook: {
      find: () => ({
        exec: async () => [
          { toJSON: () => ({ id: "log-1", itemName: "Entry" }) },
        ],
      }),
      upsert: upsertLocalLogbook,
    },
    settings: {
      findOne: () => ({
        exec: async () => ({ toJSON: () => ({ id: "local-user" }) }),
      }),
    },
  })),
}));

vi.mock("../gardenService", () => ({
  upsertCloudGarden: vi.fn(async () => {
    callOrder.push("garden");
    return { id: "garden-1" };
  }),
  syncGardensWithCloud: vi.fn(async () => [{ id: "garden-1" }]),
}));

vi.mock("../inventoryService", () => ({
  upsertCloudInventoryItem: vi.fn(async () => ({ id: "inventory-1" })),
  syncInventoryWithCloud: vi.fn(async () => [{ id: "inventory-1" }]),
}));

vi.mock("../logbookService", () => ({
  upsertCloudLogbookEntry: vi.fn(async () => ({ id: "log-1" })),
  syncLogbookWithCloud: vi.fn(async () => [{ id: "log-1" }]),
}));

vi.mock("../plantedPlantService", () => ({
  upsertCloudPlantedPlant: vi.fn(async () => {
    callOrder.push("planted");
    return { id: "planted-1" };
  }),
  syncPlantedPlantsWithCloud: vi.fn(async () => [{ id: "planted-1" }]),
}));

vi.mock("../userSettingsService", () => ({
  upsertCloudUserSettings: vi.fn(async () => ({ id: "local-user" })),
}));

vi.mock("../syncStatusService", () => ({
  setSyncStatus: vi.fn(),
}));

describe("retryPendingAccountSync", () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.clearAllMocks();
  });

  it("retries gardens before planted plants to satisfy owner-scoped FK order", async () => {
    const { retryPendingAccountSync } = await import("../syncRetryService");

    await retryPendingAccountSync("user-1");

    expect(callOrder).toEqual(["garden", "planted"]);
  });
});
