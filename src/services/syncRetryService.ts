import { getDatabase } from "../db";
import { upsertCloudGarden, syncGardensWithCloud } from "./gardenService";
import {
  upsertCloudInventoryItem,
  syncInventoryWithCloud,
} from "./inventoryService";
import {
  upsertCloudLogbookEntry,
  syncLogbookWithCloud,
} from "./logbookService";
import {
  upsertCloudPlantedPlant,
  syncPlantedPlantsWithCloud,
} from "./plantedPlantService";
import { setSyncStatus } from "./syncStatusService";
import { upsertCloudUserSettings } from "./userSettingsService";

export const retryPendingAccountSync = async (ownerId: string) => {
  setSyncStatus("syncing", "Retrying saved local changes...");

  const db = await getDatabase();
  const [gardens, inventory, planted, logbook, settings] = await Promise.all([
    db.gardens.find().exec(),
    db.inventory.find().exec(),
    db.planted.find().exec(),
    db.logbook.find().exec(),
    db.settings.findOne("local-user").exec(),
  ]);
  const localGardens = gardens.map((garden) => garden.toJSON());
  const localInventory = inventory.map((item) => item.toJSON());
  const localPlanted = planted.map((plant) => plant.toJSON());
  const localLogbook = logbook.map((entry) => entry.toJSON());

  await Promise.all([
    ...localGardens.map((garden) => upsertCloudGarden(ownerId, garden)),
    ...localInventory.map((item) => upsertCloudInventoryItem(ownerId, item)),
    ...localLogbook.map((entry) => upsertCloudLogbookEntry(ownerId, entry)),
    settings
      ? upsertCloudUserSettings(ownerId, settings.toJSON())
      : Promise.resolve(),
  ]);

  // Planted rows have an owner-scoped FK to gardens, so retry gardens first.
  await Promise.all(
    localPlanted.map((plant) => upsertCloudPlantedPlant(ownerId, plant)),
  );

  const syncedGardens = await syncGardensWithCloud(ownerId, localGardens);

  const [syncedInventory, syncedLogbook] = await Promise.all([
    syncInventoryWithCloud(ownerId, localInventory),
    syncLogbookWithCloud(ownerId, localLogbook),
  ]);

  const syncedPlanted = await syncPlantedPlantsWithCloud(ownerId, localPlanted);

  await Promise.all([
    ...syncedGardens.map((garden) => db.gardens.upsert(garden)),
    ...syncedInventory.map((item) => db.inventory.upsert(item)),
    ...syncedPlanted.map((plant) => db.planted.upsert(plant)),
    ...syncedLogbook.map((entry) => db.logbook.upsert(entry)),
  ]);

  setSyncStatus("synced", "Saved local changes synced.", {
    clearPending: true,
  });
};
