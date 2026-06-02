import { describe, it, expect } from "vitest";
import {
  OBSERVATION_PATTERNS,
  getExtendedObservations,
  getDiagnosticByObservationId,
} from "../diagnostics";

describe("OBSERVATION_PATTERNS", () => {
  it("contains base observation patterns", () => {
    expect(OBSERVATION_PATTERNS.length).toBeGreaterThan(0);
  });

  it("each pattern has required fields", () => {
    for (const pattern of OBSERVATION_PATTERNS) {
      expect(pattern.id).toBeTruthy();
      expect(pattern.category).toMatch(
        /^(Moisture|Fertility|Pests|Nutrient|Growth)$/,
      );
      expect(pattern.label).toBeTruthy();
      expect(pattern.diagnostic).toBeTruthy();
      expect(pattern.prescription).toBeTruthy();
    }
  });
});

describe("getExtendedObservations", () => {
  it("returns base patterns when no catalog data provided", () => {
    const result = getExtendedObservations();
    expect(result.length).toBe(OBSERVATION_PATTERNS.length);
  });

  it("appends pest-specific patterns from catalog", () => {
    const result = getExtendedObservations({
      common_pests: ["Aphids", "Whitefly"],
    });
    const pestPatterns = result.filter((p) =>
      p.id.startsWith("obs_pest_spec_"),
    );
    expect(pestPatterns).toHaveLength(2);
    expect(pestPatterns[0].label).toContain("Aphids");
    expect(pestPatterns[1].label).toContain("Whitefly");
  });

  it("appends disease-specific patterns from catalog", () => {
    const result = getExtendedObservations({
      common_diseases: ["Powdery Mildew"],
    });
    const diseasePatterns = result.filter((p) =>
      p.id.startsWith("obs_disease_spec_"),
    );
    expect(diseasePatterns).toHaveLength(1);
    expect(diseasePatterns[0].label).toContain("Powdery Mildew");
  });

  it("handles empty pest/disease arrays gracefully", () => {
    const result = getExtendedObservations({
      common_pests: [],
      common_diseases: [],
    });
    expect(result.length).toBe(OBSERVATION_PATTERNS.length);
  });
});

describe("getDiagnosticByObservationId", () => {
  it("finds a pattern by id", () => {
    const result = getDiagnosticByObservationId("obs_moisture_droop");
    expect(result).toBeDefined();
    expect(result!.category).toBe("Moisture");
    expect(result!.label).toContain("Drooping");
  });

  it("returns undefined for unknown id", () => {
    const result = getDiagnosticByObservationId("nonexistent");
    expect(result).toBeUndefined();
  });

  it("finds extended patterns when catalog provided", () => {
    const result = getDiagnosticByObservationId("obs_pest_spec_0", {
      common_pests: ["Slugs"],
    });
    expect(result).toBeDefined();
    expect(result!.label).toContain("Slugs");
  });
});
