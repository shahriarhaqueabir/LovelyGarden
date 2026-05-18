# Goal: React 19 + Motion Migration

**Status**: ✅ COMPLETE  
**Date**: 2026-05-10  
**Phase**: 1 — Core Modernization

---

## What Was Achieved

Successfully upgraded the core React runtime from **v18.3.1 → v19.2.6** and migrated the animation library from the deprecated `framer-motion` package to the officially renamed `motion` package (`motion/react`).

### Files Changed

| File                          | Change                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                | `react` + `react-dom` → `^19.0.0`, `@types/react` + `@types/react-dom` → `^19.0.0`, `framer-motion` removed, `motion@^12.15.0` added, pnpm `peerDependencyRules` added for recharts |
| `src/components/ui/Modal.tsx` | Import: `framer-motion` → `motion/react`                                                                                                                                            |
| `src/components/Tabs.tsx`     | Import: `framer-motion` → `motion/react`                                                                                                                                            |
| `src/utils/ui-helpers.tsx`    | Removed now-unnecessary `import React` (React 19 JSX transform handles this automatically)                                                                                          |

---

## Key Decisions & Reasoning

### Why React 19?

- Concurrent Mode is now stable. The `GardenGrid` with its per-cell calculations will benefit from automatic batching.
- Required foundation for the React Compiler (Phase 1 extension) and for `Legend-State` integration (Phase 2).

### Why `motion` instead of `framer-motion`?

- `framer-motion` is the old package name. The library was officially renamed to `motion`.
- New entrypoint is `motion/react` for React-specific usage.
- Full React 19 Concurrent Mode support.
- Only 2 files used it — minimal blast radius.

### Why keep recharts with a peer dep override?

- Recharts still has active React 19 rendering issues tracked on GitHub.
- Using `pnpm.peerDependencyRules.allowedVersions` silences the warning without disabling checks globally.
- If recharts breaks visually, the `GrowthGraph` and chart components will be tested.

### Why remove `import React` from `ui-helpers.tsx`?

- React 17+ (react-jsx transform) handles JSX without a manual import.
- With `@types/react@19`, `noUnusedLocals: true` now correctly flags this as an error.
- This is the correct React 19 pattern — not a workaround.

---

## pnpm Store Migration Issue (Resolved)

- pnpm upgraded from v10 store → v11 store automatically during install.
- Required `--config.confirmModulesPurge=false` and `--no-frozen-lockfile` flags.
- `esbuild` and `sharp` required manual `pnpm approve-builds` to run post-install scripts.

---

## Build Result

```
✓ 4262 modules transformed.
✓ built in 12.65s
Exit code: 0
```

---

## Do's ✅

- Always run `pnpm build` (not just `tsc`) after a major dependency upgrade — Vite may catch issues tsc misses.
- Check the `motion` docs at `motion.dev` for updated APIs (`motion/react` entrypoint).
- Keep `skipLibCheck: true` in tsconfig to avoid fighting third-party type issues during major upgrades.
- Audit framer-motion usages with `grep` before upgrading — scope was only 2 files here.

## Don'ts ❌

- Don't upgrade to PGLite as a replacement for RxDB — the NoSQL stability was hard-won and the risk is not justified.
- Don't use `--legacy-peer-deps` globally — instead use pnpm's `peerDependencyRules.allowedVersions` to be surgical.
- Don't panic at IDE "Cannot find module 'react'" errors post-install — these are TS language server cache lag. Run `tsc` to get the real picture.
- Don't add `import React from "react"` manually to new files — the JSX transform handles it in React 19.

---

## Next: Phase 2 — View Transitions API + Legend-State Grid
