# LG-008 Garden Health Score

## Goal

Give every garden a quick health summary.

## User Story

As a gardener, I want a single score that tells me whether my garden needs attention.

## Current State

- Garden HUD shows basic score, `Stable/Watch/Care`, water count, and watch count.
- Garden view now shows named score factors for hydration, stress, pests, and capacity.

## Scope

- Hydration, stress, pests, capacity, season fit, and companion score.
- Explanation drawer/card.
- Per-garden and global scores.

## Definition of Done

- [x] Score is deterministic and explainable.
- [x] Score updates as plant state changes.
- [x] User can see contributing factors.
- [ ] Season fit and companion-score factors are included.
- [ ] Signed-in desktop/mobile visual QA completed.

## Acceptance Criteria

- [x] Given low hydration, score decreases and explanation names hydration.
- [x] Given pest infestation, score decreases and explanation names pest risk.
- [x] Given all plants are stable, score displays a positive state.

## Implementation Notes

- Score starts from 100 and subtracts deterministic penalties for hydration, stress, pest flags, and near-full capacity.
- Health factor chips live in the active garden view below Today.
- Remaining scoring depth: season fit and companion-score factors need a dedicated pass.
