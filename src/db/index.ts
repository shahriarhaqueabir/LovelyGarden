import { createRxDatabase, RxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { catalogSchema, sourceSchema, settingsSchema, plantedSchema, inventorySchema, plantKbSchema, gardenSchema, logbookSchema } from './schemas';
import { ExpandedPlantKBSchema } from '../schema/zod-schemas';
import type { CatalogDocument, PlantKbDocument, SettingsDocument, GardenDocument } from './types';

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
        name: 'raidas_garden_v3', // Incremented for fresh schema versioning
        storage: getRxStorageDexie(),
        ignoreDuplicate: true,
      });

      await db.addCollections({
        catalog: { 
          schema: catalogSchema,
          migrationStrategies: {
            '1': (oldDoc: MigrationDoc<CatalogDocument>) => { return oldDoc; },
            '2': (oldDoc: MigrationDoc<CatalogDocument>) => { return oldDoc; }
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
            '3': (oldDoc: MigrationDoc<PlantKbDocument>) => { return oldDoc; },
            '4': (oldDoc: MigrationDoc<PlantKbDocument>) => { return oldDoc; }
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
        },
        logbook: { schema: logbookSchema }
      });

      return db;
    })();
  }
  
  return await dbPromise;
};

interface SourceMetadata {
  source_name: string;
  [key: string]: unknown;
}

interface RawPlantData {
  id: string;
  name: string;
  scientific_name?: string;
  notes?: string;
  family?: string;
  plant_type?: string;
  life_cycle?: string;
  growth_habit?: string[];
  photosynthesis_type?: string;
  edible_parts?: string[];
  toxic_parts?: string[];
  pollination_type?: string;
  sowingSeason?: string[];
  sowingMethod?: string;
  requirements?: Record<string, unknown>;
  stages?: Array<{ 
    id: string; 
    name?: string; 
    durationDays: number; 
    waterFrequencyDays?: number;
    imageAssetId?: string 
  }>;
  companions?: string[];
  antagonists?: string[];
  seasonality?: unknown;
  sunlight?: string;
  water_requirements?: string;
  soil_type?: string[];
  common_pests?: string[];
  common_diseases?: string[];
  nutrient_preferences?: string[];
  source_metadata?: SourceMetadata[];
}

interface KBEntry {
  plant_id?: string;
  id?: string;
  common_name?: string;
  scientific_name?: string;
  type?: string;
  family?: string;
  growth_stage?: string[];
  stages?: Array<{
    id: string;
    name?: string;
    durationDays?: number;
    waterFrequencyDays?: number;
    imageAssetId?: string;
  }>;
  seasonality?: Record<string, unknown>;
  sunlight?: string;
  water_requirements?: string;
  growth_habit?: string[];
  pollination_type?: string;
  sowingSeason?: string[];
  notes?: string;
}

const generateDefaultStages = (category: string = 'vegetable', lifeCycle: string = 'annual'): any[] => {
  const isTree = category.toLowerCase().includes('tree') || category.toLowerCase() === 'fruit' || lifeCycle?.toLowerCase() === 'perennial';
  const isHerb = category.toLowerCase() === 'herb';
  
  if (isTree) {
    return [
      { id: 'germination', name: 'Germination', durationDays: 30, waterFrequencyDays: 3, imageAssetId: 'germination_generic' },
      { id: 'seedling', name: 'Sapling Phase', durationDays: 365, waterFrequencyDays: 7, imageAssetId: 'sapling_generic' },
      { id: 'vegetative', name: 'Active Growth', durationDays: 365 * 2, waterFrequencyDays: 10, imageAssetId: 'vegetative_tree' },
      { id: 'flowering', name: 'Bloom Cycle', durationDays: 45, waterFrequencyDays: 5, imageAssetId: 'flowering_generic' },
      { id: 'fruiting', name: 'Fruit Set', durationDays: 90, waterFrequencyDays: 4, imageAssetId: 'fruiting_generic' },
      { id: 'harvest', name: 'Harvest Window', durationDays: 30, waterFrequencyDays: 5, imageAssetId: 'harvest_generic' },
      { id: 'dormant', name: 'Dormancy', durationDays: 120, waterFrequencyDays: 14, imageAssetId: 'dormant_generic' }
    ];
  }

  if (isHerb) {
    return [
      { id: 'germination', name: 'Germination', durationDays: 10, waterFrequencyDays: 1, imageAssetId: 'germination_generic' },
      { id: 'seedling', name: 'Establishment', durationDays: 14, waterFrequencyDays: 2, imageAssetId: 'seedling_generic' },
      { id: 'vegetative', name: 'Foliage Growth', durationDays: 60, waterFrequencyDays: 3, imageAssetId: 'vegetative_generic' },
      { id: 'harvest', name: 'Pruning / Harvest', durationDays: 90, waterFrequencyDays: 3, imageAssetId: 'harvest_generic' }
    ];
  }

  // Default Vegetable Cycle
  return [
    { id: 'germination', name: 'Germination', durationDays: 7, waterFrequencyDays: 1, imageAssetId: 'germination_generic' },
    { id: 'seedling', name: 'Seedling Phase', durationDays: 14, waterFrequencyDays: 2, imageAssetId: 'seedling_generic' },
    { id: 'vegetative', name: 'Vegetative Growth', durationDays: 35, waterFrequencyDays: 3, imageAssetId: 'vegetative_generic' },
    { id: 'flowering', name: 'Flowering Stage', durationDays: 14, waterFrequencyDays: 2, imageAssetId: 'flowering_generic' },
    { id: 'fruiting', name: 'Fruiting', durationDays: 30, waterFrequencyDays: 3, imageAssetId: 'fruiting_generic' },
    { id: 'harvest', name: 'Peak Harvest', durationDays: 21, waterFrequencyDays: 2, imageAssetId: 'harvest_generic' }
  ];
};

