import { create, insert, search, type AnyOrama } from "@orama/orama";
import type { PlantKbDocument } from "../db/types";

export type PlantSearchResult = {
  document: PlantKbDocument;
  score: number;
};

// Orama schema — mirrors the fields we want to search against.
// Arrays of strings are joined into a single string for indexing
// since Orama's string type tokenises the full value.
const schema = {
  plant_id: "string",
  common_name: "string",
  scientific_name: "string",
  family: "string",
  type: "string",
  sunlight: "string",
  water_requirements: "string",
  notes: "string",
  // Flattened array fields — pre-joined before insertion
  soil_type_text: "string",
  companion_plants_text: "string",
  common_pests_text: "string",
  common_diseases_text: "string",
} as const;

let db: AnyOrama | null = null;
// Track the plant_ids currently in the index so we can detect stale indices
let indexedIds: string[] = [];

/**
 * Build (or rebuild) the Orama index from the provided plant documents.
 * Called once when the component loads its plant list from RxDB.
 * Skips rebuild if the set of indexed IDs hasn't changed.
 */
export async function buildPlantIndex(
  plants: PlantKbDocument[],
): Promise<void> {
  const newIds = plants
    .map((p) => p.plant_id)
    .sort()
    .join(",");
  const oldIds = indexedIds.sort().join(",");
  if (db && newIds === oldIds) return; // already up-to-date

  db = await create({ schema });
  indexedIds = plants.map((p) => p.plant_id);

  for (const plant of plants) {
    await insert(db, {
      plant_id: plant.plant_id,
      common_name: plant.common_name ?? "",
      scientific_name: plant.scientific_name ?? "",
      family: plant.family ?? "",
      type: plant.type ?? "",
      sunlight: plant.sunlight ?? "",
      water_requirements: plant.water_requirements ?? "",
      notes: plant.notes ?? "",
      soil_type_text: (plant.soil_type ?? []).join(" "),
      companion_plants_text: (plant.companion_plants ?? []).join(" "),
      common_pests_text: (plant.common_pests ?? []).join(" "),
      common_diseases_text: (plant.common_diseases ?? []).join(" "),
    });
  }
}

/**
 * Search the Orama index and return matched PlantKbDocuments sorted by score.
 * Returns all plants (unranked) when the query is empty.
 */
export async function searchPlants(
  query: string,
  allPlants: PlantKbDocument[],
  limit = 100,
): Promise<PlantSearchResult[]> {
  const q = query.trim();
  if (!q || !db) {
    return allPlants.map((document) => ({ document, score: 1 }));
  }

  const results = await search(db, {
    term: q,
    limit,
    // Search across all indexed text fields
    properties: [
      "common_name",
      "scientific_name",
      "family",
      "type",
      "notes",
      "soil_type_text",
      "companion_plants_text",
      "common_pests_text",
      "common_diseases_text",
    ],
    tolerance: 1, // Allow 1 typo (BK-tree based)
  });

  // Map Orama hits back to full PlantKbDocument objects
  const idToPlant = new Map(allPlants.map((p) => [p.plant_id, p]));
  return results.hits
    .map((hit: { document: any; score: number }) => {
      const document = idToPlant.get(
        (hit.document as { plant_id: string }).plant_id,
      );
      return document ? { document, score: hit.score } : null;
    })
    .filter(
      (r: PlantSearchResult | null): r is PlantSearchResult => r !== null,
    );
}
