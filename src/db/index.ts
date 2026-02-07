import { createRxDatabase, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { catalogSchema, sourceSchema, settingsSchema, plantedSchema, inventorySchema, plantKbSchema } from './schemas';

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
        plant_kb: { schema: plantKbSchema }
      });

      return db;
    })();
  }
  return dbPromise;
};

/**
 * HYDRATION LOGIC
 */
export const hydrateDatabase = async () => {
  const db = await getDatabase();
  
  // Check if already hydrated
  const settings = await db.settings.findOne('local-user').exec();
  if (settings && settings.firstLoadComplete) {
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
    const plantKb = Array.isArray(plantKbJson) ? plantKbJson : (plantKbJson.plants || []);

    // Bulk insert
    await db.sources.bulkInsert(sources);
    await db.catalog.bulkInsert(seeds);
    await db.plant_kb.bulkInsert(plantKb);

    // Initial Hand (Phase 3 requirement: starting pack)
    await db.inventory.bulkInsert([
      { id: 'inv-1', catalogId: 'tomato-beefsteak', acquiredDate: Date.now() },
      { id: 'inv-2', catalogId: 'basil-genovese', acquiredDate: Date.now() },
      { id: 'inv-3', catalogId: 'carrot-danvers', acquiredDate: Date.now() },
      { id: 'inv-4', catalogId: 'marigold-french', acquiredDate: Date.now() }
    ]);

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
