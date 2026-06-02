import { describe, it, expect, beforeEach } from "vitest";
import { buildPlantIndex, searchPlants } from "../plantSearch";
import type { PlantKbDocument } from "../../db/types";

const mockPlants: PlantKbDocument[] = [
  {
    plant_id: "tomato",
    common_name: "Tomato",
    scientific_name: "Solanum lycopersicum",
    type: "vegetable",
    family: "Solanaceae",
    sunlight: "Full sun",
    water_requirements: "Moderate",
    notes: "A red fruit vegetable",
    companion_plants: ["basil", "marigold"],
    common_pests: ["aphids", "whitefly"],
    common_diseases: ["blight"],
    soil_type: ["loam", "sandy"],
  },
  {
    plant_id: "basil",
    common_name: "Basil",
    scientific_name: "Ocimum basilicum",
    type: "herb",
    family: "Lamiaceae",
    sunlight: "Full sun",
    water_requirements: "Moderate",
    notes: "Aromatic herb used in cooking",
    companion_plants: ["tomato"],
    common_pests: ["slugs"],
    common_diseases: [],
    soil_type: ["loam"],
  },
  {
    plant_id: "carrot",
    common_name: "Carrot",
    scientific_name: "Daucus carota",
    type: "root_crop",
    family: "Apiaceae",
    sunlight: "Full sun",
    water_requirements: "Moderate",
    notes: "Root vegetable",
    companion_plants: [],
    common_pests: [],
    common_diseases: [],
    soil_type: ["sandy"],
  },
];

describe("buildPlantIndex", () => {
  beforeEach(async () => {
    await buildPlantIndex(mockPlants);
  });

  it("builds index without throwing", async () => {
    await expect(buildPlantIndex(mockPlants)).resolves.toBeUndefined();
  });

  it("skips rebuild if plants haven't changed", async () => {
    const shuffled = [...mockPlants].reverse();
    await expect(buildPlantIndex(shuffled)).resolves.toBeUndefined();
  });
});

describe("searchPlants", () => {
  beforeEach(async () => {
    await buildPlantIndex(mockPlants);
  });

  it("returns all plants when query is empty", async () => {
    const results = await searchPlants("", mockPlants);
    expect(results).toHaveLength(3);
  });

  it("finds plants by common name", async () => {
    const results = await searchPlants("Tomato", mockPlants);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].document.plant_id).toBe("tomato");
  });

  it("finds plants by scientific name", async () => {
    const results = await searchPlants("Ocimum", mockPlants);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.document.plant_id === "basil")).toBe(true);
  });

  it("finds plants by family", async () => {
    const results = await searchPlants("Solanaceae", mockPlants);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].document.plant_id).toBe("tomato");
  });

  it("finds plants by type", async () => {
    const results = await searchPlants("herb", mockPlants);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.document.plant_id === "basil")).toBe(true);
  });

  it("returns results sorted by relevance", async () => {
    const results = await searchPlants("Tomato", mockPlants, 10);
    expect(results.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("returns empty array with no match for gibberish query", async () => {
    const results = await searchPlants("xyznonexistent", mockPlants);
    expect(results).toHaveLength(0);
  });

  it("handles typo tolerance with 1 character off", async () => {
    const results = await searchPlants("Tomat", mockPlants);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("searches companion plant text", async () => {
    const results = await searchPlants("marigold", mockPlants);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("limits results", async () => {
    const results = await searchPlants("Tomato", mockPlants, 1);
    expect(results.length).toBe(1);
  });
});
