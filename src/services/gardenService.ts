import { supabase } from "../utils/supabase";
import type { GardenDocument } from "../db/types";

type GardenRow = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  soil_type: string | null;
  sun_exposure: string | null;
  grid_width: number;
  grid_height: number;
  background_color: string | null;
  theme: string | null;
  created_at: string;
  updated_at: string;
};

const mapRowToGarden = (row: GardenRow): GardenDocument => ({
  id: row.id,
  name: row.name,
  type: row.type,
  soilType: row.soil_type ?? undefined,
  sunExposure: row.sun_exposure ?? undefined,
  gridWidth: row.grid_width,
  gridHeight: row.grid_height,
  backgroundColor: row.background_color ?? undefined,
  theme: row.theme ?? undefined,
  createdDate: new Date(row.created_at).getTime(),
});

const toRow = (ownerId: string, garden: GardenDocument) => {
  const createdAt = new Date(garden.createdDate ?? Date.now()).toISOString();

  return {
    id: garden.id,
    owner_id: ownerId,
    name: garden.name,
    type: garden.type,
    soil_type: garden.soilType ?? null,
    sun_exposure: garden.sunExposure ?? null,
    grid_width: garden.gridWidth,
    grid_height: garden.gridHeight,
    background_color: garden.backgroundColor ?? null,
    theme: garden.theme ?? null,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  };
};

export const listCloudGardens = async (
  ownerId: string,
): Promise<GardenDocument[]> => {
  const { data, error } = await supabase
    .from("gardens")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as GardenRow[]).map(mapRowToGarden);
};

export const upsertCloudGarden = async (
  ownerId: string,
  garden: GardenDocument,
): Promise<GardenDocument> => {
  const { data, error } = await supabase
    .from("gardens")
    .upsert(toRow(ownerId, garden), { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToGarden(data as GardenRow);
};

export const syncGardensWithCloud = async (
  ownerId: string,
  localGardens: GardenDocument[],
): Promise<GardenDocument[]> => {
  const cloudGardens = await listCloudGardens(ownerId);

  if (cloudGardens.length === 0) {
    return Promise.all(
      localGardens.map((garden) => upsertCloudGarden(ownerId, garden)),
    );
  }

  const cloudGardenIds = new Set(cloudGardens.map((garden) => garden.id));
  const localOnlyGardens = localGardens.filter(
    (garden) => !cloudGardenIds.has(garden.id),
  );

  if (localOnlyGardens.length === 0) {
    return cloudGardens;
  }

  const uploadedGardens = await Promise.all(
    localOnlyGardens.map((garden) => upsertCloudGarden(ownerId, garden)),
  );

  return [...cloudGardens, ...uploadedGardens];
};
