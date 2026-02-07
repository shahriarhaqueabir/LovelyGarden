import { z } from 'zod';

/**
 * ZOD SCHEMAS FOR BOTANICAL DATA VALIDATION
 * These schemas provide runtime safety for the botanical knowledge base.
 */

export const SeasonSchema = z.enum(['Spring', 'Summer', 'Autumn', 'Winter']);

export const GrowthStageIdSchema = z.enum([
  'seed', 
  'germination', 
  'seedling', 
  'vegetative', 
  'flowering', 
  'fruiting', 
  'harvest', 
  'dormant'
]);

export const PlantStageSchema = z.object({
  id: GrowthStageIdSchema,
  name: z.string(),
  durationDays: z.number().positive(),
  waterFrequencyDays: z.number().positive(),
  imageAssetId: z.string(),
});

export const PlantSpeciesSchema = z.object({
  id: z.string(),
  name: z.string(),
  scientificName: z.string(),
  description: z.string(),
  family: z.string().optional(),
  genus: z.string().optional(),
  species: z.string().optional(),
  categories: z.array(z.enum(['vegetable', 'fruit', 'herb', 'flower', 'root_crop', 'leafy_green'])),
  life_cycle: z.enum(['annual', 'biennial', 'perennial']),
  growth_habit: z.array(z.enum(['upright', 'bushy', 'vining', 'trailing', 'climbing'])),
  photosynthesis_type: z.enum(['C3', 'C4', 'CAM']).optional(),
  edible_parts: z.array(z.string()),
  toxic_parts: z.array(z.string()),
  pollination_type: z.enum(['self_pollinating', 'cross_pollinating', 'wind', 'insect']),
  sowingSeason: z.array(SeasonSchema),
  sowingMethod: z.enum(['Direct', 'Transplant']),
  stages: z.array(PlantStageSchema),
  companions: z.array(z.string()),
  antagonists: z.array(z.string()),
  confidence_score: z.number().min(0).max(1),
  sources: z.array(z.string()),
});

export type ValidatedPlantSpecies = z.infer<typeof PlantSpeciesSchema>;
export type ValidatedPlantStage = z.infer<typeof PlantStageSchema>;
