import { getDatabase } from './index';
import type { GardenDocument, LogbookDocument } from './types';

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

/**
 * PLANTING LOGIC
 */
// --- PLANTING LOGIC ---

export const plantSeed = async (catalogId: string, x: number, y: number, inventoryId: string, gardenId: string = 'main-garden') => {
  const db = await getDatabase();
  const id = `plant-${catalogId}-${x}-${y}-${Date.now()}`;

  try {
    // Check if inventory item exists
    const inventoryItem = await db.inventory.findOne(inventoryId).exec();
    if (!inventoryItem) {
      throw new Error(`Inventory item ${inventoryId} not found`);
    }

    // Check if slot is already occupied
    const existingPlant = await db.planted.findOne({
      selector: { gridX: x, gridY: y, bedId: gardenId }
    }).exec();
    
    if (existingPlant) {
      throw new Error(`Slot (${x}, ${y}) is already occupied`);
    }

    const settings = await db.settings.findOne('local-user').exec();
    const currentDay = settings?.currentDay || 1;

    // 1. Insert into planted with simulation defaults
    await db.planted.insert({
      id,
      bedId: gardenId,
      catalogId,
      gridX: x,
      gridY: y,
      plantedDate: currentDay,
      lastWateredDate: currentDay,
      currentStageIndex: 0,
      healthStatus: 'Healthy',
      hydration: 100,
      stressLevel: 0,
      nutrients: { n: 50, p: 50, k: 50 }
    });

    // 2. Remove from inventory
    await inventoryItem.remove();

    // 3. Log planting activity
    const catalogItem = await db.catalog.findOne(catalogId).exec();
    const plantName = catalogItem?.name || 'Unknown Seed';
    await logPlanting(catalogId, plantName);

    return id;
  } catch (error) {
    console.error('Error planting seed:', error);
    throw error;
  }
};

/**
 * RELOCATION LOGIC
 * Moves a plant between grid slots. Stats remain unchanged.
 */
export const relocatePlant = async (plantId: string, newX: number, newY: number, gardenId: string) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();
  
  if (!plant) throw new Error("Plant unit not found");
  
  // Check if target slot is occupied
  const existing = await db.planted.findOne({
    selector: { 
      gridX: newX, 
      gridY: newY, 
      bedId: gardenId,
      id: { $ne: plantId } 
    }
  }).exec();

  if (existing) throw new Error("Target coordinates occupied");

  await plant.patch({
    gridX: newX,
    gridY: newY,
    bedId: gardenId
  });
};

/**
 * UNPLANTING LOGIC
 * Reclaims a plant unit back into the bag.
 */
export const unplantSeed = async (plantId: string) => {
  const db = await getDatabase();
  const plant = await db.planted.findOne(plantId).exec();
  
  if (!plant) throw new Error("Plant unit not found");

  const catalogId = plant.catalogId;
  const timestamp = Date.now();

  // 1. Re-insert into inventory
  await db.inventory.insert({
    id: `inv-${catalogId}-${timestamp}`,
    catalogId,
    acquiredDate: timestamp
  });

  // 2. Remove from planted
  await plant.remove();
};


// --- GARDEN MANAGEMENT ---

export const createGarden = async (config: GardenConfig) => {
  console.log('Creating garden with config:', config);
  const db = await getDatabase();
  
  if (!db.gardens) {
    console.error('Gardens collection not found on database instance!');
    throw new Error('Database not fully initialized. Reloading...');
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
    createdDate: Date.now()
  };

  try {
    await db.gardens.insert(newGarden);
    console.log('Garden created successfully:', id);
    return id;
  } catch (err) {
    console.error('Failed to create garden:', err);
    throw err;
  }
};

export const updateGarden = async (id: string, updates: Partial<GardenDocument>) => {
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
    await Promise.all(plants.map(p => p.remove()));
  }
};

/**
 * ADVANCE GLOBAL TIME
 */
