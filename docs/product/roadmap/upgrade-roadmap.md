# LovelyGarden Upgrade Roadmap

Last updated: 2026-05-20

## Product Direction

LovelyGarden is a connected PWA first. The normal experience assumes internet and account-backed sync. Local-first storage remains a resilience layer: if a user loses connection, changes stay usable locally and sync when connection returns.

## Status Summary

| ID | Upgrade | Status | Track |
| --- | --- | --- | --- |
| LG-001 | Connected sync resilience | In progress | Sync |
| LG-002 | Garden timeline | Backlog | Guidance |
| LG-003 | Smart empty states | In progress | Guidance |
| LG-004 | Placement preview | In progress | Interaction |
| LG-005 | Undo actions | In progress | Interaction |
| LG-006 | Drag and tap placement UX | In progress | Interaction |
| LG-007 | No-key local assistant | In progress | Guidance |
| LG-008 | Garden health score | In progress | Guidance |
| LG-009 | Daily care dashboard | Backlog | Guidance |
| LG-010 | Visual plant growth | Backlog | Interaction |
| LG-011 | Backup and restore | In progress: export/import schema hardened | Data |
| LG-012 | Local notifications | Backlog | Sync |
| LG-013 | Keyboard and touch accessibility | Backlog | Accessibility |
| LG-014 | Season calendar upgrade | Backlog | Guidance |
| LG-015 | Diagnostics mode | Backlog | Guidance |

## Implementation Order

1. Stabilize data safety and sync confidence: LG-001, LG-011.
2. Make the garden easier to act on: LG-004, LG-005, LG-006, LG-013.
3. Make the app feel intelligent without paid APIs: LG-003, LG-007, LG-008, LG-009, LG-015.
4. Deepen long-term gardening value: LG-002, LG-010, LG-014, LG-012.

## Record Keeping

- Ticket specs live in `docs/product/tickets/**`.
- Implementation logs live in `docs/product/logs/implementation/**`.
- QA logs live in `docs/product/logs/qa/**`.
- Product/technical decisions live in `docs/product/decisions/**`.
