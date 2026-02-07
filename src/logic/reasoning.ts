import { getMonth, addMonths } from 'date-fns';
import { PlantSpecies, PlantRelationship, UserLocation, Season } from '../schema/knowledge-graph';

/**
 * COMPANION REASONING
 * Calculates bonuses or penalties based on plant neighbors.
 */
export const calculateCompanionScore = (
  targetPlantId: string,
  neighborPlantIds: string[],
  relationships: PlantRelationship[]
): number => {
  let score = 0;
  
  neighborPlantIds.forEach(neighborId => {
    const rel = relationships.find(r => 
      (r.source_plant_id === targetPlantId && r.target_plant_id === neighborId) ||
      (r.source_plant_id === neighborId && r.target_plant_id === targetPlantId)
    );
    
    if (rel) {
      if (rel.relationship === 'beneficial') score += 1;
      if (rel.relationship === 'antagonistic') score -= 1;
    }
  });
  
  return score;
};

/**
 * SEASONAL ELIGIBILITY
 * Determines if a plant can be sown based on location and current month.
 */
export const isSowingSeason = (
  plant: PlantSpecies,
  location: UserLocation,
  currentMonth: number // 0-11
): { eligible: boolean; reason: string } => {
  // Precise seasonal mapping using date-fns
  const monthsNorth: Season[] = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];
  
  // Normalize date for hemisphere
  const referenceDate = new Date(2024, currentMonth, 15);
  const adjustedDate = location.hemisphere === 'North' 
    ? referenceDate 
    : addMonths(referenceDate, 6);
    
  const currentSeason = monthsNorth[getMonth(adjustedDate)];

  const allowedSeasons = plant.sowingSeason || [];
  
  if (allowedSeasons.includes(currentSeason)) {
    return { eligible: true, reason: `Currently in the ${currentSeason} sowing window.` };
  }
  
  return { 
    eligible: false, 
    reason: `Too early or late. This plant prefers ${allowedSeasons.join(' or ')}.` 
  };
};

/**
 * DIAGNOSTIC THRESHOLDS
 * Enforces confidence thresholds for recommendations.
 */
export const getConfidenceThreshold = (score: number) => {
  if (score >= 0.7) return 'actionable';
  if (score >= 0.4) return 'warning';
  return 'informational';
};
