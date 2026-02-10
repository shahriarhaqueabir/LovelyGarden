import { createRxDatabase, RxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { catalogSchema, sourceSchema, settingsSchema, plantedSchema, inventorySchema, plantKbSchema, gardenSchema } from './schemas';
import { ExpandedPlantKBSchema } from '../schema/zod-schemas';
import type { CatalogDocument, PlantKbDocument, SourceDocument, SettingsDocument, GardenDocument } from './types';

// Type for migration documents
type MigrationDoc<T> = T & { _rev?: string; _attachments?: Record<string, unknown> };

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
        ignoreDuplicate: true,
      });

      await db.addCollections({
        catalog: { 
          schema: catalogSchema,
          migrationStrategies: {
            '1': (oldDoc: MigrationDoc<CatalogDocument>) => { return oldDoc; }
          }
        },
        sources: { schema: sourceSchema },
        planted: { schema: plantedSchema },
        inventory: { schema: inventorySchema },
        settings: { 
          schema: settingsSchema,
          migrationStrategies: {
            '1': (oldDoc: MigrationDoc<SettingsDocument>) => {
              return {
                ...oldDoc,
                xp: 0 // Initialize xp for existing users
              };
            },
            '2': (oldDoc: MigrationDoc<SettingsDocument>) => {
              return {
                ...oldDoc,
                dataVersion: 0 // Initialize dataVersion for existing users
              };
            }
          }
        },
        plant_kb: {
          schema: plantKbSchema,
          migrationStrategies: {
            '1': (oldDoc: MigrationDoc<PlantKbDocument>) => { return oldDoc; },
            '2': (oldDoc: MigrationDoc<PlantKbDocument>) => { return oldDoc; },
            '3': (oldDoc: MigrationDoc<PlantKbDocument>) => { return oldDoc; }
          }
        },
        gardens: { 
          schema: gardenSchema,
          migrationStrategies: {
            '1': (oldDoc: MigrationDoc<GardenDocument>) => {
              return {
                ...oldDoc,
                backgroundColor: '#14532d', // Default forest green
                theme: 'forest'
              };
            }
          }
        }
      });

      return db;
    })();
  }
  
  return await dbPromise;
};

/**
 * HYDRATION LOGIC
 */
export const hydrateDatabase = async () => {
  const db = await getDatabase();
  
  // Check if already hydrated
  const settings = await db.settings.findOne('local-user').exec();
  const currentDataVersion = 3; // Increment this when botanical structure changes
  
  if (settings && settings.firstLoadComplete && (settings.dataVersion || 0) >= currentDataVersion) {
    
    // --- DEMO GARDENS / MIGRATION CHECK ---
    const existingGardens = await db.gardens.find().exec();
    const existingIds = new Set(existingGardens.map(g => g.get('id')));

    const demoGardens = [
      {
        id: 'main-garden',
        name: 'Garden 1',
        type: 'In-ground',
        soilType: 'Loam', 
        sunExposure: 'Full Sun',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: 1677640000000,
        backgroundColor: '#14532d',
        theme: 'forest'
      },
      {
        id: 'moon-greenhouse',
        name: 'Garden 2', 
        type: 'Greenhouse',
        soilType: 'Custom Mix',
        sunExposure: 'Full Shade',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: 1677641000000,
        backgroundColor: '#1e1b4b',
        theme: 'midnight'
      },
      {
        id: 'desert-pot',
        name: 'Garden 3',
        type: 'Container',
        soilType: 'Sandy',
        sunExposure: 'Full Sun',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: 1677642000000,
        backgroundColor: '#451a03',
        theme: 'desert'
      },
      {
        id: 'shadow-grove',
        name: 'Garden 4',
        type: 'In-ground',
        soilType: 'Silt',
        sunExposure: 'Partial Shade',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: 1677643000000,
        backgroundColor: '#14532d',
        theme: 'forest'
      },
      {
        id: 'vertical-haven',
        name: 'Garden 5',
        type: 'Vertical',
        soilType: 'Loam',
        sunExposure: 'Partial Sun',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: 1677644000000,
        backgroundColor: '#14532d',
        theme: 'forest'
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

  console.log(`Starting data hydration (v${currentDataVersion})...`);
  
  // Clear old catalog/kb if updating
  if (settings?.firstLoadComplete) {
    console.log('Update detected: Refreshing catalog intelligence...');
    await db.catalog.find().remove();
    await db.plant_kb.find().remove();
    await db.sources.find().remove();
  }

  try {
    const [sourcesRes, plantKbRes] = await Promise.all([
      fetch('/data/sources.json'),
      fetch('/data/plants-kb.json')
    ]);

    const sources = await sourcesRes.json();
    const plantKbJson = await plantKbRes.json();
    const plantKbRaw = Array.isArray(plantKbJson) ? plantKbJson : (plantKbJson.plants || []);

    // 1. Validate KB data
    const validatedPlantKb = plantKbRaw.filter((plant: PlantKbDocument) => {
      const result = ExpandedPlantKBSchema.safeParse(plant);
      if (!result.success) {
        console.warn(`Invalid KB data detected for "${plant.common_name || 'Unknown'}":`, result.error.format());
        return false;
      }
      return true;
    });

    // 2. Map KB data to Catalog structure (for backward compatibility with components)
    const catalogData = validatedPlantKb.map((kb: PlantKbDocument) => ({
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
      stages: (kb.stages || []).map((s: { id?: string; name?: string; durationDays?: number; waterFrequencyDays?: number }) => ({
        ...s,
        imageAssetId: 'sprout_generic' // Ensure required image field is present
      })),
      companions: kb.companion_plants || [],
      antagonists: kb.incompatible_plants || [],
      confidence_score: 0.95,
      sources: (kb.source_metadata || []).map((m: { source_name?: string }) => m.source_name),
      // Expanded Fields
      seasonality: kb.seasonality,
      sunlight: kb.sunlight,
      water_requirements: kb.water_requirements,
      soil_type: kb.soil_type || [],
      common_pests: kb.common_pests || [],
      common_diseases: kb.common_diseases || [],
      nutrient_preferences: kb.nutrient_preferences || [],
      source_metadata: kb.source_metadata || []
    }));

    // Bulk upsert logic (using individual upserts for safety or bulkUpsert if available)
    for (const source of sources as SourceDocument[]) {
      await db.sources.upsert(source);
    }
    for (const item of catalogData) {
      await db.catalog.upsert(item);
    }
    for (const kbItem of validatedPlantKb) {
      await db.plant_kb.upsert(kbItem);
    }

    // Initial Garden
    await db.gardens.upsert({
      id: 'main-garden',
      name: 'Garden 1',
      type: 'In-ground',
      soilType: 'Loam', // Default best
      sunExposure: 'Full Sun',
      gridWidth: 4,
      gridHeight: 4,
      createdDate: Date.now(),
      backgroundColor: '#14532d',
      theme: 'forest'
    });

    // Initial Hand (Phase 3 requirement: starting pack)
    // Initial Hand - CLEARED per user request
    // await db.inventory.bulkInsert([]);

    // Mark as complete
    await db.settings.upsert({
      id: 'local-user',
      firstLoadComplete: true,
      hemisphere: 'northern', // Default
      city: 'Unknown',
      dataVersion: currentDataVersion
    });

    console.log('Hydration complete!');
  } catch (error) {
    console.error('Hydration failed:', error);
  }
};
