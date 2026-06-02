# AGENTS — E2E & Playwright Guidance

Purpose: patterns and conventions for writing reliable end-to-end tests with Playwright.

Where tests live
- E2E specs: [e2e](e2e)
- Playwright config: [playwright.config.ts](playwright.config.ts)
- Test fixtures: [e2e/fixtures.ts](e2e/fixtures.ts)

Run & debug (local)
```
pnpm install
pnpm dev        # Playwright config uses webServer in many cases
pnpm test:e2e
pnpm test:smoke # quick Chromium smoke run
pnpm exec playwright show-report
```

Stable selectors
- Use `data-test` / `data-testid` attributes for selectors used in tests. Avoid relying on Tailwind classes.
- Example: `<button data-test="seedstore-add">Add</button>` and in test: `await page.getByTestId('seedstore-add')`.

Auth & determinism
- Tests should prefer deterministic flows: use fixtures to seed test accounts where possible.
- If auth is unavoidable, include a lightweight signup fallback (see `e2e/responsive.spec.ts`) or mock network responses via fixtures.

Artifacts & debugging
- Screenshots, traces, and videos are stored under `test-results/` by default — check Playwright run outputs.
- Use `playwright show-report` to inspect traces and screenshots.

Best practices
- Keep tests focused: 1 assertion per test case when possible.
- Use clear naming: `smoke.*.spec.ts` for smoke tests, `responsive.*.spec.ts` for layout audits.
- Keep test timeouts reasonable and use `page.waitForSelector()` for dynamic content (avoid fixed sleeps).

When adding tests
- Add `data-test` attributes where necessary. If adding attributes in components, keep names stable and scoped (prefix by component).
- Update `e2e/fixtures.ts` with any new mock endpoints needed for deterministic tests.

If you add visual regressions
- Capture before/after screenshots and include them in the PR description.
