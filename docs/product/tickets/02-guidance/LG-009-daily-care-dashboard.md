# LG-009 Daily Care Dashboard

## Goal

Add a Today view that answers: what should I do now?

## User Story

As a gardener, I want one daily dashboard for watering, planting, checking, and harvesting.

## Scope

- Today summary.
- Care tasks from rules.
- Weather-sensitive tasks.
- Quick links to relevant plant/garden.

## Definition of Done

- [x] A daily care surface exists.
- [x] Tasks are grouped by priority.
- [x] Tasks link to the relevant action surface.
- [ ] Signed-in desktop/mobile visual QA completed.

## Acceptance Criteria

- [x] Given a thirsty plant exists, Today shows a watering task.
- [x] Given seeds are in season and cells are open, Today shows planting task.
- [x] Given no tasks exist, Today shows a calm all-clear state.

## Implementation Notes

- Today strip lives in the active garden view below recent activity.
- `Now` tasks include low hydration, high stress/pest checks, and weather alerts.
- `Next` tasks include harvest-ready plants and seasonal seeds when grid cells are open.
- Task buttons open the relevant plant inspector, enable Plant Now filtering, or switch to the health layer.
