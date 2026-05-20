# LG-003 Smart Empty States

## Goal

Replace dead-end empty screens with contextual next actions.

## User Story

As a new user, I want empty pages to tell me the next useful action instead of showing zeroes.

## Current State

- Garden Guide has starter actions when no guide cards exist.

## Scope

- Garden Guide.
- Seed bag/inventory.
- Garden field.
- Logbook.
- Harvest.
- Weather.

## Definition of Done

- Every major tab has a contextual empty state.
- Empty states include at least one direct action or clear navigation hint.
- Empty states are visually consistent and compact.

## Acceptance Criteria

- Given inventory is empty, then the seed surfaces point to Seed Store.
- Given no garden exists, then the garden surface offers garden creation.
- Given no logbook entries exist, then Logbook suggests first entry types.
