import { getDatabase } from './index';

/**
 * PLANTING LOGIC
 */
export const plantSeed = async (catalogId: string, x: number, y: number, inventoryId: string) => {
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
      selector: { gridX: x, gridY: y, bedId: 'default-bed' }
    }).exec();
    
    if (existingPlant) {
      throw new Error(`Slot (${x}, ${y}) is already occupied`);
    }

    // 1. Insert into planted with simulation defaults
    await db.planted.insert({
      id,
      bedId: 'default-bed',
      catalogId,
      gridX: x,
      gridY: y,
      plantedDate: Date.now(),
      lastWateredDate: Date.now(),
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
