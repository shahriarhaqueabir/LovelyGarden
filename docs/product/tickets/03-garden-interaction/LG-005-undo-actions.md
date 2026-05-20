# LG-005 Undo Actions

## Goal

Make destructive or accidental garden actions reversible.

## User Story

As a gardener, I want to undo common changes so mistakes are low-risk.

## Current State

- Planting and plant move actions show undo toasts.

## Scope

- Plant seed.
- Move plant.
- Delete plant.
- Return plant to bag.
- Edit garden settings.
- Harvest/loss where practical.

## Definition of Done

- Common garden mutations have undo where data can be restored safely.
- Undo updates local data and cloud sync status.
- Undo failures show clear non-blocking errors.

## Acceptance Criteria

- Given I place a seed, when I click Undo, then the plant returns to inventory.
- Given I move a plant, when I click Undo, then it returns to its previous slot.
- Given I delete a young plant, when I click Undo, then it is restored with previous details.
