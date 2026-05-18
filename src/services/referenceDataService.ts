import { supabase } from "../utils/supabase";
import type { PlantSpecies } from "../schema/knowledge-graph";
import type { PlantKbDocument, SourceDocument } from "../db/types";

type PlantCatalogRow = {
  id: string;
  name: string;
  scientific_name?: string | null;
  description?: string | null;
  family?: string | null;
  genus?: string | null;
  species?: string | null;
  categories?: string[] | null;
  life_cycle?: string | null;
  growth_habit?: string[] | null;
  photosynthesis_type?: string | null;
  edible_parts?: string[] | null;
  toxic_parts?: string[] | null;
  pollination_type?: string | null;
  sowing_season?: string[] | null;
  sowing_method?: string | null;
  stages?: unknown;
  companions?: string[] | null;
  antagonists?: string[] | null;
  confidence_score?: number | null;
  sources?: string[] | null;
  seasonality?: unknown;
  sunlight?: string | null;
  water_requirements?: string | null;
  soil_type?: string[] | null;
  preferred_ph?: string | null;
  common_pests?: string[] | null;
  common_diseases?: string[] | null;
  nutrient_preferences?: string[] | null;
  source_metadata?: unknown;
};

type PlantKnowledgeBaseRow = {
  plant_id: string;
  common_name: string;
  scientific_name?: string | null;
  type?: string | null;
  family?: string | null;
  growth_stage?: string[] | null;
  sowing_season?: string[] | null;
  sowing_method?: string | null;
  seasonality?: unknown;
  sunlight?: string | null;
  water_requirements?: string | null;
  soil_type?: string[] | null;
  companion_plants?: string[] | null;
  incompatible_plants?: string[] | null;
  common_pests?: string[] | null;
  common_diseases?: string[] | null;
  nutrient_preferences?: string[] | null;
  notes?: string | null;
  preferred_ph?: string | null;
  life_cycle?: string | null;
  growth_habit?: string[] | null;
  photosynthesis_type?: string | null;
  edible_parts?: string[] | null;
  toxic_parts?: string[] | null;
  pollination_type?: string | null;
  stages?: unknown;
  source_metadata?: unknown;
};

type SourceRow = {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  credibility_tier?: string | null;
};

const arrayOrEmpty = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

const mapPlantCatalog = (row: PlantCatalogRow): PlantSpecies => ({
  id: row.id,
  name: row.name,
  scientificName: row.scientific_name ?? "",
  description: row.description ?? "",
  family: row.family ?? undefined,
  genus: row.genus ?? undefined,
  species: row.species ?? undefined,
  categories: arrayOrEmpty(row.categories) as PlantSpecies["categories"],
  life_cycle: (row.life_cycle ?? "annual") as PlantSpecies["life_cycle"],
  growth_habit: arrayOrEmpty(row.growth_habit) as PlantSpecies["growth_habit"],
  photosynthesis_type:
    (row.photosynthesis_type as PlantSpecies["photosynthesis_type"]) ??
    undefined,
  edible_parts: arrayOrEmpty(row.edible_parts),
  toxic_parts: arrayOrEmpty(row.toxic_parts),
  pollination_type: (row.pollination_type ??
    "insect") as PlantSpecies["pollination_type"],
  sowingSeason: arrayOrEmpty(row.sowing_season) as PlantSpecies["sowingSeason"],
  sowingMethod: (row.sowing_method ?? "Direct") as PlantSpecies["sowingMethod"],
  stages: arrayOrEmpty(row.stages as PlantSpecies["stages"]),
  companions: arrayOrEmpty(row.companions),
  antagonists: arrayOrEmpty(row.antagonists),
  confidence_score: row.confidence_score ?? 0.95,
  sources: arrayOrEmpty(row.sources),
  seasonality: row.seasonality as PlantSpecies["seasonality"],
  sunlight: row.sunlight ?? undefined,
  water_requirements: row.water_requirements ?? undefined,
  soil_type: arrayOrEmpty(row.soil_type),
  common_pests: arrayOrEmpty(row.common_pests),
  common_diseases: arrayOrEmpty(row.common_diseases),
  nutrient_preferences: arrayOrEmpty(row.nutrient_preferences),
  source_metadata:
    (row.source_metadata as PlantSpecies["source_metadata"]) ?? undefined,
});

const mapPlantKnowledgeBase = (
  row: PlantKnowledgeBaseRow,
): PlantKbDocument => ({
  plant_id: row.plant_id,
  common_name: row.common_name,
  scientific_name: row.scientific_name ?? undefined,
  type: row.type ?? undefined,
  family: row.family ?? undefined,
  growth_stage: arrayOrEmpty(row.growth_stage),
  sowingSeason: arrayOrEmpty(row.sowing_season),
  sowingMethod: row.sowing_method ?? undefined,
  seasonality: row.seasonality as PlantKbDocument["seasonality"],
  sunlight: row.sunlight ?? undefined,
  water_requirements: row.water_requirements ?? undefined,
  soil_type: arrayOrEmpty(row.soil_type),
  companion_plants: arrayOrEmpty(row.companion_plants),
  incompatible_plants: arrayOrEmpty(row.incompatible_plants),
  common_pests: arrayOrEmpty(row.common_pests),
  common_diseases: arrayOrEmpty(row.common_diseases),
  nutrient_preferences: arrayOrEmpty(row.nutrient_preferences),
  notes: row.notes ?? undefined,
  preferred_ph: row.preferred_ph ?? undefined,
  life_cycle: row.life_cycle ?? undefined,
  growth_habit: arrayOrEmpty(row.growth_habit),
  photosynthesis_type: row.photosynthesis_type ?? undefined,
  edible_parts: arrayOrEmpty(row.edible_parts),
  toxic_parts: arrayOrEmpty(row.toxic_parts),
  pollination_type: row.pollination_type ?? undefined,
  stages: arrayOrEmpty(row.stages as PlantKbDocument["stages"]),
  source_metadata:
    (row.source_metadata as PlantKbDocument["source_metadata"]) ?? undefined,
});

const mapSource = (row: SourceRow): SourceDocument => ({
  id: row.id,
  name: row.name,
  type: row.type,
  url: row.url ?? undefined,
  credibility_tier: row.credibility_tier ?? undefined,
});

export const listPlantCatalog = async (): Promise<PlantSpecies[]> => {
  const { data, error } = await supabase
    .from("plant_catalog")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapPlantCatalog(row as PlantCatalogRow));
};

export const listPlantKnowledgeBase = async (): Promise<PlantKbDocument[]> => {
  const { data, error } = await supabase
    .from("plant_knowledge_base")
    .select("*")
    .order("common_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapPlantKnowledgeBase(row as PlantKnowledgeBaseRow),
  );
};

export const getPlantKnowledgeBase = async (
  plantId: string,
): Promise<PlantKbDocument | null> => {
  const { data, error } = await supabase
    .from("plant_knowledge_base")
    .select("*")
    .eq("plant_id", plantId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPlantKnowledgeBase(data as PlantKnowledgeBaseRow) : null;
};

export const listSources = async (): Promise<SourceDocument[]> => {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapSource(row as SourceRow));
};
