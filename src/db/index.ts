import { createRxDatabase, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { catalogSchema, sourceSchema, settingsSchema, plantedSchema, inventorySchema, plantKbSchema, gardenSchema } from './schemas';
import { PlantSpeciesSchema, ExpandedPlantKBSchema } from '../schema/zod-schemas';

/**
 * DATABASE INITIALIZATION
 */
let dbPromise: Promise<RxDatabase> | null = null;

export const getDatabase = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase({
        name: 'raidas_garden_db',
        storage: getRxStorageDexie(),
      });

      await db.addCollections({
        catalog: { schema: catalogSchema },
        sources: { schema: sourceSchema },
        planted: { schema: plantedSchema },
        inventory: { schema: inventorySchema },
        settings: { schema: settingsSchema },
        plant_kb: { schema: plantKbSchema },
        gardens: { schema: gardenSchema }
      });

      return db;
    })();
  }
  
  const db = await dbPromise;
  
  // Dynamic Hot-Patch: Ensure gardens collection exists (fixes HMR/Migration issues)
  if (!db.collections.gardens) {
    console.log('Hot-patching: Adding missing gardens collection...');
    await db.addCollections({
      gardens: { schema: gardenSchema }
    });
  }

  return db;
};

/**
 * HYDRATION LOGIC
 */
export const hydrateDatabase = async () => {
  const db = await getDatabase();
  
  // Check if already hydrated
  const settings = await db.settings.findOne('local-user').exec();
  if (settings && settings.firstLoadComplete) {
    
    // --- DEMO GARDENS / MIGRATION CHECK ---
    const existingGardens = await db.gardens.find().exec();
    const existingIds = new Set(existingGardens.map(g => g.get('id')));

    const demoGardens = [
      {
        id: 'main-garden',
        name: 'The Homestead',
        type: 'In-ground',
        soilType: 'Loam',
        sunExposure: 'Full Sun',
        gridWidth: 4,
        gridHeight: 3,
        createdDate: 1677640000000 // Fixed past date
      },
      {
        id: 'moon-greenhouse',
        name: 'Moonlight Glass', 
        type: 'Greenhouse',
        soilType: 'Custom Mix', // Good for exotic/mystical
        sunExposure: 'Full Shade',
        gridWidth: 3,
        gridHeight: 3,
        createdDate: 1677641000000
      },
      {
         id: 'desert-pot',
         name: 'Sunken Sands',
         type: 'Container',
         soilType: 'Sandy',
         sunExposure: 'Full Sun',
         gridWidth: 3,
         gridHeight: 2,
         createdDate: 1677642000000
      }
    ];

    let mainGardenCreated = false;

    for (const garden of demoGardens) {
       if (!existingIds.has(garden.id)) {
           console.log(`Creating prebuilt garden: ${garden.name}`);
           await db.gardens.insert(garden);
           if (garden.id === 'main-garden') mainGardenCreated = true;
       }
    }

    // Migration: If we just created the main garden (fresh migration), ensure orphaned plants are moved to it
    if (mainGardenCreated) {
      const planted = await db.planted.find().exec();
      const updates = planted.map(p => {
        if (!p.bedId || p.bedId === 'main') {
           return p.patch({ bedId: 'main-garden' });
        }
        return Promise.resolve();
      });
      await Promise.all(updates);
    }
    
    console.log('Database already hydrated');
    return;
  }

  console.log('Starting data hydration...');

  try {
    const [seedsRes, sourcesRes, plantKbRes] = await Promise.all([
      fetch('/data/seeds.json'),
      fetch('/data/sources.json'),
      fetch('/data/plants-kb.json')
    ]);

    const seeds = await seedsRes.json();
    const sources = await sourcesRes.json();
    const plantKbJson = await plantKbRes.json();
    const seedsRaw = seeds; // seeds is already an array from seedsRes.json()
    const plantKbRaw = Array.isArray(plantKbJson) ? plantKbJson : (plantKbJson.plants || []);

    // RUNTIME DATA VALIDATION WITH ZOD
    const validatedSeeds = seedsRaw.filter((seed: any) => {
      const result = PlantSpeciesSchema.safeParse(seed);
      if (!result.success) {
        console.warn(`Invalid seed data detected for "${seed.name || 'Unknown'}":`, result.error.format());
        return false;
      }
      return true;
    });

    const validatedPlantKb = plantKbRaw.filter((plant: any) => {
      const result = ExpandedPlantKBSchema.safeParse(plant);
      if (!result.success) {
        console.warn(`Invalid KB data detected for "${plant.common_name || 'Unknown'}":`, result.error.format());
        return false;
      }
      return true;
    });

    // Bulk insert
    await db.sources.bulkInsert(sources);
    await db.catalog.bulkInsert(validatedSeeds);
    await db.plant_kb.bulkInsert(validatedPlantKb);

    // Initial Garden
    await db.gardens.insert({
      id: 'main-garden',
      name: 'Main Garden',
      type: 'In-ground',
      soilType: 'Loam', // Default best
      sunExposure: 'Full Sun',
      gridWidth: 4,
      gridHeight: 3,
      createdDate: Date.now()
    });

    // Initial Hand (Phase 3 requirement: starting pack)
    // Initial Hand - CLEARED per user request
    // await db.inventory.bulkInsert([]);

    // Mark as complete
    await db.settings.upsert({
      id: 'local-user',
      firstLoadComplete: true,
      hemisphere: 'northern', // Default
      city: 'Unknown'
    });

    console.log('Hydration complete!');
  } catch (error) {
    console.error('Hydration failed:', error);
  }
};