/**
 * DATA SYNTHESIS UTILITIES
 */
const synthesizePlantData = (
  plant: RawPlantData, 
  kbLookup: Map<string, KBEntry>
): RawPlantData => {
  const kbMatch = kbLookup.get(plant.id);
  
  let stages = plant.stages;
  if (!stages || stages.length === 0) {
    if (kbMatch?.stages) {
      stages = kbMatch.stages as any;
    } else if (kbMatch?.growth_stage) {
      stages = kbMatch.growth_stage.map((sId: string) => ({
         id: sId,
         name: sId.charAt(0).toUpperCase() + sId.slice(1),
         durationDays: 20 
      }));
    } else {
      stages = generateDefaultStages(plant.plant_type, plant.life_cycle);
    }
  }

  return {
    ...plant,
    stages,
    growth_habit: plant.growth_habit || kbMatch?.growth_habit || ['bushy'],
    pollination_type: plant.pollination_type || kbMatch?.pollination_type || 'insect',
    sowingSeason: plant.sowingSeason || kbMatch?.sowingSeason || [],
    seasonality: plant.seasonality || kbMatch?.seasonality,
    sunlight: plant.sunlight || kbMatch?.sunlight,
    water_requirements: plant.water_requirements || kbMatch?.water_requirements,
    soil_type: plant.soil_type || (kbMatch as any)?.soil_type || [],
    common_pests: plant.common_pests || (kbMatch as any)?.common_pests || [],
    common_diseases: plant.common_diseases || (kbMatch as any)?.common_diseases || [],
    nutrient_preferences: plant.nutrient_preferences || (kbMatch as any)?.nutrient_preferences || []
  };
};

const mapToCatalogDocument = (plant: RawPlantData): CatalogDocument => {
  const reqs = plant.requirements || {};
  return {
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientific_name,
    description: plant.notes || '',
    family: plant.family || '',
    genus: '',
    species: '',
    categories: [plant.plant_type || 'vegetable'],
    life_cycle: plant.life_cycle || 'annual',
    growth_habit: plant.growth_habit || ['bushy'],
    photosynthesis_type: plant.photosynthesis_type || 'C3',
    edible_parts: plant.edible_parts || [],
    toxic_parts: plant.toxic_parts || [],
    pollination_type: plant.pollination_type || 'insect',
    sowingSeason: (plant.sowingSeason || []) as any,
    sowingMethod: plant.sowingMethod || 'Direct',
    stages: (plant.stages || []).map((s) => ({
      ...s,
      id: s.id as any,
      name: s.name || (typeof s.id === 'string' ? s.id.charAt(0).toUpperCase() + s.id.slice(1) : 'Growth Stage'),
      durationDays: s.durationDays || 20,
      waterFrequencyDays: s.waterFrequencyDays || 3,
      imageAssetId: s.imageAssetId || 'sprout_generic'
    })),
    companions: plant.companions || [],
    antagonists: plant.antagonists || [],
    confidence_score: 0.95,
    sources: (plant.source_metadata || []).map((m) => m.source_name || 'unknown'),
    seasonality: plant.seasonality as any,
    sunlight: (reqs.sunlight as string) || plant.sunlight,
    water_requirements: (reqs.water_requirements as string) || plant.water_requirements,
    soil_type: plant.soil_type || [],
    common_pests: plant.common_pests || [],
    common_diseases: plant.common_diseases || [],
    nutrient_preferences: plant.nutrient_preferences || [],
    source_metadata: plant.source_metadata as any
  };
};

