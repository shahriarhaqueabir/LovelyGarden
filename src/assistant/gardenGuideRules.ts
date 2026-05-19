import type { GardenCoachContext } from "../ai/buildGardenContext";

export type GardenGuideWindow = "past" | "present" | "future";
export type GardenGuideSeverity = "info" | "good" | "warning" | "urgent";

export interface GardenGuideInsight {
  id: string;
  window: GardenGuideWindow;
  severity: GardenGuideSeverity;
  title: string;
  body: string;
  evidence: string[];
  action?: string;
}

const seasonByMonth = {
  North: [
    "Winter",
    "Winter",
    "Spring",
    "Spring",
    "Spring",
    "Summer",
    "Summer",
    "Summer",
    "Autumn",
    "Autumn",
    "Autumn",
    "Winter",
  ],
  South: [
    "Summer",
    "Summer",
    "Autumn",
    "Autumn",
    "Autumn",
    "Winter",
    "Winter",
    "Winter",
    "Spring",
    "Spring",
    "Spring",
    "Summer",
  ],
} as const;

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const dayToMonthIndex = (day: number) =>
  Math.max(0, Math.min(11, Math.floor(((day - 1) % 365) / 30.42)));

const getCurrentSeason = (context: GardenCoachContext) => {
  const monthIndex = dayToMonthIndex(context.user.currentDay);
  return seasonByMonth[context.user.hemisphere][monthIndex];
};

const getWeatherInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const { temperatureC, humidityPercent, precipitation } = context.weather;
  if (
    typeof temperatureC !== "number" ||
    typeof humidityPercent !== "number" ||
    typeof precipitation !== "number"
  ) {
    return [];
  }

  const insights: GardenGuideInsight[] = [];

  if (temperatureC <= 0) {
    insights.push({
      id: "present-frost",
      window: "present",
      severity: "urgent",
      title: "Frost risk right now",
      body: "Current temperature is at or below freezing, so tender plants and seedlings are exposed.",
      evidence: [`Temperature: ${temperatureC}C`],
      action: "Cover sensitive plants or move containers into shelter.",
    });
  } else if (temperatureC >= 30) {
    insights.push({
      id: "present-heat",
      window: "present",
      severity: "warning",
      title: "Heat stress likely",
      body: "High heat can raise transpiration and dry containers faster than usual.",
      evidence: [`Temperature: ${temperatureC}C`],
      action: "Check hydration before midday and water deeply if soil is dry.",
    });
  }

  if (humidityPercent < 25 && precipitation === 0) {
    insights.push({
      id: "present-dry-air",
      window: "present",
      severity: "warning",
      title: "Dry-air watering pressure",
      body: "Low humidity plus no rain increases water demand, especially for young plants.",
      evidence: [`Humidity: ${humidityPercent}%`, "No current precipitation"],
      action: "Prioritize seedlings, shallow-rooted herbs, and containers.",
    });
  }

  if (precipitation > 5) {
    insights.push({
      id: "present-heavy-rain",
      window: "present",
      severity: "warning",
      title: "Drainage check",
      body: "Heavy rain can help watering needs but may stress plants in poorly drained soil.",
      evidence: [`Precipitation: ${precipitation}mm`],
      action: "Check containers and low spots for standing water.",
    });
  }

  return insights;
};

const getPlantHealthInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const planted = context.plantedPlants;
  const thirsty = planted.filter((plant) => (plant.hydration ?? 100) < 35);
  const stressed = planted.filter((plant) => (plant.stressLevel ?? 0) > 60);
  const excellent = planted.filter(
    (plant) => (plant.hydration ?? 100) >= 70 && (plant.stressLevel ?? 0) <= 20,
  );

  const insights: GardenGuideInsight[] = [];

  if (thirsty.length > 0) {
    insights.push({
      id: "present-thirsty-plants",
      window: "present",
      severity: "urgent",
      title: `${pluralize(thirsty.length, "plant")} below hydration target`,
      body: `${thirsty
        .slice(0, 3)
        .map((plant) => plant.plantName)
        .join(", ")} need attention based on current hydration readings.`,
      evidence: thirsty
        .slice(0, 3)
        .map(
          (plant) =>
            `${plant.plantName}: ${Math.round(plant.hydration ?? 0)}% hydration`,
        ),
      action:
        "Water these first, then recheck stress after the next day advance.",
    });
  }

  if (stressed.length > 0) {
    insights.push({
      id: "present-stressed-plants",
      window: "present",
      severity: "warning",
      title: `${pluralize(stressed.length, "plant")} showing high stress`,
      body: "Stress may come from hydration swings, pests, disease, light mismatch, or crowding.",
      evidence: stressed
        .slice(0, 3)
        .map(
          (plant) =>
            `${plant.plantName}: ${Math.round(plant.stressLevel ?? 0)}% stress`,
        ),
      action: "Inspect leaves and soil before adding more plants nearby.",
    });
  }

  if (excellent.length >= 2) {
    insights.push({
      id: "present-stable-plants",
      window: "present",
      severity: "good",
      title: "Several plants are stable",
      body: "Healthy hydration and low stress suggest the current care rhythm is working.",
      evidence: excellent
        .slice(0, 4)
        .map((plant) => `${plant.plantName}: stable hydration and stress`),
      action: "Keep the current routine and watch for weather changes.",
    });
  }

  return insights;
};

const getCompanionInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const relevantPlants = context.relevantPlants.filter(
    (plant): plant is NonNullable<(typeof context.relevantPlants)[number]> =>
      Boolean(plant),
  );
  const catalogById = new Map(relevantPlants.map((plant) => [plant.id, plant]));
  const plantedByGarden = new Map<string, typeof context.plantedPlants>();

  for (const plant of context.plantedPlants) {
    const gardenPlants = plantedByGarden.get(plant.gardenId) ?? [];
    gardenPlants.push(plant);
    plantedByGarden.set(plant.gardenId, gardenPlants);
  }

  const conflicts: string[] = [];
  const synergies: string[] = [];

  for (const gardenPlants of plantedByGarden.values()) {
    for (const plant of gardenPlants) {
      const species = catalogById.get(plant.catalogId);
      if (!species) continue;

      for (const neighbor of gardenPlants) {
        if (neighbor.id === plant.id) continue;
        if (species.antagonists.includes(neighbor.catalogId)) {
          conflicts.push(`${plant.plantName} near ${neighbor.plantName}`);
        }
        if (species.companions.includes(neighbor.catalogId)) {
          synergies.push(`${plant.plantName} with ${neighbor.plantName}`);
        }
      }
    }
  }

  const insights: GardenGuideInsight[] = [];
  const uniqueConflicts = Array.from(new Set(conflicts));
  const uniqueSynergies = Array.from(new Set(synergies));

  if (uniqueConflicts.length > 0) {
    insights.push({
      id: "present-companion-conflicts",
      window: "present",
      severity: "warning",
      title: "Possible companion conflict",
      body: "Some planted neighbors are marked as antagonists in the plant knowledgebase.",
      evidence: uniqueConflicts.slice(0, 3),
      action: "Consider separating these when you reorganize beds.",
    });
  }

  if (uniqueSynergies.length > 0) {
    insights.push({
      id: "present-companion-synergy",
      window: "present",
      severity: "good",
      title: "Companion planting is helping",
      body: "Some current neighbors have beneficial relationships in the knowledgebase.",
      evidence: uniqueSynergies.slice(0, 3),
      action: "Use these pairings as templates for future beds.",
    });
  }

  return insights;
};

const getSeasonalInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const currentSeason = getCurrentSeason(context);
  const inventoryIds = new Set(context.inventory.map((item) => item.catalogId));
  const relevantPlants = context.relevantPlants.filter(
    (plant): plant is NonNullable<(typeof context.relevantPlants)[number]> =>
      Boolean(plant),
  );
  const inWindow = relevantPlants.filter(
    (plant) =>
      inventoryIds.has(plant.id) && plant.sowingSeason.includes(currentSeason),
  );
  const outOfWindow = relevantPlants.filter(
    (plant) =>
      inventoryIds.has(plant.id) &&
      plant.sowingSeason.length > 0 &&
      !plant.sowingSeason.includes(currentSeason),
  );

  const insights: GardenGuideInsight[] = [];

  if (inWindow.length > 0) {
    insights.push({
      id: "future-sow-now",
      window: "future",
      severity: "good",
      title: `${pluralize(inWindow.length, "seed")} in season`,
      body: `${inWindow
        .slice(0, 4)
        .map((plant) => plant.name)
        .join(", ")} match the current ${currentSeason} sowing window.`,
      evidence: inWindow
        .slice(0, 4)
        .map((plant) => `${plant.name}: ${plant.sowingSeason.join(", ")}`),
      action: "Pick one open garden cell and plant the strongest candidate.",
    });
  }

  if (outOfWindow.length > 0) {
    insights.push({
      id: "future-sow-later",
      window: "future",
      severity: "info",
      title: `${pluralize(outOfWindow.length, "seed")} better saved`,
      body: "Some inventory does not match the current season, so waiting may reduce stress.",
      evidence: outOfWindow
        .slice(0, 4)
        .map(
          (plant) => `${plant.name}: prefers ${plant.sowingSeason.join(", ")}`,
        ),
      action: "Keep these in inventory and revisit the calendar next season.",
    });
  }

  return insights;
};

const getGardenCapacityInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const openGardens = context.gardens.filter(
    (garden) => garden.grid.occupied < garden.grid.capacity,
  );
  const fullGardens = context.gardens.filter(
    (garden) => garden.grid.occupied >= garden.grid.capacity,
  );

  const insights: GardenGuideInsight[] = [];

  if (openGardens.length > 0) {
    insights.push({
      id: "future-open-space",
      window: "future",
      severity: "info",
      title: "Planting space available",
      body: `${openGardens[0].name} has ${
        openGardens[0].grid.capacity - openGardens[0].grid.occupied
      } open grid cells.`,
      evidence: openGardens.map(
        (garden) =>
          `${garden.name}: ${garden.grid.occupied}/${garden.grid.capacity} occupied`,
      ),
      action: "Use the calendar window before filling the next cell.",
    });
  }

  if (fullGardens.length > 0) {
    insights.push({
      id: "future-full-garden",
      window: "future",
      severity: "warning",
      title: "Some beds are full",
      body: "Full beds can make spacing decisions more important for future planting.",
      evidence: fullGardens.map((garden) => `${garden.name}: full`),
      action: "Avoid adding plants until something is harvested or moved.",
    });
  }

  return insights;
};

const getHistoryInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const recent = context.recentLogbook;
  if (recent.length === 0) {
    return [
      {
        id: "past-no-logbook",
        window: "past",
        severity: "info",
        title: "No recent logbook pattern yet",
        body: "The guide gets smarter when purchases, harvests, problems, and notes are recorded.",
        evidence: ["Recent logbook is empty"],
        action: "Log the next garden action so future guidance has history.",
      },
    ];
  }

  const purchaseCount = recent.filter((entry) =>
    entry.type.toLowerCase().includes("purchase"),
  ).length;
  const latest = recent[0];

  const insights: GardenGuideInsight[] = [
    {
      id: "past-latest-log",
      window: "past",
      severity: "info",
      title: "Latest recorded event",
      body: `${latest.itemName} was the most recent logbook entry.`,
      evidence: [
        `Type: ${latest.type}`,
        `Date: ${new Date(latest.date).toLocaleDateString()}`,
      ],
      action: "Use notes consistently so patterns become visible.",
    },
  ];

  if (purchaseCount >= 2) {
    insights.push({
      id: "past-inventory-growth",
      window: "past",
      severity: "info",
      title: "Inventory has been growing",
      body: "Recent logbook entries show multiple purchases, so planning space matters before adding more seeds.",
      evidence: [`${purchaseCount} recent purchase entries`],
      action: "Compare inventory against open garden cells before buying more.",
    });
  }

  return insights;
};

export const generateGardenGuideInsights = (
  context: GardenCoachContext,
): GardenGuideInsight[] => {
  const insights = [
    ...getWeatherInsights(context),
    ...getPlantHealthInsights(context),
    ...getCompanionInsights(context),
    ...getSeasonalInsights(context),
    ...getGardenCapacityInsights(context),
    ...getHistoryInsights(context),
  ];

  const severityRank: Record<GardenGuideSeverity, number> = {
    urgent: 0,
    warning: 1,
    good: 2,
    info: 3,
  };

  return insights.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
};
