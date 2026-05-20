# LG-006 Drag And Tap Placement UX

## Goal

Make planting work well on desktop and mobile.

## User Story

As a mobile user, I want to plant without fragile drag-and-drop.

## Current State

- Drag overlay and grid sizing have been stabilized.

## Scope

- Tap seed, tap cell placement mode.
- Keyboard placement mode.
- Better drag ghost.
- Stable grid dimensions.
- Clear invalid-drop feedback.

## Definition of Done

- User can place seeds without drag-and-drop.
- Drag remains smooth and pointer-aligned.
- Mobile viewport can complete seed placement.
- Grid size does not jump after placement.

## Acceptance Criteria

- Given I tap a seed, then empty grid cells enter selectable placement mode.
- Given I tap an empty cell, then the seed is planted there.
- Given I tap an occupied cell, then I receive an invalid placement message.
