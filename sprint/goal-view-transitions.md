# Goal: View Transitions API + Motion Library Cleanup

**Status**: ✅ COMPLETE  
**Date**: 2026-05-10  
**Phase**: 2 — Performance & UX Polish

---

## What Was Achieved

Replaced the JavaScript-driven `AnimatePresence` tab panel transition with the native **View Transitions API** — giving hardware-accelerated, compositor-level crossfades between tabs. Also installed `@legendapp/state` for future grid reactivity work.

### Files Changed

| File                      | Change                                                                                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Tabs.tsx` | Replaced `AnimatePresence`+`motion.div` panel with `document.startViewTransition()` + `viewTransitionName` style. Removed `AnimatePresence` import. Kept `motion.div` for the spring-animated active tab pill (nav buttons). |
| `src/index.css`           | Added `@keyframes vt-fade-slide-in/out` + `::view-transition-old/new(tab-content)` rules. Added `prefers-reduced-motion` override.                                                                                           |
| `package.json`            | Added `@legendapp/state@2.1.15`                                                                                                                                                                                              |

---

## Key Decisions & Reasoning

### Why View Transitions API instead of AnimatePresence?

- `AnimatePresence` runs in JavaScript on the main thread — it holds a reference to the exiting component in the React tree until its animation completes. This causes unnecessary renders during teardown.
- `document.startViewTransition()` hands the animation entirely to the browser compositor. It captures a screenshot of the old content, begins rendering the new state, and crossfades between them using CSS — **zero JS during the animation**.
- Result: smoother performance, especially on lower-powered hardware, and the animation degrades gracefully to instant on unsupported browsers.

### Why keep `motion.div` for the active tab pill?

- The `layoutId="active-tab"` spring animation on the nav button highlight is a _positional_ animation (the pill slides from one button to another). The View Transitions API is designed for _content replacement_, not positional layout animations. `motion.div` is the right tool for that specific use case.

### Why wrap `setSelectedIndex` in `React.startTransition()`?

- `document.startViewTransition` captures the DOM immediately. If React batches the state update and defers it, the browser may capture a stale frame.
- Wrapping in `React.startTransition()` tells React this is a non-urgent update, which aligns with how View Transitions work — the browser manages urgency at the compositor level while React handles the state update at its own pace within the transition window.

### Defensive fallback pattern

```typescript
if (typeof document.startViewTransition !== "function") {
  setSelectedIndex(index);
  return;
}
```

Using `typeof` check (not `'startViewTransition' in document`) is more robust against edge cases where the property exists but is undefined.

---

## Lessons from the Tabs.tsx Replace Bug

The `replace_file_content` tool misidentified the target range and appended the new code _alongside_ the old code rather than replacing it, creating duplicate exports.

**Fix**: Used `write_to_file` with `Overwrite: true` to fully replace the file contents.

**Do**: When replacing an entire file or large contiguous block, prefer `write_to_file` with `Overwrite: true` over `replace_file_content` — it is safer for whole-file rewrites.

**Don't**: Use `replace_file_content` to replace the entire content of a file by targeting the first few lines. Use it for surgical, non-contiguous edits only.

---

## Build Result

```
✓ 4262 modules transformed.
✓ built in 11.98s
Exit code: 0
```

---

## Do's ✅

- Use `document.startViewTransition()` + CSS `::view-transition-old/new` for page/tab-level transitions — it's the correct, modern, hardware-accelerated approach.
- Always add a `@media (prefers-reduced-motion: reduce)` override for any CSS animations.
- Keep `motion.div` for `layoutId` positional animations — the View Transitions API doesn't replace spatial animations, only content-swap ones.
- Wrap the state update inside `startViewTransition` with `React.startTransition()` to prevent frame capture timing issues.

## Don'ts ❌

- Don't use `AnimatePresence` for simple tab/page content swaps — View Transitions API is lighter and more performant.
- Don't use `'property' in document` style checks for newer Web APIs — `typeof document.property !== 'function'` is safer.
- Don't put `viewTransitionName` on a wrapper element that changes size drastically between tabs — it will cause layout thrashing during the snapshot.

---

## Next: Phase 3 — Orama Vector Search + Effect-TS Reasoning Engine
