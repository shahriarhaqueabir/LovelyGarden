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
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const isSowingSeason = (
  plant: PlantSpecies,
  location: UserLocation,
  currentMonth: number // 0-11
): { eligible: boolean; reason: string } => {
  // 1. Check granular month-based seasonality first if available
  if (plant.seasonality?.sowing) {
    const sowing = plant.seasonality.sowing;
    const windows = Array.isArray(sowing) ? sowing : [sowing];
    
    // Convert month names to indices if they are strings
    const getMonthIndex = (m: string | number | undefined | null): number | null => {
      if (m === undefined || m === null) return null;
      if (typeof m === 'number') return m;
      const search = String(m).toLowerCase();
      const idx = monthNames.findIndex(name => 
        name.toLowerCase() === search || 
        name.toLowerCase().substring(0, 3) === search.substring(0, 3)
      );
      return idx === -1 ? null : idx;
    };

    const isMatch = windows.some(window => {
      const startIdx = getMonthIndex(window.start_month);
      const endIdx = getMonthIndex(window.end_month);

      if (startIdx === null || endIdx === null) return false;

      // Handle wrap-around windows (e.g. October to March)
      if (startIdx <= endIdx) {
        return currentMonth >= startIdx && currentMonth <= endIdx;
      } else {
        return currentMonth >= startIdx || currentMonth <= endIdx;
      }
    });

    if (isMatch) {
      const activeWindow = windows.find(window => {
        const startIdx = getMonthIndex(window.start_month);
        const endIdx = getMonthIndex(window.end_month);
        if (startIdx === null || endIdx === null) return false;
        if (startIdx <= endIdx) return currentMonth >= startIdx && currentMonth <= endIdx;
        return currentMonth >= startIdx || currentMonth <= endIdx;
      }) || windows[0];

      return { 
        eligible: true, 
        reason: `Currently within the specific sowing window (${activeWindow.start_month} to ${activeWindow.end_month}).` 
      };
    }
  }

  // 2. Fallback to seasonal buckets
  const monthsNorth: Season[] = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];
  
  const referenceDate = new Date(2024, currentMonth, 15);
  const adjustedDate = location.hemisphere === 'North' 
    ? referenceDate 
    : addMonths(referenceDate, 6);
    
  const currentSeason = monthsNorth[getMonth(adjustedDate)];
  const allowedSeasons = plant.sowingSeason || [];
  
  if (allowedSeasons.includes(currentSeason)) {
    return { eligible: true, reason: `Currently in the ${currentSeason} sowing window.` };
  }
  
  // Smarter reason message for granular windows
  let specificReason = '';
  if (plant.seasonality?.sowing) {
    const sowing = plant.seasonality.sowing;
    const windows = Array.isArray(sowing) ? sowing : [sowing];
    const rangeStrs = windows.map(w => `${w.start_month} to ${w.end_month}`).join(', ');
    specificReason = `Too early or late. High-confidence window(s): ${rangeStrs}.`;
  }
  
  return { 
    eligible: false, 
    reason: specificReason || `Too early or late. This plant prefers ${allowedSeasons.join(' or ')}.` 
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
