# LG-001 Connected Sync Resilience

## Goal

Make LovelyGarden feel like an online account-backed PWA while preserving local edits when connectivity or Supabase sync fails.

## User Story

As a signed-in gardener, I want to know whether my changes are online, syncing, saved locally, or failed, so I can trust that my garden data will not disappear.

## Current State

- Header sync badge exists.
- Sync status service and hook exist.
- Cloud sync failures are reported through shared sync status.
- Pending local work is tracked in the shared status snapshot.
- Returning online triggers an account-level retry pass that upserts local RxDB records to Supabase.

## Scope

- Shared sync status state for settings, gardens, inventory, and profile.
- Pending-local indicator when mutations cannot reach Supabase.
- Retry action when online returns.
- Clear language: `Online`, `Syncing`, `Saved Local`, `Needs Retry`.

## Definition of Done

- [x] Cloud-backed mutation paths update sync status for gardens, planted crops, inventory, logbook, settings, and profile-adjacent preferences.
- [x] Failed cloud writes do not block local writes.
- [x] User can see when local changes are waiting to sync through `Needs Retry` / saved-local status.
- [x] Returning online triggers at least one retry attempt for pending work.
- [ ] QA covers simulated offline states in a real signed-in browser session.

## Acceptance Criteria

- [x] Given the browser is online, when a setting is saved successfully, then the badge shows an online/synced state.
- [x] Given the browser is offline, when a garden/inventory change is made, then the change remains visible locally and the badge indicates saved locally or needs retry.
- [x] Given a cloud request fails, then the user sees a non-blocking sync warning and can continue using the app.
- [x] Given connectivity returns, then the app attempts to sync pending local changes.

## Notes

Do not add paid services. Use browser online/offline events, existing local RxDB state, and Supabase calls.

Deletion retry remains a future hardening item because durable delete tombstones are not yet stored locally.
