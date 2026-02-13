import { PlantStage } from '../schema/knowledge-graph';

// RxDB Document Types
export interface CatalogDocument {
  id: string;
  name: string;
  scientificName?: string;
  description?: string;
  family?: string;
  genus?: string;
  species?: string;
  categories?: string[];
  life_cycle?: string;
  growth_habit?: string[];
  photosynthesis_type?: string;
  edible_parts?: string[];
  toxic_parts?: string[];
  pollination_type?: string;
  sowingSeason?: string[];
  sowingMethod?: string;
  stages?: PlantStage[];
  companions?: string[];
  antagonists?: string[];
  confidence_score?: number;
  sources?: string[];
  seasonality?: Record<string, unknown>;
  sunlight?: string;
  water_requirements?: string;
  soil_type?: string[];
  preferred_ph?: string;
  common_pests?: string[];
  common_diseases?: string[];
  nutrient_preferences?: string[];
  source_metadata?: Array<Record<string, unknown>>;
}

export interface PlantKbDocument {
  plant_id: string;
  common_name: string;
  scientific_name?: string;
  type?: string;
  family?: string;
  growth_stage?: string[];
  sowingSeason?: string[];
  sowingMethod?: string;
  seasonality?: Record<string, { start_month: string | number; end_month: string | number } | Array<{ start_month: string | number; end_month: string | number }>>;
  sunlight?: string;
  water_requirements?: string;
  soil_type?: string[];
  preferred_ph?: string;
  companion_plants?: string[];
  incompatible_plants?: string[];
  common_pests?: string[];
  common_diseases?: string[];
  nutrient_preferences?: string[];
  notes?: string;

  // Added missing fields for UI compatibility
  life_cycle?: string;
  growth_habit?: string[];
  photosynthesis_type?: string;
  edible_parts?: string[];
  toxic_parts?: string[];
  pollination_type?: string;

  stages?: Array<{
    id?: string;
    name?: string;
    durationDays?: number;
    waterFrequencyDays?: number;
  }>;
  source_metadata?: Array<{
    source_name?: string;
    url?: string;
    confidence_score?: number;
  }>;
}

export interface SourceDocument {
  id: string;
  name: string;
  type: string;
  url?: string;
  credibility_tier?: string;
}

export interface InventoryDocument {
  id: string;
  catalogId: string;
  acquiredDate: number;
  notes?: string;
}

export interface PlantedDocument {
  id: string;
  bedId: string;
  catalogId: string;
  gridX: number;
  gridY: number;
  plantedDate: number;
  lastWateredDate?: number;
  currentStageIndex?: number;
  healthStatus?: string;
  customName?: string;
  hydration?: number;
  stressLevel?: number;
  nutrients?: {
    n?: number;
    p?: number;
    k?: number;
  };
  observations?: Array<{
    id: string;
    timestamp: number;
    category: string;
    label: string;
  }>;
  systemDiagnosis?: string;
}

export interface SettingsDocument {
  id: string;
  firstLoadComplete: boolean;
  hemisphere?: string;
  city?: string;
  currentDay?: number;
  xp?: number;
  dataVersion?: number;
}

export interface GardenDocument {
  id: string;
  name: string;
  type: string;
  soilType?: string;
  sunExposure?: string;
  gridWidth: number;
  gridHeight: number;
  createdDate?: number;
  backgroundColor?: string;
  theme?: string;
}

export interface LogbookDocument {
  id: string;
  type: string; // 'seed_purchase' or 'user_purchase'
  itemName: string;
  category?: string; // 'seeds', 'tools', 'supplies', etc.
  quantity?: number;
  price?: number;
  currency?: string;
  vendor?: string;
  date: number;
  notes?: string;
  catalogId?: string; // For seed purchases, reference to catalog
}

// Relationship type for companion planting logic
export interface Relationship {
  targetPlantId: string;
  type: 'companion' | 'antagonist';
  strength: number;
  description?: string;
}

// Grid layer types
export type GridLayer = 'normal' | 'hydration' | 'health' | 'nutrients' | 'companions';

// Plant status types
export type PlantHealthStatus = 'Healthy' | 'Pest Infestation' | 'Dead' | 'Harvested' | 'Overwatered';
