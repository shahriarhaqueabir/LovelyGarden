# LG-008 Garden Health Score

## Goal

Give every garden a quick health summary.

## User Story

As a gardener, I want a single score that tells me whether my garden needs attention.

## Current State

- Garden HUD shows basic score, `Stable/Watch/Care`, water count, and watch count.

## Scope

- Hydration, stress, pests, capacity, season fit, and companion score.
- Explanation drawer/card.
- Per-garden and global scores.

## Definition of Done

- Score is deterministic and explainable.
- Score updates as plant state changes.
- User can see contributing factors.

## Acceptance Criteria

- Given low hydration, score decreases and explanation names hydration.
- Given pest infestation, score decreases and explanation names pest risk.
- Given all plants are stable, score displays a positive state.
