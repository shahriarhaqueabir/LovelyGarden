# LG-011 Backup And Restore

## Goal

Make garden data portable and recoverable for free.

## User Story

As a gardener, I want to export and import my data so I can recover from mistakes or move browsers.

## Current State

- Settings tab exposes JSON export/import.
- Export/import utility exists.
- Export/import schema has been hardened for gardens, inventory, planted, logbook, and settings.

## Scope

- Export gardens, inventory, planted, logbook, settings.
- Validate imports against document-shaped schemas.
- Show clear import preview/safety copy.
- Avoid accidental destructive restore.

## Definition of Done

- Export includes all user-owned local data.
- Import can restore a valid export from this app.
- Invalid files are rejected with useful errors.
- UI clearly says merge/restore behavior.

## Acceptance Criteria

- Given I export, then the JSON includes gardens, inventory, planted, logbook, and settings. **Done**
- Given I import that same file, then import succeeds.
- Given I import malformed JSON, then import fails before opening the database. **Covered**

## Implementation Notes

- Export payload version is now `2`.
- Import uses collection-specific Zod object schemas and `bulkUpsert`.
- Settings UI explains export contents and merge behavior.
- Remaining work: add a true pre-import preview before merge and browser-test a populated round trip.