export const advanceGlobalDay = async () => {
  const db = await getDatabase();

  try {
    // 1. Increment global day
    const settings = await db.settings.findOne('local-user').exec();
    if (!settings) {
      throw new Error('Settings document not found');
    }
    
    const nextDay = (settings.currentDay || 0) + 1;
    await db.settings.upsert({
      ...settings.toJSON(),
      id: 'local-user',
      currentDay: nextDay
    });

    // 2. Update all planted items
    const plants = await db.planted.find().exec();
    for (const plant of plants) {
      const data = plant.toJSON();

      // Simple simulation:
      // - Hydration drops by 15% each day
      // - If hydration < 20, stress increases by 10
      // - Health status changes based on stress
      const newHydration = Math.max(0, (data.hydration || 100) - 15);
      let newStress = data.stressLevel || 0;

      if (newHydration < 20) {
        newStress = Math.min(100, newStress + 20);
      } else if (newHydration > 80) {
        newStress = Math.max(0, newStress - 5);
      }

      let health = 'Thriving';
      if (newStress > 80) health = 'Dying';
      else if (newStress > 50) health = 'Stressed';
      else if (newStress > 20) health = 'Wilting';

      await plant.patch({
        hydration: newHydration,
        stressLevel: newStress,
        healthStatus: health
      });
    }

    return nextDay;
  } catch (error) {
    console.error('Error advancing global day:', error);
    throw error;
  }
};

/**
 * REWIND GLOBAL TIME
 */
export const rewindGlobalDay = async () => {
  const db = await getDatabase();

  try {
    // 1. Decrement global day
    const settings = await db.settings.findOne('local-user').exec();
    if (!settings) {
      throw new Error('Settings document not found');
    }

    // Prevent going before day 1
    const currentDayValue = settings.currentDay || 1;
    if (currentDayValue <= 1) {
      return 1; // Already at minimum day
    }

    const previousDay = currentDayValue - 1;
    await db.settings.upsert({
      ...settings.toJSON(),
      id: 'local-user',
      currentDay: previousDay
    });

    // 2. Update all planted items (reverse the effects of advancing)
    const plants = await db.planted.find().exec();
    for (const plant of plants) {
      const data = plant.toJSON();

      // Reverse simulation effects:
      // - Hydration increases by 15% (undoing the decrease)
      // - Stress decreases by 20 (undoing the increase when hydration < 20)
      // - Stress increases by 5 (undoing the decrease when hydration > 80)
      const newHydration = Math.min(100, (data.hydration || 85) + 15);
      let newStress = data.stressLevel || 0;

      // Reverse stress changes based on previous hydration state
      if (newHydration - 15 < 20) { // If previously hydration was low, undo stress increase
        newStress = Math.max(0, newStress - 20);
      } else if (newHydration - 15 > 80) { // If previously hydration was high, undo stress decrease
        newStress = Math.min(100, newStress + 5);
      }

      // Reverse health status changes
      let health = 'Thriving';
      if (newStress > 80) health = 'Dying';
      else if (newStress > 50) health = 'Stressed';
      else if (newStress > 20) health = 'Wilting';

      await plant.patch({
        hydration: newHydration,
        stressLevel: newStress,
        healthStatus: health
      });
    }

    return previousDay;
  } catch (error) {
    console.error('Error rewinding global day:', error);
    throw error;
  }
};

/**
 * LOGBOOK LOGIC
 */

export const logSeedPurchase = async (catalogId: string, itemName: string) => {
  const db = await getDatabase();
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const timestamp = Date.now();

  await db.logbook.insert({
    id,
    type: 'seed_purchase',
    itemName,
    category: 'seeds',
    date: timestamp,
    catalogId,
    notes: 'Purchased from Seed Store'
  });
};

export const logUserPurchase = async (itemName: string, category: string, date: number, notes?: string) => {
  const db = await getDatabase();
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  await db.logbook.insert({
    id,
    type: 'user_purchase',
    itemName,
    category,
    date,
    notes
  });
};

export const logPlanting = async (catalogId: string, itemName: string) => {
  const db = await getDatabase();
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const timestamp = Date.now();

  await db.logbook.insert({
    id,
    type: 'planting',
    itemName,
    category: 'plants',
    date: timestamp,
    catalogId,
    notes: 'Planted in Main Garden'
  });
};

export const getLogbookEntries = async () => {
  const db = await getDatabase();
  return db.logbook.find({ sort: [{ date: 'desc' }] }).exec();
};

export const updateLogbookEntry = async (id: string, updates: Partial<LogbookDocument>) => {
  const db = await getDatabase();
  const doc = await db.logbook.findOne(id).exec();
  if (doc) {
    await doc.patch(updates);
  }
};

export const deleteLogbookEntry = async (id: string) => {
  const db = await getDatabase();
  const doc = await db.logbook.findOne(id).exec();
  if (doc) {
    await doc.remove();
  }
};

/**
 * FETCHING PLANTED CARDS
 */
export const getPlantedCards = async () => {
  const db = await getDatabase();
  return db.planted.find().exec();
};
