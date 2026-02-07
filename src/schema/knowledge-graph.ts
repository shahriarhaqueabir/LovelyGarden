/**
 * PROJECT GARDEN DECK: KNOWLEDGE GRAPH SCHEMAS
 * Consolidating the 16 Domains into strict TypeScript interfaces.
 * ALIGNED WITH AGENT A-D CONTRACTS.
 */

// --- SHARED TYPES ---
export type ConfidenceScore = number; // 0.0 to 1.0
export type EvidenceType = 'peer_reviewed' | 'extension_guideline' | 'horticultural_consensus' | 'user_reported';

export interface SourceMetadata {
  id: string;
  name: string;
  type: 'institution' | 'academic_extension' | 'research_paper' | 'community';
  url?: string;
  credibility_tier: 'authoritative' | 'trusted' | 'experimental';
}

export interface GroundedFact {
  confidence_score: ConfidenceScore;
  evidence_type: EvidenceType;
  sources: string[]; // Array of SourceMetadata IDs
  context_scope?: {
    climate_zones?: string[];
    growth_stages?: string[];
    soil_types?: string[];
  };
}

// --- 1. TIME & CALENDAR ---
export type MonthId = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type GrowthStageId = 'seed' | 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest' | 'dormant';

export interface PlantStage {
  id: GrowthStageId;
  name: string; // e.g., "Germination", "Vegetative", "Harvest"
  durationDays: number; // How long this stage lasts
  waterFrequencyDays: number; // e.g., 2 = every 2 days
  imageAssetId: string; // Reference to /assets/images/...
}

// --- 2. PLANT SPECIES (CatalogPlant) ---
export interface PlantSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  family?: string;
  genus?: string;
  species?: string;
  categories: ('vegetable' | 'fruit' | 'herb' | 'flower' | 'root_crop' | 'leafy_green')[];
  life_cycle: 'annual' | 'biennial' | 'perennial';
  growth_habit: ('upright' | 'bushy' | 'vining' | 'trailing' | 'climbing')[];
  photosynthesis_type?: 'C3' | 'C4' | 'CAM';
  edible_parts: string[];
  toxic_parts: string[];
  pollination_type: 'self_pollinating' | 'cross_pollinating' | 'wind' | 'insect';
  sowingSeason: Season[];
  sowingMethod: 'Direct' | 'Transplant';
  stages: PlantStage[];
  companions: string[]; // IDs of other CatalogPlants
  antagonists: string[]; // IDs of incompatible plants
  confidence_score: ConfidenceScore;
  sources: string[];
  // Expanded Fields for Command Center UI
  seasonality?: {
    sowing: { start_month: string; end_month: string };
    harvest: { start_month: string; end_month: string };
  };
  sunlight?: string;
  water_requirements?: string;
  soil_type?: string[];
  common_pests?: string[];
  common_diseases?: string[];
  nutrient_preferences?: string[];
  source_metadata?: Array<{
    source_name: string;
    url?: string;
    confidence_score: number;
  }>;
}

// --- 3. CLIMATE & LOCATION ---
export interface ClimateZone {
  id: string;
  system: 'USDA' | 'Koppen';
  min_temp_c?: number;
  max_temp_c?: number;
  description: string;
}

export interface UserLocation {
  id: 'user_location';
  latitude?: number;
  longitude?: number;
  hemisphere: 'North' | 'South';
  usda_zone?: string;
  koppen_climate?: string;
  frost_data: {
    last_spring_frost?: string; 
    first_fall_frost?: string;
    frost_free_days?: number;
  };
}

// --- 4. PLANT ACTION RELATIONSHIPS ---
export type PlantAction = 'sow_direct' | 'start_indoors' | 'transplant' | 'harvest' | 'prune' | 'water' | 'fertilize';

export interface ActionTimingRule extends GroundedFact {
  id: string;
  plant_id: string;
  action: PlantAction;
  constraints: {
    soil_temp_min?: number;
    soil_temp_max?: number;
    air_temp_min?: number;
    air_temp_max?: number;
    frost_risk: 'none' | 'low' | 'high';
  };
  relative_window: string; 
}

// --- 5. SOIL ---
export interface SoilType {
  id: string;
  texture: 'sand' | 'silt' | 'clay' | 'loam';
  drainage: 'poor' | 'moderate' | 'well';
  water_retention: 'low' | 'moderate' | 'high';
}

export interface PlantSoilPreference extends GroundedFact {
  plant_id: string;
  preferred_ph_range: [number, number];
  preferred_soil_types: string[];
  compaction_tolerance: 'low' | 'moderate' | 'high';
}

// --- 6. PESTS & DISEASES ---
export interface PestOrDisease {
  id: string;
  name: string;
  type: 'insect' | 'fungal' | 'bacterial' | 'viral' | 'animal';
  scientific_name?: string;
  symptoms: string[];
}

export interface Treatment {
  id: string;
  name: string;
  type: 'organic' | 'chemical' | 'cultural';
  targets: string[]; 
  application_notes: string;
}

// --- 7. COMPANION & ANTAGONISTIC RELATIONSHIPS ---
export interface PlantRelationship extends GroundedFact {
  source_plant_id: string;
  target_plant_id: string;
  relationship: 'beneficial' | 'antagonistic' | 'neutral';
  mechanism: string[]; 
}

// --- 8. CALENDAR & SEASONAL INTELLIGENCE ---
export interface SeasonalRecommendation {
  month: MonthId;
  climate_zone_id: string;
  recommended_plants: string[];
  avoid_plants: string[];
  critical_tasks: string[];
}

// --- 10. AI REASONING RULES ---
export interface ReasoningRule {
  id: string;
  type: 'recommendation' | 'constraint' | 'diagnostic' | 'intervention';
  priority: 1 | 2 | 3 | 4 | 5; 
  description: string;
  explanation_template: string;
}

// --- 12. RULE CONFLICT RESOLUTION ---
export interface RuleConflictOutcome {
  decision_id: string;
  triggered_rules: string[];
  winning_rule: string;
  resolution_strategy: string;
  final_action: string;
  confidence_score: ConfidenceScore;
  user_explanation: string;
}

// --- 13. EXPLAINABILITY UI CONTRACTS ---
export interface ExplanationPayload {
  decision_id: string;
  action: string;
  confidence_score: ConfidenceScore;
  summary: string;
  detailed: {
    reasoning: string[];
    rules_applied: string[];
  };
  technical: {
    facts_used: string[];
    sources: string[];
  };
}

// --- 15. CALENDAR SYNTHESIS ---
export interface CalendarEvent {
  event_id: string;
  plant_id: string;
  action: PlantAction;
  recommended_dates: {
    start: string;
    end: string;
  };
  growth_stage: GrowthStageId;
  confidence_score: ConfidenceScore;
  explanation_payload_id: string;
  companion_plants: string[];
  planting_method: string;
}

// --- 16. DIAGNOSTICS & CONFIDENCE THRESHOLDS ---
export interface DiagnosticEvent {
  diagnosis_id: string;
  plant_id: string;
  observed_symptoms: string[];
  suspected_cause: string; 
  confidence_score: ConfidenceScore;
  recommended_action: string;
  sources: string[];
}
