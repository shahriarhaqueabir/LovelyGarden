# QA Log: Upgrade Track

Date: 2026-05-20

## Verified

- `pnpm build` passed after connected PWA garden UX upgrades.
- Live smoke check on `https://lovely-garden.vercel.app/` returned HTTP 200 and title `Lovely Garden`.

## Known Gaps

- Logged-in garden drag workflow requires a real session to validate end-to-end.
- Offline sync queue is not complete.
- Backup import/export needs hardening before it can be considered safe.

## Next QA Focus

- Validate LG-011 by exporting from local DB and importing the exported JSON into the same schema parser.
- Run `pnpm build`.
- Smoke test Settings export/import UI where possible.

## LG-011 QA

- `pnpm vitest --run src/db/__tests__/export-import.test.ts`: passed.
- `pnpm build`: passed.
- Remaining gap: full browser import/export round trip with a populated signed-in account should be tested in a real session.

## LG-001 QA

- `pnpm build`: passed.
- `pnpm vitest --run src/services/__tests__/syncStatusService.test.ts src/services/__tests__/syncRetryService.test.ts`: passed.
- `pnpm test`: passed.
- Pending-local and retry-ordering unit tests added.
- Live smoke check after deployment `6081c02`: HTTP 200, title `Lovely Garden`, no console errors on unauthenticated load.
- `test:rls` was not run because it requires two configured Supabase test accounts in environment variables.
- Remaining gap: browser DevTools offline/online retry should be tested in a real signed-in account to verify Supabase reconnect behavior and badge messaging.

## LG-002 QA

- `pnpm build`: passed.
- `pnpm test`: passed.
- Move undo now logs as `move_undo` instead of a normal second move; visual QA still needed to inspect timeline labeling in a signed-in session.
- Remaining gap: signed-in visual QA should verify selecting a plant shows the timeline on desktop and mobile, because the unauthenticated route stops at the auth screen.

## LG-009 QA

- `pnpm build`: passed.
- `pnpm test`: passed.
- Remaining gap: signed-in visual QA should verify Today task rendering, horizontal overflow, and task button behavior on desktop and mobile.

## LG-008 QA

- `pnpm build`: passed.
- `pnpm test`: passed.
- Remaining gap: signed-in visual QA should verify health factor chips, pest count display, and responsive horizontal overflow.
