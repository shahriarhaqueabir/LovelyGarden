# AGENTS — Frontend Guidance

Purpose: concise conventions and patterns for frontend edits, visual polish, and CTA sweeps.

Quick links
- App entry & global styles: [src/main.tsx](src/main.tsx), [src/index.css](src/index.css)
- Components: [src/components](src/components)
- Styling tokens & utilities: `src/index.css` (contains `.btn-primary`, skeletons, glass, depth)
- DB migrations: [prisma/schema.prisma](prisma/schema.prisma), [src/db/index.ts](src/db/index.ts)

Commands (local)
```
pnpm install
pnpm dev
pnpm lint
pnpm test:unit
pnpm test:smoke    # Playwright smoke (Chromium)
pnpm test:e2e
pnpm build
```

Styling & CTA rules
- Use `.btn-primary` for actionable, interactive CTAs. Use `.btn-primary.btn-sm` for compact CTAs.
- Preserve decorative theme tokens (e.g., `bg-garden-*`) — these are used for badges/visuals, not interaction state.
- Avoid changing typography scale unless explicitly requested. The user asked to skip typography work by default.
- Prefer small, scoped changes. Keep commits for UI tweaks to 1–3 files.

Selectors & testing
- Add `data-test` or `data-testid` attributes for stable e2e/visual tests instead of relying on class names.
- For accessibility, ensure `role`, `aria-*` attributes, and semantic elements are used.

Persisted-data changes
- If changes alter stored shapes, add a Prisma migration and update `src/db/index.ts` migrations. Run `pnpm db:generate` and include migration files in the PR.

Commit & PR style
- Commit message: `scope: short description` (e.g., `ui(seed-store): convert primary CTA to .btn-primary`).
- Include screenshots for visual changes. Reference [PR_CHECKLIST.md](PR_CHECKLIST.md) in PR description.

Do / Don't
- Do: run `pnpm lint` + `pnpm test:unit` and the Playwright smoke test for visual UI changes.
- Do: keep visual changes small and reviewable.
- Don't: swap seed icons or change the global typographic hierarchy unless explicitly asked.

If unsure: Ask the human reviewer whether a token is decorative (badge/glow) or should become an interactive CTA.
