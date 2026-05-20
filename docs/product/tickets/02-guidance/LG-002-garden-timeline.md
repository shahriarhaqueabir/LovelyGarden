# LG-002 Garden Timeline

## Goal

Show a readable lifecycle timeline for each plant and garden.

## User Story

As a gardener, I want to see what happened to a plant over time so I understand progress, problems, and care history.

## Scope

- Per-plant timeline in Plant Inspector.
- Garden-level recent activity strip.
- Events: planted, moved, watered, observation, harvest, loss.

## Definition of Done

- [x] Timeline renders from existing planted, logbook, and observation data.
- [x] Events are ordered newest/oldest with clear labels.
- [x] Empty garden activity strip has helpful next action.
- [x] Garden strip includes planted, moved, harvest, and loss logbook events.
- [ ] Harvest/loss events are joined into a removed-plant detail view after durable plant event IDs exist.
- [ ] Works on mobile and desktop after signed-in visual QA.

## Acceptance Criteria

- [x] Given a plant has observations, when I open Plant Inspector, then I see those observations in a timeline.
- [x] Given a plant was planted, then the timeline shows planted date and current stage.
- [x] Given no garden activity exists, then the strip explains what actions will populate it.

## Implementation Notes

- Plant timeline currently includes planted, watered, current stage, and plant observations.
- Garden recent activity strip includes planted, watered, moved, harvest, loss, and observation events for the active garden.
- Move events are now written to logbook from `relocatePlant`; undo moves are labeled as `move_undo` instead of a normal second move.
- Harvest/loss history exists in logbook after the plant is removed, so full plant-level historical joins need a later event model or removed-plant detail surface.
