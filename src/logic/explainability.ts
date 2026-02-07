import { ExplanationPayload, ConfidenceScore } from '../schema/knowledge-graph';

/**
 * EXPLAINABILITY WRAPPER
 * Standardizes reasoning outputs into explainable payloads for the UI.
 */
export const createExplanation = (
  decisionId: string,
  action: string,
  score: ConfidenceScore,
  reasons: string[],
  rules: string[],
  facts: string[],
  sources: string[]
): ExplanationPayload => {
  return {
    decision_id: decisionId,
    action,
    confidence_score: score,
    summary: reasons[0] || "No summary available.",
    detailed: {
      reasoning: reasons,
      rules_applied: rules
    },
    technical: {
      facts_used: facts,
      sources: sources
    }
  };
};

/**
 * Example usage for Sowing Recommendation
 */
export const explainSowing = (
  isEligible: boolean,
  reason: string,
  confidence: number,
  sources: string[]
): ExplanationPayload => {
  return createExplanation(
    `sow-${Date.now()}`,
    isEligible ? 'allow_sow' : 'block_sow',
    confidence,
    [reason],
    ['rule_sowing_season_match', 'rule_climate_safety'],
    [`is_eligible = ${isEligible}`],
    sources
  );
};
