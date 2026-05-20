# LG-015 Diagnostics Mode

## Goal

Explain why a plant may be unhappy and what to check next.

## User Story

As a gardener, I want a clear diagnostic explanation for plant problems.

## Scope

- `Why unhappy?` panel in Plant Inspector.
- Evidence from hydration, stress, pests, observations, weather, season, neighbors.
- Suggested checks and next actions.

## Definition of Done

- Diagnostics are deterministic and local.
- Evidence is visible.
- Suggestions are specific and not alarmist.

## Acceptance Criteria

- Given low hydration, diagnostics identifies water as a likely factor.
- Given pest status, diagnostics prioritizes pest inspection.
- Given multiple factors, diagnostics ranks them by severity.
