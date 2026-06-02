import { describe, it, expect } from "vitest";
import { forecastPlantOutcome } from "../forecasting";
import type { PlantedDocument, CatalogDocument } from "../../db/types";

describe("forecastPlantOutcome", () => {
  const basePlanted: PlantedDocument = {
    id: "planted-1",
    bedId: "bed-1",
    catalogId: "tomato",
    gridX: 0,
    gridY: 0,
    plantedDate: Date.now(),
    hydration: 60,
    stressLevel: 10,
  };

  const baseCatalog: CatalogDocument = {
    id: "tomato",
    name: "Tomato",
    stages: [
      {
        id: "seed",
        name: "Seed",
        durationDays: 5,
        waterFrequencyDays: 1,
        imageAssetId: "seed",
      },
      {
        id: "germination",
        name: "Germination",
        durationDays: 10,
        waterFrequencyDays: 2,
        imageAssetId: "germ",
      },
      {
        id: "seedling",
        name: "Seedling",
        durationDays: 15,
        waterFrequencyDays: 3,
        imageAssetId: "seedling",
      },
      {
        id: "harvest",
        name: "Harvest",
        durationDays: 20,
        waterFrequencyDays: 3,
        imageAssetId: "harvest",
      },
    ],
  };

  it("returns default forecast when catalogItem is missing", () => {
    const result = forecastPlantOutcome(basePlanted, undefined);
    expect(result.predictedHarvestDay).toBe(0);
    expect(result.yieldProbability).toBe(50);
    expect(result.harvestQuality).toBe("Standard");
    expect(result.riskFactors).toContain(
      "Insufficient species data for prediction",
    );
  });

  it("returns Premium for healthy plant with good synergy", () => {
    const result = forecastPlantOutcome(basePlanted, baseCatalog, 10);
    expect(result.harvestQuality).toBe("Premium");
    expect(result.yieldProbability).toBeGreaterThan(85);
    expect(result.riskFactors).toHaveLength(0);
  });

  it("penalizes yield for high stress", () => {
    const stressed: PlantedDocument = { ...basePlanted, stressLevel: 80 };
    const result = forecastPlantOutcome(stressed, baseCatalog, 0);
    expect(result.yieldProbability).toBeLessThan(80);
    expect(result.riskFactors).toContain("High current stress (80%)");
  });

  it("penalizes yield for dehydration", () => {
    const dehydrated: PlantedDocument = { ...basePlanted, hydration: 20 };
    const result = forecastPlantOutcome(dehydrated, baseCatalog, 0);
    expect(result.yieldProbability).toBeLessThan(90);
    expect(result.riskFactors).toContain("Chronic dehydration detected");
  });

  it("penalizes yield for overwatering", () => {
    const overwatered: PlantedDocument = { ...basePlanted, hydration: 95 };
    const result = forecastPlantOutcome(overwatered, baseCatalog, 0);
    expect(result.yieldProbability).toBeLessThan(95);
    expect(result.riskFactors).toContain(
      "Risk of root suffocation (Overwatering)",
    );
  });

  it("penalizes yield for antagonistic neighbors", () => {
    const result = forecastPlantOutcome(basePlanted, baseCatalog, -10);
    expect(result.riskFactors).toContain("Antagonistic plant proximity");
  });

  it("penalizes yield for pest observations", () => {
    const withPests: PlantedDocument = {
      ...basePlanted,
      observations: [
        {
          id: "obs-1",
          timestamp: Date.now(),
          category: "Pests",
          label: "Aphids",
        },
        {
          id: "obs-2",
          timestamp: Date.now(),
          category: "Pests",
          label: "Mildew",
        },
      ],
    };
    const result = forecastPlantOutcome(withPests, baseCatalog, 0);
    expect(result.riskFactors).toContain(
      "Historical pathogen pressure (2 events)",
    );
  });

  it("predicts harvest day with growth modifier under stress", () => {
    const totalDays = baseCatalog.stages!.reduce(
      (a, s) => a + s.durationDays,
      0,
    );
    const stressed: PlantedDocument = {
      ...basePlanted,
      stressLevel: 60,
      hydration: 20,
    };
    const result = forecastPlantOutcome(stressed, baseCatalog, 0);
    expect(result.predictedHarvestDay).toBeGreaterThan(totalDays);
  });

  it("clamps yield probability between 0 and 100", () => {
    const extreme: PlantedDocument = {
      ...basePlanted,
      stressLevel: 200,
      hydration: 100,
    };
    const result = forecastPlantOutcome(extreme, baseCatalog, -100);
    expect(result.yieldProbability).toBeGreaterThanOrEqual(0);
    expect(result.yieldProbability).toBeLessThanOrEqual(100);
  });
});
