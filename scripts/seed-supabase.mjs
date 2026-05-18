import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";

config({ path: ".env.local" });
config({ path: ".env" });

const prisma = new PrismaClient();

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const compact = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );

const toStringArray = (value) => (Array.isArray(value) ? value : []);

const seedSources = async () => {
  const sources = await readJson("public/data/sources.json");

  for (const source of sources) {
    await prisma.source.upsert({
      where: { id: source.id },
      update: compact({
        name: source.name,
        type: source.type,
        url: source.url,
        credibilityTier: source.credibility_tier,
      }),
      create: compact({
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        credibilityTier: source.credibility_tier,
      }),
    });
  }

  return sources.length;
};

const seedPlantCatalog = async () => {
  const plants = await readJson("public/data/plants-catalog.json");

  for (const plant of plants) {
    const requirements = plant.requirements ?? {};
    const data = compact({
      name: plant.name,
      scientificName: plant.scientific_name,
      description: plant.notes,
      family: plant.family,
      genus: plant.genus,
      species: plant.species,
      categories: toStringArray(plant.categories ?? [plant.plant_type].filter(Boolean)),
      lifeCycle: plant.life_cycle,
      growthHabit: toStringArray(plant.growth_habit),
      photosynthesisType: plant.photosynthesis_type,
      edibleParts: toStringArray(plant.edible_parts),
      toxicParts: toStringArray(plant.toxic_parts),
      pollinationType: plant.pollination_type,
      sowingSeason: toStringArray(plant.sowingSeason),
      sowingMethod: plant.sowingMethod,
      stages: plant.stages ?? [],
      companions: toStringArray(plant.companions),
      antagonists: toStringArray(plant.antagonists),
      confidenceScore: plant.confidence_score,
      sources: toStringArray(plant.sources),
      seasonality: plant.seasonality,
      sunlight: requirements.sunlight ?? plant.sunlight,
      waterRequirements:
        requirements.water_requirements ?? plant.water_requirements,
      soilType: toStringArray(plant.soil_type),
      preferredPh: requirements.soil_ph ?? plant.preferred_ph,
      commonPests: toStringArray(plant.common_pests),
      commonDiseases: toStringArray(plant.common_diseases),
      nutrientPreferences: toStringArray(plant.nutrient_preferences),
      sourceMetadata: plant.source_metadata,
    });

    await prisma.plantCatalog.upsert({
      where: { id: plant.id },
      update: data,
      create: { id: plant.id, ...data },
    });
  }

  return plants.length;
};

const seedPlantKnowledgeBase = async () => {
  const plants = await readJson("public/data/plants-kb.json");

  for (const plant of plants) {
    const plantId = plant.plant_id ?? plant.id;
    if (!plantId) continue;

    const data = compact({
      commonName: plant.common_name ?? plant.name ?? plantId,
      scientificName: plant.scientific_name,
      type: plant.type,
      family: plant.family,
      growthStage: toStringArray(plant.growth_stage),
      sowingSeason: toStringArray(plant.sowingSeason),
      sowingMethod: plant.sowingMethod,
      seasonality: plant.seasonality,
      sunlight: plant.sunlight,
      waterRequirements: plant.water_requirements,
      soilType: toStringArray(plant.soil_type),
      companionPlants: toStringArray(plant.companion_plants),
      incompatiblePlants: toStringArray(plant.incompatible_plants),
      commonPests: toStringArray(plant.common_pests),
      commonDiseases: toStringArray(plant.common_diseases),
      nutrientPreferences: toStringArray(plant.nutrient_preferences),
      notes: plant.notes,
      preferredPh: plant.preferred_ph,
      lifeCycle: plant.life_cycle,
      growthHabit: toStringArray(plant.growth_habit),
      photosynthesisType: plant.photosynthesis_type,
      edibleParts: toStringArray(plant.edible_parts),
      toxicParts: toStringArray(plant.toxic_parts),
      pollinationType: plant.pollination_type,
      stages: plant.stages ?? [],
      sourceMetadata: plant.source_metadata,
    });

    await prisma.plantKnowledgeBase.upsert({
      where: { plantId },
      update: data,
      create: { plantId, ...data },
    });
  }

  return plants.length;
};

try {
  const [sources, catalog, knowledgeBase] = await Promise.all([
    seedSources(),
    seedPlantCatalog(),
    seedPlantKnowledgeBase(),
  ]);

  console.log(
    `Seeded Supabase reference data: ${sources} sources, ${catalog} catalog plants, ${knowledgeBase} knowledge-base plants.`,
  );
} finally {
  await prisma.$disconnect();
}
