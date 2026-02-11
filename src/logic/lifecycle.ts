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
  // Determine if we are using timestamps (large numbers) or cycle days (small numbers)
  // If difference is huge (> 1 year in days), assume timestamps.
  // Actually, simplest heuristic: if currentDay > 10000, assume it's a timestamp.
  
  let daysElapsed = 0;
  
  if (currentDay > 100000) {
      // Timestamp mode
      const msElapsed = currentDay - plantedDate;
      daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  } else {
      // Cycle day mode (legacy/simulation)
      daysElapsed = currentDay - plantedDate;
  }
  
  // Ensure non-negative
  if (daysElapsed < 0) daysElapsed = 0;

  let accumulatedDays = 0;
  for (const stage of stages) {
    if (!stage) continue; 
    accumulatedDays += stage.durationDays;
    
    // If we are strictly INSIDE this stage's window
    // (Previous stages duration < daysElapsed <= This accumulated duration)
    // The loop inherently handles the "previous stages" part by continuing.
    if (daysElapsed < accumulatedDays) {
      return stage.id;
    }
  }
  
  return stages[stages.length - 1]?.id || 'seed'; 
};

// Helper to get all completed stages for visual feedback
export const getCompletedStages = (
  plantedDate: number,
  stages: { id: string, durationDays: number }[],
  currentDay: number
): string[] => {
    let daysElapsed = 0;
    if (currentDay > 100000) {
        daysElapsed = Math.floor((currentDay - plantedDate) / (1000 * 60 * 60 * 24));
    } else {
        daysElapsed = currentDay - plantedDate;
    }
    
    if (daysElapsed < 0) daysElapsed = 0;

    const completed: string[] = [];
    let accumulatedDays = 0;
    
    for (const stage of stages) {
        accumulatedDays += stage.durationDays;
        if (daysElapsed >= accumulatedDays) {
            completed.push(stage.id);
        }
    }
    return completed;
};
