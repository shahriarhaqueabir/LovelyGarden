import { createMachine } from "xstate";

/**
 * PLANT LIFECYCLE FSM
 * Defines the progression of a plant from seed to senescence.
 */
export const plantLifecycleMachine = createMachine({
  id: "plantLifecycle",
  initial: "seed",
  states: {
    seed: {
      on: {
        PLANT: "germination",
      },
    },
    germination: {
      on: {
        GROW: "seedling",
        WITHER: "dead",
      },
    },
    seedling: {
      on: {
        GROW: "vegetative",
        WITHER: "dead",
      },
    },
    vegetative: {
      on: {
        GROW: "flowering",
        WITHER: "dead",
      },
    },
    flowering: {
      on: {
        GROW: "fruiting",
        WITHER: "dead",
      },
    },
    fruiting: {
      on: {
        HARVEST: "harvest",
        WITHER: "dead",
      },
    },
    harvest: {
      type: "final",
    },
    dead: {
      type: "final",
    },
  },
});

/**
 * Calculate the number of calendar days elapsed between two real timestamps (ms).
 * Both arguments must be Unix-epoch milliseconds.
 */
export const msToElapsedDays = (
  plantedTimestampMs: number,
  nowTimestampMs: number,
): number => {
  const elapsed = nowTimestampMs - plantedTimestampMs;
  return elapsed > 0 ? Math.floor(elapsed / (1000 * 60 * 60 * 24)) : 0;
};

/**
 * Calculate the current growth stage id for a plant.
 *
 * @param plantedTimestampMs  - Real timestamp (ms since epoch) when the seed was planted.
 *                              Stored as plantedDate in the DB.
 * @param stages              - Ordered stage definitions with durationDays.
 * @param nowTimestampMs      - Real "now" timestamp (ms since epoch).
 *                              Use Date.now() for live view, or
 *                              plantedTimestampMs + simulationDays * 86_400_000 for scrubbing.
 */
export const calculateCurrentStage = (
  plantedTimestampMs: number,
  stages: { id: string; durationDays: number }[],
  nowTimestampMs: number,
): string => {
  const daysElapsed = msToElapsedDays(plantedTimestampMs, nowTimestampMs);

  let accumulated = 0;
  for (const stage of stages) {
    if (!stage) continue;
    accumulated += stage.durationDays;
    // Use <= to include the exact day the stage ends
    if (daysElapsed <= accumulated) {
      return stage.id;
    }
  }

  // Plant has completed all stages — return the last stage id.
  return stages[stages.length - 1]?.id ?? "seed";
};

/**
 * Return all stage ids that the plant has fully completed.
 *
 * @param plantedTimestampMs - Real timestamp (ms) when the seed was planted.
 * @param stages             - Ordered stage definitions.
 * @param nowTimestampMs     - Real "now" timestamp (ms).
 */
export const getCompletedStages = (
  plantedTimestampMs: number,
  stages: { id: string; durationDays: number }[],
  nowTimestampMs: number,
): string[] => {
  const daysElapsed = msToElapsedDays(plantedTimestampMs, nowTimestampMs);

  const completed: string[] = [];
  let accumulated = 0;

  for (const stage of stages) {
    accumulated += stage.durationDays;
    if (daysElapsed >= accumulated) {
      completed.push(stage.id);
    }
  }

  return completed;
};
