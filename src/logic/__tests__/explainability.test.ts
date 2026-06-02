import { describe, it, expect } from "vitest";
import { createExplanation, explainSowing } from "../explainability";

describe("createExplanation", () => {
  it("creates a valid ExplanationPayload with provided data", () => {
    const result = createExplanation(
      "dec-1",
      "allow_sow",
      0.85,
      ["Good conditions for sowing"],
      ["rule_sowing_season_match"],
      ["is_eligible = true"],
      ["source-1"],
    );

    expect(result.decision_id).toBe("dec-1");
    expect(result.action).toBe("allow_sow");
    expect(result.confidence_score).toBe(0.85);
    expect(result.summary).toBe("Good conditions for sowing");
    expect(result.detailed.reasoning).toEqual(["Good conditions for sowing"]);
    expect(result.detailed.rules_applied).toEqual(["rule_sowing_season_match"]);
    expect(result.technical.facts_used).toEqual(["is_eligible = true"]);
    expect(result.technical.sources).toEqual(["source-1"]);
  });

  it("uses fallback summary when reasons array is empty", () => {
    const result = createExplanation("dec-2", "block_sow", 0, [], [], [], []);
    expect(result.summary).toBe("No summary available.");
  });
});

describe("explainSowing", () => {
  it("generates allow_sow action for eligible plants", () => {
    const result = explainSowing(true, "Spring season", 0.9, ["source-1"]);
    expect(result.action).toBe("allow_sow");
    expect(result.confidence_score).toBe(0.9);
    expect(result.detailed.rules_applied).toContain("rule_sowing_season_match");
  });

  it("generates block_sow action for ineligible plants", () => {
    const result = explainSowing(false, "Too cold", 0.3, []);
    expect(result.action).toBe("block_sow");
    expect(result.technical.facts_used).toEqual(["is_eligible = false"]);
  });
});