const handleDemoGardens = async (db: RxDatabase) => {
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
         await db.gardens.upsert(garden);
         if (garden.id === 'main-garden') mainGardenCreated = true;
     }
  }

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
};

export const hydrateDatabase = async () => {
  const db = await getDatabase();
  const settings = await db.settings.findOne('local-user').exec();
  const currentDataVersion = 6;
  
  if (settings?.firstLoadComplete && (settings.dataVersion || 0) >= currentDataVersion) {
    await handleDemoGardens(db);
    return;
  }

  console.log(`Starting data hydration (v${currentDataVersion})...`);
  
  if (settings?.firstLoadComplete) {
    await Promise.all([
      db.catalog.find().remove(),
      db.plant_kb.find().remove(),
      db.sources.find().remove()
    ]);
  }

  try {
    const [sourcesRes, plantCatalogRes, plantKbJsonRes] = await Promise.all([
      fetch('/data/sources.json'),
      fetch('/data/plants-catalog.json'),
      fetch('/data/plants-kb.json').catch(() => null)
    ]);

    const sources = await sourcesRes.json();
    const plantCatalogRaw = await plantCatalogRes.json() as RawPlantData[];
    const plantKbJsonData = (plantKbJsonRes ? await plantKbJsonRes.json() : []) as KBEntry[];
    const kbLookup = new Map<string, KBEntry>(plantKbJsonData.map((p) => [p.plant_id || p.id || '', p]));

    const catalogData = plantCatalogRaw
      .map(p => synthesizePlantData(p, kbLookup))
      .filter((plant) => {
        const result = ExpandedPlantKBSchema.safeParse({ 
          ...plant, 
          plant_id: plant.id, 
          common_name: plant.name 
        });
        return result.success;
      })
      .map(mapToCatalogDocument);

    const rxKbData = catalogData.map((plant) => ({
      plant_id: plant.id,
      common_name: plant.name,
      scientific_name: plant.scientificName,
      type: plant.categories?.[0],
      family: plant.family,
      notes: plant.description,
      sowingSeason: plant.sowingSeason,
      seasonality: plant.seasonality,
      sunlight: plant.sunlight,
      water_requirements: plant.water_requirements,
      companion_plants: plant.companions,
      incompatible_plants: plant.antagonists,
      life_cycle: plant.life_cycle,
      growth_habit: plant.growth_habit,
      photosynthesis_type: plant.photosynthesis_type,
      edible_parts: plant.edible_parts,
      toxic_parts: plant.toxic_parts,
      pollination_type: plant.pollination_type,
      stages: plant.stages,
      common_pests: plant.common_pests,
      common_diseases: plant.common_diseases,
      nutrient_preferences: plant.nutrient_preferences,
      source_metadata: plant.source_metadata
    }));

    await Promise.all([
      ...(sources as any[]).map((s) => db.sources.upsert(s)),
      ...catalogData.map((item) => db.catalog.upsert(item)),
      ...rxKbData.map((kbItem) => db.plant_kb.upsert(kbItem)),
      db.gardens.upsert({
        id: 'main-garden',
        name: 'Garden 1',
        type: 'In-ground',
        soilType: 'Loam',
        sunExposure: 'Full Sun',
        gridWidth: 4,
        gridHeight: 4,
        createdDate: Date.now(),
        backgroundColor: '#14532d',
        theme: 'forest'
      }),
      db.settings.upsert({
        id: 'local-user',
        firstLoadComplete: true,
        hemisphere: 'North', 
        city: 'Dresden',
        dataVersion: currentDataVersion
      })
    ]);

    console.log('Hydration complete!');
  } catch (error) {
    console.error('Hydration failed:', error);
  }
};
