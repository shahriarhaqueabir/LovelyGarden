# 🚀 Sprint Kick-off: Raida's Garden Bleeding Edge

## 🎯 Vision

Transform **Raida's Garden** into a state-of-the-art local-first application that feels native, intelligent, and ultra-performant.

## 🛠️ Stack Audit & Decisions

### Core Changes

- **React 18 -> 19**: Moving to the future of React.
- **Zustand -> Hybrid (Legend-State)**: Keeping Zustand for global UI state, but moving high-frequency grid data to Legend-State for fine-grained reactivity.
- **Rule-based -> Vector-based**: Adding Orama to allow semantic reasoning over the plant knowledge base.
- **Batch-launcher -> Tauri v2**: Moving to a proper native wrapper.

### Skeptical Scrutiny Notes

- **Compatibility**: RxDB v17 and Framer Motion must be checked against React 19 Peer Dependencies.
- **Complexity**: Effect-TS will be localized to the `src/logic/reasoning.ts` to prevent "abstraction leak" into the UI layer.
- **Risk**: PGLite migration was rejected to avoid breaking the existing NoSQL/RxDB stability.

## 📈 Initial Goals

1. **Audit Phase**: Verify all dependencies can coexist in React 19.
2. **UX Quick Wins**: Implement View Transitions API for immediate "premium" feel.
3. **Performance Foundation**: Setup Legend-State for the Grid.

---

## 📝 Log Strategy

- **File**: `sprint/goal-[name].md`
- **Content**: Reasoning, Do's/Don'ts, iteration patterns.
- **Status**: Updated on every major achievement.

---

_Initialized: 2026-05-10 13:22_
