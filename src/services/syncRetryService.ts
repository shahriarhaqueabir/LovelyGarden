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

  await Promise.all([
    ...gardens.map((garden) => upsertCloudGarden(ownerId, garden.toJSON())),
    ...inventory.map((item) =>
      upsertCloudInventoryItem(ownerId, item.toJSON()),
    ),
    ...planted.map((plant) => upsertCloudPlantedPlant(ownerId, plant.toJSON())),
    ...logbook.map((entry) => upsertCloudLogbookEntry(ownerId, entry.toJSON())),
    settings
      ? upsertCloudUserSettings(ownerId, settings.toJSON())
      : Promise.resolve(),
  ]);

  const [syncedGardens, syncedInventory, syncedPlanted, syncedLogbook] =
    await Promise.all([
      syncGardensWithCloud(
        ownerId,
        gardens.map((garden) => garden.toJSON()),
      ),
      syncInventoryWithCloud(
        ownerId,
        inventory.map((item) => item.toJSON()),
      ),
      syncPlantedPlantsWithCloud(
        ownerId,
        planted.map((plant) => plant.toJSON()),
      ),
      syncLogbookWithCloud(
        ownerId,
        logbook.map((entry) => entry.toJSON()),
      ),
    ]);

  await Promise.all([
    ...syncedGardens.map((garden) => db.gardens.upsert(garden)),
    ...syncedInventory.map((item) => db.inventory.upsert(item)),
    ...syncedPlanted.map((plant) => db.planted.upsert(plant)),
    ...syncedLogbook.map((entry) => db.logbook.upsert(entry)),
  ]);

  setSyncStatus("synced", "Saved local changes synced.");
};
