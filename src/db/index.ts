import { createRxDatabase, RxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { catalogSchema, sourceSchema, settingsSchema, plantedSchema, inventorySchema, plantKbSchema, gardenSchema } from './schemas';
import { ExpandedPlantKBSchema } from '../schema/zod-schemas';

// Register RxDB Plugins
addRxPlugin(RxDBMigrationSchemaPlugin);

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
        settings: { 
          schema: settingsSchema,
          migrationStrategies: {
            1: (oldDoc: any) => {
              return {
                ...oldDoc,
                xp: 0 // Initialize xp for existing users
              };
            }
          }
        },
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
        soilType: 'Loam', // Balanced
        sunExposure: 'Full Sun',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: 1677640000000
      },
      {
        id: 'moon-greenhouse',
        name: 'Moonlight Glass', 
        type: 'Greenhouse',
        soilType: 'Custom Mix', // Magic/Exotic
        sunExposure: 'Full Shade',
        gridWidth: 3,
        gridHeight: 3,
        createdDate: 1677641000000
      },
      {
         id: 'desert-pot',
         name: 'Sunken Sands',
         type: 'Container',
         soilType: 'Sandy', // Xeric
         sunExposure: 'Full Sun',
         gridWidth: 2,
         gridHeight: 2,
         createdDate: 1677642000000
      },
      {
        id: 'shadow-grove',
        name: 'Shadow Grove',
        type: 'In-ground',
        soilType: 'Silt', // Moisture retention
        sunExposure: 'Partial Shade',
        gridWidth: 3,
        gridHeight: 3,
        createdDate: 1677643000000
      },
      {
        id: 'vertical-haven',
        name: 'Vertical Haven',
        type: 'Vertical',
        soilType: 'Loam',
        sunExposure: 'Partial Sun',
        gridWidth: 3,
        gridHeight: 3,
        createdDate: 1677644000000
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
    const [sourcesRes, plantKbRes] = await Promise.all([
      fetch('/data/sources.json'),
      fetch('/data/plants-kb.json')
    ]);

    const sources = await sourcesRes.json();
    const plantKbJson = await plantKbRes.json();
    const plantKbRaw = Array.isArray(plantKbJson) ? plantKbJson : (plantKbJson.plants || []);

    // 1. Validate KB data
    const validatedPlantKb = plantKbRaw.filter((plant: any) => {
      const result = ExpandedPlantKBSchema.safeParse(plant);
      if (!result.success) {
        console.warn(`Invalid KB data detected for "${plant.common_name || 'Unknown'}":`, result.error.format());
        return false;
      }
      return true;
    });

    // 2. Map KB data to Catalog structure (for backward compatibility with components)
    const catalogData = validatedPlantKb.map((kb: any) => ({
      id: kb.plant_id,
      name: kb.common_name,
      scientificName: kb.scientific_name,
      description: kb.notes || '',
      family: kb.family || '',
      genus: '',
      species: '',
      categories: [kb.type || 'vegetable'],
      life_cycle: 'annual',
      growth_habit: ['bushy'],
      photosynthesis_type: 'C3',
      edible_parts: [],
      toxic_parts: [],
      pollination_type: 'insect',
      sowingSeason: kb.sowingSeason || [],
      sowingMethod: kb.sowingMethod || 'Direct',
      stages: (kb.stages || []).map((s: any) => ({
        ...s,
        imageAssetId: 'sprout_generic' // Ensure required image field is present
      })),
      companions: kb.companion_plants || [],
      antagonists: kb.incompatible_plants || [],
      confidence_score: 0.95,
      sources: (kb.source_metadata || []).map((m: any) => m.source_name)
    }));

    // Bulk insert
    await db.sources.bulkInsert(sources);
    await db.catalog.bulkInsert(catalogData);
    await db.plant_kb.bulkInsert(validatedPlantKb);

    // Initial Garden
    await db.gardens.insert({
      id: 'main-garden',
      name: 'Main Garden',
      type: 'In-ground',
      soilType: 'Loam', // Default best
      sunExposure: 'Full Sun',
      gridWidth: 4,
      gridHeight: 4,
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
