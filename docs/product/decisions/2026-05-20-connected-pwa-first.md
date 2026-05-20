# Decision: Connected PWA First

Date: 2026-05-20

## Context

The app should assume users normally have internet and access it online as a PWA. Local storage remains important, but primarily as resilience during temporary connection loss.

## Decision

Design LovelyGarden as a connected, account-backed PWA:

- Online account sync is the expected happy path.
- Local RxDB remains the immediate write target for speed and resilience.
- If cloud sync fails, the user should see a local-saved/pending state instead of losing work.
- No paid services are added for the roadmap.

## Consequences

- UI language should avoid implying offline-first is the main product value.
- Sync status and retry behavior become core UX.
- Backup/export remains important as a free safety net.
