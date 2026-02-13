import { PlantedDocument, CatalogDocument } from '../db/types';

export interface ForecastResult {
  predictedHarvestDay: number;
  yieldProbability: number; // 0-100
  harvestQuality: 'Premium' | 'Standard' | 'Poor' | 'Failure';
  riskFactors: string[];
}

/**
 * FORECASTING LOGIC
 * Predicts the outcome of a plant's growth cycle based on current environmental
 * and historical health data.
 */
export const forecastPlantOutcome = (
  plant: PlantedDocument,
  catalogItem?: CatalogDocument,
  synergyScore: number = 0
): ForecastResult => {
  if (!catalogItem || !catalogItem.stages) {
    return {
      predictedHarvestDay: 0,
      yieldProbability: 50,
      harvestQuality: 'Standard',
      riskFactors: ['Insufficient species data for prediction']
    };
  }

  const stages = catalogItem.stages;
  const totalGrowthDays = stages.reduce((acc, s) => acc + (s.durationDays || 0), 0);
  
  // 1. Calculate Base Probability
  // Start with 100%, then deduct based on current state
  let yieldProp = 100;
  const risks: string[] = [];

  // Stress Penalty (High stress = lower yield)
  const stress = plant.stressLevel || 0;
  if (stress > 20) {
    yieldProp -= (stress * 0.5);
    risks.push(`High current stress (${Math.round(stress)}%)`);
  }

  // Hydration impact
  const hydration = plant.hydration || 0;
  if (hydration < 40) {
    yieldProp -= 15;
    risks.push('Chronic dehydration detected');
  } else if (hydration > 90) {
    yieldProp -= 10;
    risks.push('Risk of root suffocation (Overwatering)');
  }

  // Synergy Bonus/Penalty
  if (synergyScore > 5) {
    yieldProp += 10;
  } else if (synergyScore < -5) {
    yieldProp -= 15;
    risks.push('Antagonistic plant proximity');
  }

  // Observations History Impact
  if (plant.observations && plant.observations.length > 0) {
    const pestCount = plant.observations.filter(o => o.category === 'Pests').length;
    if (pestCount > 0) {
      yieldProp -= (pestCount * 5);
      risks.push(`Historical pathogen pressure (${pestCount} events)`);
    }
  }

  // Clamp probability
  yieldProp = Math.max(0, Math.min(100, yieldProp));

  // 2. Predict Harvest Quality
  let quality: ForecastResult['harvestQuality'] = 'Standard';
  if (yieldProp > 85) quality = 'Premium';
  else if (yieldProp > 40) quality = 'Standard';
  else if (yieldProp > 10) quality = 'Poor';
  else quality = 'Failure';

  // 3. Predicted Harvest Day
  // If stressed, growth might be stunted (longer cycle)
  let growthModifier = 1.0;
  if (stress > 50) growthModifier = 1.25; // 25% delay
  if (hydration < 30) growthModifier = 1.15; // 15% delay

  const prediction = Math.round(totalGrowthDays * growthModifier);

  return {
    predictedHarvestDay: prediction,
    yieldProbability: Math.round(yieldProp),
    harvestQuality: quality,
    riskFactors: risks
  };
};
