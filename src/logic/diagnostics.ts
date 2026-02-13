export type DiagnosticCategory = 'Moisture' | 'Fertility' | 'Pests' | 'Nutrient' | 'Growth';

export interface ObservationPattern {
  id: string;
  category: DiagnosticCategory;
  label: string;
  diagnostic: string; // The "Reason"
  prescription: string; // The "Solution"
  impact: {
    hydration?: number;
    stress?: number;
    n?: number;
    p?: number;
    k?: number;
  };
}

export const OBSERVATION_PATTERNS: ObservationPattern[] = [
  // MOISTURE
  {
    id: 'obs_moisture_droop',
    category: 'Moisture',
    label: 'Drooping/Wilting Leaves',
    diagnostic: 'Critical loss of turgor pressure due to severe dehydration or high transpiration.',
    prescription: 'Provide a deep, slow soak at the base immediately. Apply mulch to retain moisture.',
    impact: { hydration: 10, stress: 30 }
  },
  {
    id: 'obs_moisture_yellow_mold',
    category: 'Moisture',
    label: 'Yellowing Leaves / Moldy Soil',
    diagnostic: 'Anaerobic conditions at the root zone (Root Rot). Oxygen is being blocked by excess water.',
    prescription: 'Cease watering immediately. Aerate the soil surface and ensure drainage holes are clear.',
    impact: { hydration: 95, stress: 40 }
  },

  // FERTILITY (Indicator Weeds)
  {
    id: 'obs_fertility_nettles',
    category: 'Fertility',
    label: 'Abundant Stinging Nettles nearby',
    diagnostic: 'Indicators of high nitrogen and phosphorus availability in the soil.',
    prescription: 'Soil is currently nitrogen-rich. Avoid adding nitrogen-heavy fertilizer for now.',
    impact: { n: 85, p: 70 }
  },
  {
    id: 'obs_fertility_lavender',
    category: 'Fertility',
    label: 'Lavender flourishing in vicinity',
    diagnostic: 'Thrives in well-drained, sandy, and nitrogen-poor (lean) alkaline soil.',
    prescription: 'Consider supplementing with organic compost or blood meal to boost nitrogen levels.',
    impact: { n: 25, k: 40 }
  },

  // PESTS & DISEASE
  {
    id: 'obs_pest_aphids',
    category: 'Pests',
    label: 'Clusters of small green/black insects',
    diagnostic: 'Aphid colony sucking plant sap and excreting honeydew (attracts ants/sooty mold).',
    prescription: 'Spray with neem oil or a strong stream of water. Introduce ladybugs as natural predators.',
    impact: { stress: 25 }
  },
  {
    id: 'obs_pest_fungal',
    category: 'Pests',
    label: 'White powdery spots on leaves',
    diagnostic: 'Powdery Mildew caused by high humidity and poor air circulation.',
    prescription: 'Improve spacing. Prune affected leaves. Use an organic milk/baking soda spray.',
    impact: { stress: 35 }
  },

  // NUTRIENTS
  {
    id: 'obs_nutrient_purple',
    category: 'Nutrient',
    label: 'Purple tint on undersides/stems',
    diagnostic: 'Phosphorus (P) deficiency. Common in cold soils where P-uptake is limited.',
    prescription: 'Apply rock phosphate or bone meal. Check soil pH as acidity can lock out phosphorus.',
    impact: { p: 15, stress: 10 }
  },
  {
    id: 'obs_nutrient_brown_edge',
    category: 'Nutrient',
    label: 'Brown/Burnt leaf edges (Scorching)',
    diagnostic: 'Potassium (K) deficiency. Affects the plant\'s ability to regulate water and resist disease.',
    prescription: 'Apply wood ash or kelp meal. Ensure consistent watering as K is mobile in water.',
    impact: { k: 15, stress: 10 }
  },

  // GROWTH PROGRESS
  {
    id: 'obs_growth_stunted',
    category: 'Growth',
    label: 'Stunted growth / Small leaves',
    diagnostic: 'General stress or resource depletion. Likely insufficient light or root binding.',
    prescription: 'Evaluate sun exposure. Consider a liquid "booster" feeding (seaweed extract).',
    impact: { stress: 20 }
  },
  {
    id: 'obs_growth_leggy',
    category: 'Growth',
    label: 'Long, weak, "leggy" stems',
    diagnostic: 'Etiolation. The plant is searching for light, sacrificing structural integrity for height.',
    prescription: 'Move to a brighter location or add supplemental lighting immediately.',
    impact: { stress: 15 }
  }
];

export const getExtendedObservations = (plantCatalog?: { common_pests?: string[], common_diseases?: string[] }): ObservationPattern[] => {
  const patterns = [...OBSERVATION_PATTERNS];

  if (plantCatalog?.common_pests) {
    plantCatalog.common_pests.forEach((pest, index) => {
      patterns.push({
        id: `obs_pest_spec_${index}`,
        category: 'Pests',
        label: `Evidence of ${pest}`,
        diagnostic: `Observable presence or damage consistent with ${pest}, a common threat to this species.`,
        prescription: `Consult the Grimoire for specific organic remedies for ${pest}. Generally includes hand-removal or neem applications.`,
        impact: { stress: 20 }
      });
    });
  }

  if (plantCatalog?.common_diseases) {
    plantCatalog.common_diseases.forEach((disease, index) => {
      patterns.push({
        id: `obs_disease_spec_${index}`,
        category: 'Pests',
        label: `Signs of ${disease}`,
        diagnostic: `Visual symptoms align with ${disease}. This pathogen often targets this plant family under specific humidity/temp levels.`,
        prescription: `Isolate the plant if possible. Prune diseased tissue with sterilized tools. Improve air circulation.`,
        impact: { stress: 30 }
      });
    });
  }

  return patterns;
};

export const getDiagnosticByObservationId = (id: string, plantCatalog?: { common_pests?: string[], common_diseases?: string[] }) => 
  getExtendedObservations(plantCatalog).find(p => p.id === id);
