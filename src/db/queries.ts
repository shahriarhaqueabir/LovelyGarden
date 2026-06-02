import { getDatabase } from "./index";
import type { GardenDocument, LogbookDocument } from "./types";

// Type for garden configuration
interface GardenConfig {
  name: string;
  type: string;
  soilType?: string;
  sunExposure?: string;
  gridWidth: number;
  gridHeight: number;
  backgroundColor?: string;
  theme?: string;
}

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
};

/**
 * PLANTING LOGIC
 */
// --- PLANTING LOGIC ---

export const plantSeed = async (
  catalogId: string,
  x: number,
  y: number,
  inventoryId: string,
  gardenId: string = "main-garden",
) => {
  const db = await getDatabase();
  const id = `plant-${catalogId}-${x}-${y}-${Date.now()}`;

  try {
    // Check if inventory item exists
    const inventoryItem = await db.inventory.findOne(inventoryId).exec();
    if (!inventoryItem) {
      throw new Error(`Inventory item ${inventoryId} not found`);
    }

    // Check if slot is already occupied
    const existingPlant = await db.planted
      .findOne({
        selector: { gridX: x, gridY: y, bedId: gardenId },
      })
      .exec();

    if (existingPlant) {
      throw new Error(`Slot (${x}, ${y}) is already occupied`);
    }

    // 1. Insert into planted with real timestamp
    const plantedTimestamp = Date.now();
    await db.planted.insert({
      id,
      bedId: gardenId,
      catalogId,
      gridX: x,
      gridY: y,
      plantedDate: plantedTimestamp,
      lastWateredDate: plantedTimestamp,
      currentStageIndex: 0,
      healthStatus: "Healthy",
      hydration: 100,
      stressLevel: 0,
      nutrients: { n: 50, p: 50, k: 50 },
    });

    // 2. Remove from inventory
    await inventoryItem.remove();

    // 3. Log planting activity
    const catalogItem = await db.catalog.findOne(catalogId).exec();
    const plantName = catalogItem?.name || "Unknown Seed";
    await logPlanting(catalogId, plantName, gardenId);

    return id;
  } catch (error) {
    console.error("Error planting seed:", error);
    throw error;
  }
};

/**
 * RELOCATION LOGIC
 * Moves a plant between grid slots. Stats remain unchanged.
 */
export const relocatePlant = async (
  plantId: string,
  newX: number,
  newY: number,
  gardenId: string,
  options: { logType?: "move" | "move_undo" } = {},
) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();

  if (!plant) throw new Error("Plant not found");

  // Check if target slot is occupied
  const existing = await db.planted
    .findOne({
      selector: {
        gridX: newX,
        gridY: newY,
        bedId: gardenId,
        id: { $ne: plantId },
      },
    })
    .exec();

  if (existing) throw new Error("Target coordinates occupied");

  const previousX = plant.gridX;
  const previousY = plant.gridY;
  const previousGardenId = plant.bedId;
  const catalogId = plant.catalogId;

  await plant.patch({
    gridX: newX,
    gridY: newY,
    bedId: gardenId,
  });

  const catalogItem = await db.catalog.findOne(catalogId).exec();
  const plantName = catalogItem?.name || "Plant";
  await logMove(
    catalogId,
    plantName,
    gardenId,
    previousX,
    previousY,
    newX,
    newY,
    previousGardenId,
    options.logType ?? "move",
  );
};

/**
 * UNPLANTING LOGIC
 * Reclaims a young plant back into the bag.
 */
export const unplantSeed = async (plantId: string) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();

  if (!plant) throw new Error("Plant not found");

  const catalogId = plant.catalogId;
  const timestamp = Date.now();
  const inventoryId = `inv-${catalogId}-${timestamp}`;

  // 1. Re-insert into inventory
  await db.inventory.insert({
    id: inventoryId,
    catalogId,
    acquiredDate: timestamp,
  });

  // 2. Remove from planted
  await plant.remove();

  return inventoryId;
};

// --- GARDEN MANAGEMENT ---

