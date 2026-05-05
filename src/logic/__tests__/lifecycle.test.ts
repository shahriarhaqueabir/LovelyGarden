import { describe, it, expect } from "vitest";
import {
  plantLifecycleMachine,
  msToElapsedDays,
  calculateCurrentStage,
  getCompletedStages,
} from "../lifecycle";
import { createActor } from "xstate";

describe("plantLifecycleMachine", () => {
  it("should start in seed state", () => {
    const actor = createActor(plantLifecycleMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe("seed");
  });

  it("should transition from seed to germination on PLANT", () => {
    const actor = createActor(plantLifecycleMachine);
    actor.start();
    actor.send({ type: "PLANT" });
    expect(actor.getSnapshot().value).toBe("germination");
  });

  it("should transition through growth stages on GROW", () => {
    const actor = createActor(plantLifecycleMachine);
    actor.start();
    actor.send({ type: "PLANT" });
    actor.send({ type: "GROW" });
    expect(actor.getSnapshot().value).toBe("seedling");
    actor.send({ type: "GROW" });
    expect(actor.getSnapshot().value).toBe("vegetative");
  });
});

describe("msToElapsedDays", () => {
  it("should return 0 when now is before planted date", () => {
    const planted = Date.now();
    const now = planted - 86400000;
    expect(msToElapsedDays(planted, now)).toBe(0);
  });

  it("should calculate correct days elapsed", () => {
    const planted = new Date("2024-01-01").getTime();
    const now = new Date("2024-01-05").getTime();
    expect(msToElapsedDays(planted, now)).toBe(4);
  });
});

describe("calculateCurrentStage", () => {
  const stages = [
    { id: "seed", durationDays: 0 },
    { id: "germination", durationDays: 3 },
    { id: "seedling", durationDays: 5 },
  ];

  it("should return seed stage at day 0", () => {
    const planted = new Date("2024-01-01").getTime();
    const now = planted;
    expect(calculateCurrentStage(planted, stages, now)).toBe("seed");
  });

  it("should return seedling after germination period", () => {
    const planted = new Date("2024-01-01").getTime();
    const now = new Date("2024-01-05").getTime();
    expect(calculateCurrentStage(planted, stages, now)).toBe("seedling");
  });
});

describe("getCompletedStages", () => {
  const stages = [
    { id: "seed", durationDays: 0 },
    { id: "germination", durationDays: 3 },
    { id: "seedling", durationDays: 5 },
  ];

  it("should return seed stage at day 0 since seed has 0 duration", () => {
    const planted = new Date("2024-01-01").getTime();
    const now = planted;
    expect(getCompletedStages(planted, stages, now)).toEqual(["seed"]);
  });

  it("should return completed stages after enough time", () => {
    const planted = new Date("2024-01-01").getTime();
    const now = new Date("2024-01-10").getTime();
    expect(getCompletedStages(planted, stages, now)).toContain("germination");
  });
});
