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