export const createGarden = async (config: GardenConfig) => {
  console.log("Creating garden with config:", config);
  const db = await getDatabase();

  if (!db.gardens) {
    console.error("Gardens collection not found on database instance!");
    throw new Error("Database not fully initialized. Reloading...");
  }

  const id = `garden-${Date.now()}`;
  const newGarden = {
    id,
    name: config.name,
    type: config.type,
    soilType: config.soilType,
    sunExposure: config.sunExposure,
    gridWidth: Number(config.gridWidth),
    gridHeight: Number(config.gridHeight),
    backgroundColor: config.backgroundColor,
    theme: config.theme,
    createdDate: Date.now(),
  };

  try {
    await db.gardens.insert(newGarden);
    console.log("Garden created successfully:", id);
    return id;
  } catch (err) {
    console.error("Failed to create garden:", err);
    throw err;
  }
};

export const updateGarden = async (
  id: string,
  updates: Partial<GardenDocument>,
) => {
  const db = await getDatabase();
  const doc = await db.gardens.findOne(id).exec();
  if (doc) {
    await doc.patch(updates);
  }
};

export const deleteGarden = async (id: string) => {
  const db = await getDatabase();
  const doc = await db.gardens.findOne(id).exec();
  if (doc) {
    // Check if it's the last garden? Logic handled in UI, but good to ensure 1 exists.
    const allGardens = await db.gardens.find().exec();
    if (allGardens.length <= 1) {
      throw new Error("Cannot delete the last garden.");
    }
    await doc.remove();
    // Also remove all plants in this garden
    const plants = await db.planted.find({ selector: { bedId: id } }).exec();
    await Promise.all(plants.map((p) => p.remove()));
  }
};

/**
 * OBSERVATION & DIAGNOSTICS
 */
export const addPlantObservation = async (
  plantId: string,
  observation: {
    id: string;
    category: string;
    label: string;
    impact: {
      hydration?: number;
      stress?: number;
      n?: number;
      p?: number;
      k?: number;
    };
  },
) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();

  if (!plant) throw new Error("Plant not found");

  const data = plant.toJSON();
  const newObservations = [
    ...(data.observations || []),
    {
      id: observation.id,
      category: observation.category,
      label: observation.label,
      timestamp: Date.now(),
    },
  ];

  // Clear system diagnosis on manual observation (Human Override)
  const updates: Partial<import("./types").PlantedDocument> = {
    observations: newObservations,
    systemDiagnosis: undefined,
  };

  if (observation.impact.hydration !== undefined)
    updates.hydration = observation.impact.hydration;
  if (observation.impact.stress !== undefined) {
    // Stress impact is additive
    updates.stressLevel = Math.min(
      100,
      (data.stressLevel || 0) + observation.impact.stress,
    );
  }

  if (
    observation.impact.n !== undefined ||
    observation.impact.p !== undefined ||
    observation.impact.k !== undefined
  ) {
    updates.nutrients = {
      n: observation.impact.n ?? data.nutrients?.n ?? 50,
      p: observation.impact.p ?? data.nutrients?.p ?? 50,
      k: observation.impact.k ?? data.nutrients?.k ?? 50,
    };
  }

  // Auto-set health status based on category
  if (observation.category === "Pests") {
    updates.healthStatus = "Pest Infestation";
  } else if (
    observation.category === "Moisture" &&
    observation.impact.hydration !== undefined &&
    observation.impact.hydration > 90
  ) {
    updates.healthStatus = "Overwatered";
  }

  await plant.patch(updates);
};

export const waterPlant = async (plantId: string) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();
  if (!plant) throw new Error("Plant not found");

  const timestamp = Date.now();
  await plant.patch({
    hydration: 100,
    lastWateredDate: timestamp,
    stressLevel: Math.max(0, (plant.stressLevel || 0) - 10), // Watering reduces stress
  });
};

