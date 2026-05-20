# LG-007 No-Key Local Assistant

## Goal

Make the free rule-based Garden Guide feel useful even without an AI API key.

## User Story

As a user with no paid API key, I want useful care advice generated from my garden data.

## Current State

- Garden Guide generates weather, health, season, capacity, companion, and history cards.

## Scope

- More rule cards.
- Explanations with evidence.
- Daily priority sorting.
- Action grouping by urgency.

## Definition of Done

- Guide consistently produces useful advice for common garden states.
- Advice explains why it appears.
- No external paid API is required.

## Acceptance Criteria

- Given thirsty plants exist, then Guide prioritizes watering.
- Given in-season inventory exists, then Guide suggests planting candidates.
- Given no data exists, then Guide gives onboarding actions.
