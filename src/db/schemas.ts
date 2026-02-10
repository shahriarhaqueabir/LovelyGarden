import { RxJsonSchema } from 'rxdb';
import type { CatalogDocument, PlantKbDocument, SourceDocument, InventoryDocument, PlantedDocument, SettingsDocument, GardenDocument, LogbookDocument } from './types';

export const catalogSchema: RxJsonSchema<CatalogDocument> = {
  title: 'catalog',
  version: 2,
  description: 'Master library of plants',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    scientificName: { type: 'string' },
    description: { type: 'string' },
    family: { type: 'string' },
    genus: { type: 'string' },
    species: { type: 'string' },
    categories: { type: 'array', items: { type: 'string' } },
    life_cycle: { type: 'string' },
    growth_habit: { type: 'array', items: { type: 'string' } },
    photosynthesis_type: { type: 'string' },
    edible_parts: { type: 'array', items: { type: 'string' } },
    toxic_parts: { type: 'array', items: { type: 'string' } },
    pollination_type: { type: 'string' },
    sowingSeason: { type: 'array', items: { type: 'string' } },
    sowingMethod: { type: 'string' },
    stages: { type: 'array', items: { type: 'object' } },
    companions: { type: 'array', items: { type: 'string' } },
    antagonists: { type: 'array', items: { type: 'string' } },
    confidence_score: { type: 'number' },
    sources: { type: 'array', items: { type: 'string' } },
    // Expanded Fields for Command Center UI
    seasonality: { type: 'object' },
    sunlight: { type: 'string' },
    water_requirements: { type: 'string' },
    soil_type: { type: 'array', items: { type: 'string' } },
    common_pests: { type: 'array', items: { type: 'string' } },
    common_diseases: { type: 'array', items: { type: 'string' } },
    nutrient_preferences: { type: 'array', items: { type: 'string' } },
    source_metadata: { type: 'array', items: { type: 'object' } }
  },
  required: ['id', 'name', 'stages']
};

export const plantKbSchema: RxJsonSchema<PlantKbDocument> = {
  title: 'plant_kb',
  version: 4,
  description: 'Expanded plant knowledge base (seasonality, pests, diseases, nutrients, sources) hydrated from plants-kb.json',
  primaryKey: 'plant_id',
  type: 'object',
  properties: {
    plant_id: { type: 'string', maxLength: 100 },
    common_name: { type: 'string' },
    scientific_name: { type: 'string' },
    type: { type: 'string' },
    family: { type: 'string' },
    growth_stage: { type: 'array', items: { type: 'string' } },
    sowingSeason: { type: 'array', items: { type: 'string' } },
    sowingMethod: { type: 'string' },
    seasonality: { type: 'object' },
    sunlight: { type: 'string' },
    water_requirements: { type: 'string' },
    soil_type: { type: 'array', items: { type: 'string' } },
    companion_plants: { type: 'array', items: { type: 'string' } },
    incompatible_plants: { type: 'array', items: { type: 'string' } },
    common_pests: { type: 'array', items: { type: 'string' } },
    common_diseases: { type: 'array', items: { type: 'string' } },
    nutrient_preferences: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
    life_cycle: { type: 'string' },
    growth_habit: { type: 'array', items: { type: 'string' } },
    photosynthesis_type: { type: 'string' },
    edible_parts: { type: 'array', items: { type: 'string' } },
    toxic_parts: { type: 'array', items: { type: 'string' } },
    pollination_type: { type: 'string' },
    stages: { 
      type: 'array', 
      items: { 
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          durationDays: { type: 'number' },
          waterFrequencyDays: { type: 'number' }
        }
      } 
    },
    source_metadata: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source_name: { type: 'string' },
          url: { type: 'string' },
          confidence_score: { type: 'number' }
        }
      }
    }
  },
  required: ['plant_id', 'common_name']
};

export const sourceSchema: RxJsonSchema<SourceDocument> = {
  title: 'sources',
  version: 0,
  description: 'Authoritative sources',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    type: { type: 'string' },
    url: { type: 'string' },
    credibility_tier: { type: 'string' }
  },
  required: ['id', 'name', 'type']
};

export const inventorySchema: RxJsonSchema<InventoryDocument> = {
  title: 'inventory',
  version: 0,
  description: 'User held seeds',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    catalogId: { type: 'string' },
    acquiredDate: { type: 'number' },
    notes: { type: 'string' }
  },
  required: ['id', 'catalogId', 'acquiredDate']
};

export const plantedSchema: RxJsonSchema<PlantedDocument> = {
  title: 'planted',
  version: 0,
  description: 'Plants currently in the ground',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    bedId: { type: 'string' },
    catalogId: { type: 'string' },
    gridX: { type: 'number' },
    gridY: { type: 'number' },
    plantedDate: { type: 'number' },
    lastWateredDate: { type: 'number' },
    currentStageIndex: { type: 'number' },
    healthStatus: { type: 'string' },
    customName: { type: 'string' },
    hydration: { type: 'number' }, // 0 to 100
    stressLevel: { type: 'number' }, // 0 to 100
    nutrients: {
      type: 'object',
      properties: {
        n: { type: 'number' },
        p: { type: 'number' },
        k: { type: 'number' }
      }
    }
  },
  indexes: ['bedId'],
  required: ['id', 'bedId', 'catalogId', 'gridX', 'gridY', 'plantedDate']
};

export const settingsSchema: RxJsonSchema<SettingsDocument> = {
  title: 'settings',
  version: 2,
  description: 'User settings',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    firstLoadComplete: { type: 'boolean' },
    hemisphere: { type: 'string' },
    city: { type: 'string' },
    currentDay: { type: 'number' },
    xp: { type: 'number' },
    dataVersion: { type: 'number' }
  },
  required: ['id', 'firstLoadComplete']
};

export const gardenSchema: RxJsonSchema<GardenDocument> = {
  title: 'gardens',
  version: 1,
  description: 'User defined garden beds',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    type: { type: 'string' }, // In-ground, Raised Bed, Container, Greenhouse
    soilType: { type: 'string' }, // Clay, Loam, Sandy, Custom Mix
    sunExposure: { type: 'string' }, // Full Sun, Partial Shade, Full Shade
    gridWidth: { type: 'number' },
    gridHeight: { type: 'number' },
    createdDate: { type: 'number' },
    backgroundColor: { type: 'string' },
    theme: { type: 'string' }
  },
  required: ['id', 'name', 'type', 'gridWidth', 'gridHeight']
};

export const logbookSchema: RxJsonSchema<LogbookDocument> = {
  title: 'logbook',
  version: 0,
  description: 'Log of garden activities and purchases',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    type: { type: 'string' },
    itemName: { type: 'string' },
    category: { type: 'string' },
    quantity: { type: 'number' },
    price: { type: 'number' },
    currency: { type: 'string' },
    vendor: { type: 'string' },
    date: { type: 'number' },
    notes: { type: 'string' },
    catalogId: { type: 'string' }
  },
  required: ['id', 'type', 'itemName', 'date']
};
