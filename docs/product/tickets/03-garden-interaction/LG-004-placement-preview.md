# LG-004 Placement Preview

## Goal

Make seed placement intelligent and predictable.

## User Story

As a gardener, I want the grid to show whether a slot is a good fit before I drop a seed.

## Current State

- Empty slots show `Good Fit`, `Avoid`, or `Open` while dragging.

## Scope

- Companion/antagonist preview.
- Occupied/invalid target preview.
- Snap ghost in target cell.
- Explanation for why a slot is good or bad.

## Definition of Done

- Dragging a seed clearly identifies valid and invalid slots.
- Beneficial and antagonistic slots have distinct styling and text.
- The target cell shows a stable ghost preview under the pointer.
- Preview does not resize the grid.

## Acceptance Criteria

- Given a dragged seed has companion data, then neighboring slots show positive/negative labels.
- Given a slot is occupied, then it is visually invalid.
- Given drag ends without drop, then all previews clear.
