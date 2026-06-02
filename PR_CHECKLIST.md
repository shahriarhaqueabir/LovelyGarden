# PR Checklist — Frontend & E2E

Follow this checklist before opening a PR for UI or E2E changes.

- [ ] Run linters and formatters: `pnpm lint` + `prettier` (via `pnpm lint` config)
- [ ] Run unit tests: `pnpm test:unit` (or `pnpm test`)
- [ ] Run Playwright smoke: `pnpm test:smoke` (Chromium)
- [ ] For broader UI changes, run full E2E: `pnpm test:e2e`
- [ ] Build verification: `pnpm build` and `pnpm preview` (spot-check critical routes)
- [ ] Include screenshots for visual changes and attach to PR
- [ ] If the change touches persisted data, include Prisma migration files and update `src/db/index.ts` where applicable
- [ ] Confirm there are no console errors in dev server and fix any new runtime warnings
- [ ] Keep commits small and focused (1–3 files per logical change)
- [ ] Use clear commit messages: `scope: short description` (e.g., `ui: convert CTA to .btn-primary`)
- [ ] Add labels: e.g., `area:ui`, `chore`, `needs-design-review` as appropriate
- [ ] Link to related docs: point to [AGENTS-frontend.md](AGENTS-frontend.md) or [AGENTS-e2e.md](AGENTS-e2e.md) if applicable

Notes
- Do not attempt to create PRs via `gh` or API unless you supply `GITHUB_TOKEN` or have the `gh` CLI configured. Branch `frontend-ux-polish` is already pushed and can be used to open a manual PR: https://github.com/shahriarhaqueabir/LovelyGarden/compare/main...frontend-ux-polish?expand=1
- Per repo conventions, avoid global typography changes or seed icon swaps unless explicitly requested by the project owner.
