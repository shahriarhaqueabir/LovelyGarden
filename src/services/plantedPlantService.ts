import { supabase } from "../utils/supabase";
import type { PlantedDocument } from "../db/types";

type PlantedPlantRow = {
  id: string;
  owner_id: string;
  garden_id: string;
  catalog_id: string;
  grid_x: number;
  grid_y: number;
  planted_at: string;
  last_watered_at: string | null;
  current_stage_index: number;
  health_status: string;
  custom_name: string | null;
  hydration: number;
  stress_level: number;
  nutrients: PlantedDocument["nutrients"] | null;
  observations: PlantedDocument["observations"] | null;
  system_diagnosis: string | null;
};

const toIso = (timestamp: number | undefined) =>
  timestamp ? new Date(timestamp).toISOString() : null;

const mapRowToPlantedPlant = (row: PlantedPlantRow): PlantedDocument => ({
  id: row.id,
  bedId: row.garden_id,
  catalogId: row.catalog_id,
  gridX: row.grid_x,
  gridY: row.grid_y,
  plantedDate: new Date(row.planted_at).getTime(),
  lastWateredDate: row.last_watered_at
    ? new Date(row.last_watered_at).getTime()
    : undefined,
  currentStageIndex: row.current_stage_index,
  healthStatus: row.health_status,
  customName: row.custom_name ?? undefined,
  hydration: row.hydration,
  stressLevel: row.stress_level,
  nutrients: row.nutrients ?? undefined,
  observations: row.observations ?? [],
  systemDiagnosis: row.system_diagnosis ?? undefined,
});

const toRow = (ownerId: string, plant: PlantedDocument) => ({
  id: plant.id,
  owner_id: ownerId,
  garden_id: plant.bedId,
  catalog_id: plant.catalogId,
  grid_x: plant.gridX,
  grid_y: plant.gridY,
  planted_at: toIso(plant.plantedDate) ?? new Date().toISOString(),
  last_watered_at: toIso(plant.lastWateredDate),
  current_stage_index: plant.currentStageIndex ?? 0,
  health_status: plant.healthStatus ?? "Healthy",
  custom_name: plant.customName ?? null,
  hydration: plant.hydration ?? 100,
  stress_level: plant.stressLevel ?? 0,
  nutrients: plant.nutrients ?? { n: 50, p: 50, k: 50 },
  observations: plant.observations ?? [],
  system_diagnosis: plant.systemDiagnosis ?? null,
  updated_at: new Date().toISOString(),
});

export const listCloudPlantedPlants = async (
  ownerId: string,
): Promise<PlantedDocument[]> => {
  const { data, error } = await supabase
    .from("planted_plants")
    .select("*")
    .eq("owner_id", ownerId)
    .order("planted_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as PlantedPlantRow[]).map(mapRowToPlantedPlant);
};

export const upsertCloudPlantedPlant = async (
  ownerId: string,
  plant: PlantedDocument,
): Promise<PlantedDocument> => {
  const { data, error } = await supabase
    .from("planted_plants")
    .upsert(toRow(ownerId, plant), { onConflict: "owner_id,id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToPlantedPlant(data as PlantedPlantRow);
};

export const deleteCloudPlantedPlant = async (
  ownerId: string,
  plantId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("planted_plants")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", plantId);

  if (error) throw error;
};

export const syncPlantedPlantsWithCloud = async (
  ownerId: string,
  localPlants: PlantedDocument[],
): Promise<PlantedDocument[]> => {
  const cloudPlants = await listCloudPlantedPlants(ownerId);

  if (cloudPlants.length === 0) {
    return Promise.all(
      localPlants.map((plant) => upsertCloudPlantedPlant(ownerId, plant)),
    );
  }

  const cloudPlantIds = new Set(cloudPlants.map((plant) => plant.id));
  const localOnlyPlants = localPlants.filter(
    (plant) => !cloudPlantIds.has(plant.id),
  );

  if (localOnlyPlants.length === 0) return cloudPlants;

  const uploadedPlants = await Promise.all(
    localOnlyPlants.map((plant) => upsertCloudPlantedPlant(ownerId, plant)),
  );

  return [...cloudPlants, ...uploadedPlants];
};
