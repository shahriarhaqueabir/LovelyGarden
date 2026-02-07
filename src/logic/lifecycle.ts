import { createMachine } from 'xstate';

/**
 * PLANT LIFECYCLE FSM
 * Defines the progression of a plant from seed to senescence.
 */
export const plantLifecycleMachine = createMachine({
  id: 'plantLifecycle',
  initial: 'seed',
  states: {
    seed: {
      on: {
        PLANT: 'germination'
      }
    },
    germination: {
      on: {
        GROW: 'seedling',
        WITHER: 'dead'
      }
    },
    seedling: {
      on: {
        GROW: 'vegetative',
        WITHER: 'dead'
      }
    },
    vegetative: {
      on: {
        GROW: 'flowering',
        WITHER: 'dead'
      }
    },
    flowering: {
      on: {
        GROW: 'fruiting',
        WITHER: 'dead'
      }
    },
    fruiting: {
      on: {
        HARVEST: 'harvest',
        WITHER: 'dead'
      }
    },
    harvest: {
      type: 'final'
    },
    dead: {
      type: 'final'
    }
  }
});

/**
 * Service to calculate the current state based on elapsed time.
 * This combines the FSM logic with the "Lazy Evaluation" requirement.
 */
export const calculateCurrentStage = (
  plantedDate: number,
  stages: { id: string, durationDays: number }[],
  currentDay: number
) => {
  const daysElapsed = currentDay - plantedDate;
  
  let accumulatedDays = 0;
  for (const stage of stages) {
    if (!stage) continue; // Safety check
    accumulatedDays += stage.durationDays;
    if (daysElapsed < accumulatedDays) {
      return stage.id;
    }
  }
  
  return stages[stages.length - 1]?.id || 'seed'; // Return last stage or seed if empty
};
