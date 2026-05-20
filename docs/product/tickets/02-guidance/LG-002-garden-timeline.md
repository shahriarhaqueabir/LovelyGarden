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

- Timeline renders from existing planted/logbook/observation data.
- Events are ordered newest/oldest with clear labels.
- Empty timeline has helpful next action.
- Works on mobile and desktop.

## Acceptance Criteria

- Given a plant has observations, when I open Plant Inspector, then I see those observations in a timeline.
- Given a plant was planted, then the timeline shows planted date and current stage.
- Given no history exists, then the timeline explains what actions will populate it.
