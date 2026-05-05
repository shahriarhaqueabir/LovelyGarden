import { describe, it, expect } from "vitest";
import {
  calculateCompanionScore,
  isSowingSeason,
  getConfidenceThreshold,
} from "../reasoning";
import {
  PlantSpecies,
  PlantRelationship,
  UserLocation,
} from "../../schema/knowledge-graph";

describe("calculateCompanionScore", () => {
  const relationships: PlantRelationship[] = [
    {
      source_plant_id: "tomato",
      target_plant_id: "basil",
      relationship: "beneficial",
    },
    {
      source_plant_id: "tomato",
      target_plant_id: "corn",
      relationship: "antagonistic",
    },
  ];

  it("should return positive score for beneficial neighbors", () => {
    const score = calculateCompanionScore("tomato", ["basil"], relationships);
    expect(score).toBe(1);
  });

  it("should return negative score for antagonistic neighbors", () => {
    const score = calculateCompanionScore("tomato", ["corn"], relationships);
    expect(score).toBe(-1);
  });

  it("should sum scores for multiple neighbors", () => {
    const score = calculateCompanionScore(
      "tomato",
      ["basil", "corn"],
      relationships,
    );
    expect(score).toBe(0);
  });
});

describe("isSowingSeason", () => {
  const plant: PlantSpecies = {
    id: "tomato",
    name: "Tomato",
    type: "vegetable",
    sowingSeason: ["Spring"],
    seasonality: {
      sowing: { start_month: "March", end_month: "May" },
    },
  } as PlantSpecies;

  const locationNorth: UserLocation = {
    hemisphere: "North",
    latitude: 40,
    longitude: -70,
  };

  it("should be eligible during sowing window", () => {
    const result = isSowingSeason(plant, locationNorth, 3); // April
    expect(result.eligible).toBe(true);
  });

  it("should not be eligible outside sowing window", () => {
    const result = isSowingSeason(plant, locationNorth, 11); // December
    expect(result.eligible).toBe(false);
  });
});

describe("getConfidenceThreshold", () => {
  it("should return actionable for high scores", () => {
    expect(getConfidenceThreshold(0.8)).toBe("actionable");
  });

  it("should return warning for medium scores", () => {
    expect(getConfidenceThreshold(0.5)).toBe("warning");
  });

  it("should return informational for low scores", () => {
    expect(getConfidenceThreshold(0.2)).toBe("informational");
  });
});
