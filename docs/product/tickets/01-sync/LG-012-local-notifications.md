# LG-012 Local Notifications

## Goal

Use browser notifications for care reminders without paid infrastructure.

## User Story

As a gardener, I want local reminders for watering, sowing windows, harvests, and weather risks.

## Scope

- Permission request in Settings.
- Local notification scheduling where browser supports it.
- Fallback in-app reminders.

## Definition of Done

- User controls notification permission and preference.
- Notifications are only sent for meaningful care events.
- In-app fallback exists when notifications are blocked.

## Acceptance Criteria

- Given notifications are enabled and permission granted, then reminder can be shown.
- Given permission is denied, then app does not nag repeatedly.
- Given notifications are disabled, then no browser notification is attempted.
