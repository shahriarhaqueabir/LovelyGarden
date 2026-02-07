import { getDatabase } from './index';

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

    return id;
  } catch (error) {
    console.error('Error planting seed:', error);
    throw error;
  }
};


// --- GARDEN MANAGEMENT ---

export const createGarden = async (config: any) => {
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

export const updateGarden = async (id: string, updates: any) => {
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
      let newHydration = Math.max(0, (data.hydration || 100) - 15);
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
      let newHydration = Math.min(100, (data.hydration || 85) + 15);
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
 * FETCHING PLANTED CARDS
 */
export const getPlantedCards = async () => {
  const db = await getDatabase();
  return db.planted.find().exec();
};
