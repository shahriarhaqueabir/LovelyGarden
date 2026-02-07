import { getDatabase } from './index';

/**
 * PLANTING LOGIC
 */
export const plantSeed = async (catalogId: string, x: number, y: number, inventoryId: string) => {
  const db = await getDatabase();
  const id = `plant-${catalogId}-${x}-${y}-${Date.now()}`;
  
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
  const item = await db.inventory.findOne(inventoryId).exec();
  if (item) {
    await item.remove();
  }
  
  return id;
};

/**
 * ADVANCE GLOBAL TIME
 */
export const advanceGlobalDay = async () => {
  const db = await getDatabase();
  
  // 1. Increment global day
  const settings = await db.settings.findOne('local-user').exec();
  const nextDay = (settings?.currentDay || 0) + 1;
  await db.settings.upsert({
    ...settings?.toJSON(),
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
};

/**
 * FETCHING PLANTED CARDS
 */
export const getPlantedCards = async () => {
  const db = await getDatabase();
  return db.planted.find().exec();
};
