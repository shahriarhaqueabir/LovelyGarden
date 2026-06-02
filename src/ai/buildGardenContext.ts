import { getDatabase } from "../db";
import type { PlantSpecies } from "../schema/knowledge-graph";
import type { WeatherData } from "../services/weatherService";

interface BuildGardenContextOptions {
  catalog: PlantSpecies[];
  currentDay: number;
  hemisphere: "North" | "South";
  weather: WeatherData | null;
}

const compactPlant = (plant: PlantSpecies | undefined) =>
  plant
    ? {
        id: plant.id,
        name: plant.name,
        scientificName: plant.scientificName,
        categories: plant.categories ?? [],
        sowingSeason: plant.sowingSeason ?? [],
        sowingMethod: plant.sowingMethod,
        sunlight: plant.sunlight,
        waterRequirements: plant.water_requirements,
        soilType: plant.soil_type ?? [],
        companions: plant.companions ?? [],
        antagonists: plant.antagonists ?? [],
        commonPests: plant.common_pests ?? [],
        commonDiseases: plant.common_diseases ?? [],
        edibleParts: plant.edible_parts ?? [],
        toxicParts: plant.toxic_parts ?? [],
      }
    : undefined;

export const buildGardenCoachContext = async ({
  catalog,
  currentDay,
  hemisphere,
  weather,
}: BuildGardenContextOptions) => {
  const db = await getDatabase();
  const [gardens, inventory, planted, logbook] = await Promise.all([
    db.gardens.find().exec(),
    db.inventory.find().exec(),
    db.planted.find().exec(),
    db.logbook
      .find({ sort: [{ date: "desc" }] })
      .limit(8)
      .exec(),
  ]);

  const plantIds = new Set<string>();
  inventory.forEach((item) => plantIds.add(item.catalogId));
  planted.forEach((plant) => plantIds.add(plant.catalogId));

  const catalogById = new Map(catalog.map((plant) => [plant.id, plant]));
  const relevantPlants = Array.from(plantIds)
    .slice(0, 16)
    .map((id) => compactPlant(catalogById.get(id)))
    .filter(Boolean);

  return {
    app: {
      name: "LovelyGarden",
      assistant: "Garden Coach",
      mode: "optional mobile-first read-only assistant",
    },
    user: {
      currentDay,
      hemisphere,
    },
    weather: weather
      ? {
          temperatureC: weather.current.temperature_2m,
          humidityPercent: weather.current.relative_humidity_2m,
          precipitation: weather.current.precipitation,
          weatherCode: weather.current.weather_code,
        }
      : {
          note: "Weather is unavailable or location permission was denied.",
        },
    gardens: gardens.map((garden) => {
      const data = garden.toJSON();
      const plantsInGarden = planted.filter((plant) => plant.bedId === data.id);

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        soilType: data.soilType,
        sunExposure: data.sunExposure,
        grid: {
          width: data.gridWidth,
          height: data.gridHeight,
          occupied: plantsInGarden.length,
          capacity: data.gridWidth * data.gridHeight,
        },
      };
    }),
    inventory: inventory.slice(0, 20).map((item) => ({
      id: item.id,
      catalogId: item.catalogId,
      plantName: catalogById.get(item.catalogId)?.name ?? item.catalogId,
      acquiredDate: item.acquiredDate,
    })),
    plantedPlants: planted.slice(0, 30).map((plant) => ({
      id: plant.id,
      gardenId: plant.bedId,
      bedId: plant.bedId,
      catalogId: plant.catalogId,
      plantName: catalogById.get(plant.catalogId)?.name ?? plant.catalogId,
      plantedDate: plant.plantedDate,
      healthStatus: plant.healthStatus,
      hydration: plant.hydration,
      stressLevel: plant.stressLevel,
      observations: plant.observations ?? [],
    })),
    recentLogbook: logbook.map((entry) => ({
      type: entry.type,
      itemName: entry.itemName,
      category: entry.category,
      date: entry.date,
      notes: entry.notes,
    })),
    relevantPlants,
  };
};

export type GardenCoachContext = Awaited<
  ReturnType<typeof buildGardenCoachContext>
>;
