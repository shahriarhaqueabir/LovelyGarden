# LG-013 Keyboard And Touch Accessibility

## Goal

Make core planting workflows usable without drag-and-drop.

## User Story

As a keyboard or touch user, I want to plant and move items with explicit controls.

## Scope

- Tap-to-place.
- Keyboard focus states.
- ARIA labels for grid cells.
- Non-drag move controls.

## Definition of Done

- Seed placement can be completed without pointer drag.
- Grid cells are keyboard reachable and named.
- Actions have visible focus states.

## Acceptance Criteria

- Given keyboard focus is on a seed, user can select it for placement.
- Given keyboard focus is on a valid cell, user can place selected seed.
- Given screen reader reads a cell, it includes coordinates and occupied status.