export const harvestPlant = async (
  plantId: string,
  itemName?: string,
  notes?: string,
) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();
  if (!plant) throw new Error("Plant not found");

  const data = plant.toJSON();
  const timestamp = Date.now();
  const catalogId = data.catalogId || "unknown-catalog";
  const bedId = data.bedId || "main-garden";

  // 1. Log to logbook
  const id = createId("harvest");
  await db.logbook.insert({
    id,
    type: "harvest",
    itemName: itemName || catalogId,
    category: "plants",
    date: timestamp,
    notes: notes || "Harvested from garden",
    catalogId,
    bedId,
  });

  // 2. Remove from garden
  await plant.remove();

  return { removedPlant: data, logbookId: id };
};

export const recordLoss = async (
  plantId: string,
  itemName?: string,
  reason?: string,
) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();
  if (!plant) throw new Error("Plant not found");

  const data = plant.toJSON();
  const timestamp = Date.now();
  const catalogId = data.catalogId || "unknown-catalog";
  const bedId = data.bedId || "main-garden";

  // 1. Log to logbook as lost
  const id = createId("loss");
  await db.logbook.insert({
    id,
    type: "lost_harvest",
    itemName: itemName || catalogId,
    category: "plants",
    date: timestamp,
    notes: reason || "Plant lost/died",
    catalogId,
    bedId,
  });

  // 2. Remove from garden
  await plant.remove();

  return { removedPlant: data, logbookId: id };
};

/**
 * LOGBOOK LOGIC
 */

export const logSeedPurchase = async (catalogId: string, itemName: string) => {
  const db = await getDatabase();
  const id = createId("log");
  const timestamp = Date.now();

  await db.logbook.insert({
    id,
    type: "seed_purchase",
    itemName,
    category: "seeds",
    date: timestamp,
    catalogId,
    bedId: "main-garden",
    notes: "Purchased from Seed Store",
  });

  return id;
};

export const logUserPurchase = async (
  itemName: string,
  category: string,
  date: number,
  notes?: string,
  catalogId: string = "manual-entry",
  bedId: string = "main-garden",
) => {
  const db = await getDatabase();
  const id = createId("log");

  await db.logbook.insert({
    id,
    type: "user_purchase",
    itemName,
    category,
    date,
    notes,
    catalogId,
    bedId,
  });

  return id;
};

export const logPlanting = async (
  catalogId: string,
  itemName: string,
  bedId: string = "main-garden",
) => {
  const db = await getDatabase();
  const id = createId("log");
  const timestamp = Date.now();

  await db.logbook.insert({
    id,
    type: "planting",
    itemName,
    category: "plants",
    date: timestamp,
    catalogId,
    bedId,
    notes: `Planted in ${bedId}`,
  });

  return id;
};

export const logMove = async (
  catalogId: string,
  itemName: string,
  bedId: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  fromBedId?: string,
  type: "move" | "move_undo" = "move",
) => {
  const db = await getDatabase();
  const id = createId(type);
  await db.logbook.insert({
    id,
    type,
    itemName,
    category: "garden",
    date: Date.now(),
    catalogId,
    bedId,
    notes:
      fromBedId && fromBedId !== bedId
        ? `${type === "move_undo" ? "Undo move" : "Moved"} from ${fromBedId} (${fromX}, ${fromY}) to ${bedId} (${toX}, ${toY})`
        : `${type === "move_undo" ? "Undo move" : "Moved"} from (${fromX}, ${fromY}) to (${toX}, ${toY})`,
  });

  return id;
};

export const getLogbookEntries = async () => {
  const db = await getDatabase();
  return db.logbook.find({ sort: [{ date: "desc" }] }).exec();
};

export const updateLogbookEntry = async (
  id: string,
  updates: Partial<LogbookDocument>,
) => {
  const db = await getDatabase();
  const doc = await db.logbook.findOne(id).exec();
  if (doc) {
    await doc.patch(updates);
    return doc.toJSON();
  }
  return null;
};

export const deleteLogbookEntry = async (id: string) => {
  const db = await getDatabase();
  const doc = await db.logbook.findOne(id).exec();
  if (doc) {
    await doc.remove();
    return true;
  }
  return false;
};

/**
 * FETCHING PLANTED CARDS
 */
export const getPlantedCards = async () => {
  const db = await getDatabase();
  return db.planted.find().exec();
};
