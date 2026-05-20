# LG-001 Connected Sync Resilience

## Goal

Make LovelyGarden feel like an online account-backed PWA while preserving local edits when connectivity or Supabase sync fails.

## User Story

As a signed-in gardener, I want to know whether my changes are online, syncing, saved locally, or failed, so I can trust that my garden data will not disappear.

## Current State

- Header sync badge exists.
- Sync status service and hook exist.
- Some cloud sync failures are caught, but not all mutations use a shared queue/retry path.

## Scope

- Shared sync status state for settings, gardens, inventory, and profile.
- Pending-local indicator when mutations cannot reach Supabase.
- Retry action when online returns.
- Clear language: `Online`, `Syncing`, `Saved Local`, `Needs Retry`.

## Definition of Done

- All cloud-backed mutation paths update sync status.
- Failed cloud writes do not block local writes.
- User can see when local changes are waiting to sync.
- Returning online triggers at least one retry attempt for pending work.
- QA covers online and simulated offline states.

## Acceptance Criteria

- Given the browser is online, when a setting is saved successfully, then the badge shows an online/synced state.
- Given the browser is offline, when a garden/inventory change is made, then the change remains visible locally and the badge indicates saved locally.
- Given a cloud request fails, then the user sees a non-blocking sync warning and can continue using the app.
- Given connectivity returns, then the app attempts to sync pending local changes.

## Notes

Do not add paid services. Use browser online/offline events, existing local RxDB state, and Supabase calls.
