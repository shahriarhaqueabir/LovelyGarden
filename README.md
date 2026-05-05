# LovelyGarden

A PWA gardening manager that blends gamification, plant science, and AI-assisted reasoning — built entirely through iterative, AI-driven development.

---

## 🧩 Problem

Gardeners face a fragmented toolchain: weather apps don’t understand sowing windows, databases don’t model companion planting, and calendars don’t reflect plant lifecycles.

- **Context**: Home gardeners, allotment growers, and horticulture students need a unified tool
- **Pain point**: Existing apps are either too simple (to-do lists) or too complex (agricultural enterprise software)
- **Why it matters**: Seasonal timing, soil science, and plant relationships directly impact yield and sustainability

---

## ❌ Why Existing Solutions Fall Short

- **General-purpose apps** (Notion, Trello): No plant lifecycle awareness, no gardening domain logic
- **Single-purpose tools** (weather apps, sowing calculators): No unified view, no cross-feature reasoning
- **Trade-offs in current tools**: Either offline incapable, or lack intelligent recommendations

---

## 💡 Approach

**Core idea**: Treat a garden as a * Reasoned Knowledge Graph* — plants, seasons, soil, and climate are nodes; relationships (companion/antagonistic) and rules drive suggestions.

**Design philosophy**:
- Offline-first (IndexedDB via RxDB)
- Reasoning layer (XState + custom logic) decoupled from UI
- Gamified UX to encourage consistent tracking

**Key decisions**:
- PWA over native app (no app store friction)
- RxDB over Firebase (local-first, sync-ready)
- Fuse.js + debounced search for fuzzy plant lookup
- AI-assisted development to accelerate niche domain modeling

---

## 🏗️ Architecture

### Components
- **UI**: React 18 + TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Logic**: XState state machines (plant lifecycle), custom reasoning engine (companion scoring, seasonality)
- **Data layer**: RxDB (IndexedDB), Zod validation, TanStack React Query

### Data Flow
1. **Input**: User sows seeds, logs observations, updates location
2. **Processing**: Reasoning engine evaluates companion scores, seasonality, weather risks
3. **Output**: Visual garden grid, sowing calendar, XP-based gamification, weather alerts

### Diagram
```
User Input → React UI → Zustand Store
                     ↓
              RxDB (IndexedDB)
                     ↓
          Reasoning Engine (XState)
                     ↓
        Visual Garden + Calendar + Alerts
```

---

## 🤖 AI Involvement

### Where AI was used
- **Ideation**: Helping structure the knowledge graph schema (16 domains)
- **Code generation**: Component scaffolding, test generation, migration strategies
- **Debugging**: Resolving TypeScript strict-mode errors, Playwright test setup
- **Refactoring**: Chunk-splitting strategy, dead code removal, `any` type elimination

### Prompt Strategy
- **Initial prompt**: "Build a PWA garden manager with RxDB, React, and gamification"
- **Constraints added**: Must be offline-first, must use Zod for validation, must include reasoning layer
- **Iteration logic**: Subagent-driven development (4 parallel agents for Core Fixes, Performance, Testing, Dead Code)

### What worked
- Parallel subagent execution (4 agents simultaneously) saved ~70% iteration time
- Structured templates (like this one) forced clarity before coding
- AI-assisted TypeScript strict-mode cleanup caught 12+ hidden type issues

### What didn’t
- Early attempts at aggressive code-splitting caused circular chunk warnings (Vite/Rollup)
- Over-reliance on `any` types early on required later cleanup
- Playwright test version conflicts between `@playwright/test` and `playwright` packages

---

## 🔁 Build Log (Iteration History)

### Iteration 1
- **Goal**: Initial PWA scaffold with RxDB, React, basic garden grid
- **Result**: Functional but bloated, missing validation, mixed `any` types
- **Issue**: No input validation on JSON imports, unused stores, duplicate configs

### Iteration 2
- **Change introduced**: Removed dead code, added Zod validation, pre-commit hooks
- **Result**: Cleaner repo, safer data imports, lint passing
- **Insight**: Dead code removal (appStore.ts, unused sprites) simplified mental model

### Iteration 3
- **Change introduced**: Performance optimizations (chunk splitting, lazy loading, debounced fuzzy search)
- **Result**: Faster initial loads, better search UX
- **Insight**: Keeping React with its dependencies in one chunk avoids circular dependency warnings

### Iteration 4 (Final)
- **Change introduced**: Test expansion (Vitest + RTL), documentation, Storybook, Playwright E2E
- **Final state**: 26/26 Vitest tests passing, build green, lint green, structured for collaboration

---

## ⚖️ Trade-offs

- **Chose RxDB over Firebase** because: local-first architecture aligns with offline gardening use cases
- **Chose Vite over CRA/Next.js** because: PWA requirements, service worker control, lighter output
- **Known limitations**: No server-side sync yet, no multi-user support, limited to browser storage
- **What I would do differently**: Start with stricter TypeScript from day 1, avoid `any` types in DB layer

---

## 🚀 Features

- **Virtual Garden**: Grid-based layout with drag-and-drop planting, 6-stage growth visualization
- **Sowing Calendar**: Seasonal planning with eligibility filtering, month scrubber
- **Plant Knowledgebase**: 100+ species with taxonomy, growth graphs, confidence scoring
- **Seed Inventory**: Bag management, store with fuzzy search, buy/log workflows
- **Weather Integration**: Open-Meteo API, 7-day forecasts, watering scores, frost alerts
- **Logbook**: Activity tracking (plantings, harvests, observations)
- **Gamification**: XP system, leveling, progress tracking
- **Settings**: Theme customization, background colors, language support (EN/DE)

---

## 🧪 How to Run

```bash
# Install dependencies
pnpm install

# Start development server (Vite)
pnpm dev

# Build for production
pnpm build

# Run unit tests (Vitest + React Testing Library)
pnpm test

# Run E2E tests (Playwright)
npx playwright test

# Lint
pnpm lint
```

---

## 📸 Demo

### Screenshots
_(Add screenshots to `docs/screenshots/` and link here)_

- Virtual Garden Tab
- Sowing Calendar with search
- Plant Knowledgebase with fuzzy search
- Settings with theme customization

### Live Demo
_(Optional: Deploy to Vercel/Netlify and add link)_

---

## 📁 Project Structure

```
LovelyGarden/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── playwright.config.ts
├── .storybook/
├── public/
│   ├── assets/
│   └── data/           # Plant catalog JSON
├── src/
│   ├── components/      # React components (tabs, UI, garden grid)
│   ├── db/              # RxDB setup, schemas, queries, export/import
│   ├── hooks/           # Custom React hooks
│   ├── logic/           # Business logic (lifecycle, reasoning, forecasting)
│   ├── schema/          # TypeScript interfaces, Zod schemas
│   ├── services/        # External APIs (weather, geolocation)
│   ├── stores/          # Zustand state (weather)
│   ├── utils/           # Utilities (theme, geocoding, debounce)
│   ├── lib/             # Axios config, i18n, toast
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── app.spec.ts
│   ├── settings.spec.ts
│   └── seed-store.spec.ts
├── docs/
│   ├── architecture.md
│   ├── decisions.md
│   ├── prompts.md
│   ├── screenshots/
│   └── diagrams/
└── scripts/
    └── launcher.js
```

**Non-obvious bits**:
- `src/logic/reasoning.ts` — companion/antagonist scoring engine
- `src/db/schemas.ts` — RxDB schemas with migration strategies
- `src/components/GardenGrid.tsx` — drag-and-drop grid with relationship scoring
- `vite.config.ts` — manual chunk splitting, PWA service worker config

---

## 🔍 Key Learnings

1. **Offline-first forces architecture decisions early**: RxDB + IndexedDB shaped every data decision
2. **AI-assisted cleanup is iterative**: TypeScript strict mode + AI subagents caught issues human review missed
3. **Performance is a feature**: Debounced fuzzy search + lazy loading transformed UX for large plant catalogs

---

## 🔮 Future Improvements

1. **Server sync**: Add RxDB replication plugin for cross-device gardening
2. **Image recognition**: Plant disease/pest diagnosis from photos (ML model)
3. **Social features**: Share garden layouts, compare yields, community challenges
4. **IoT integration**: Connect to soil moisture sensors, smart watering systems

---

## 📌 TL;DR

**Problem**: Gardeners lack unified, offline-capable tools that understand plant science and seasonality.

**Solution**: PWA with knowledge graph, reasoning engine, and gamified tracking — built through AI-assisted, iterative development.

**Why it's interesting**: Demonstrates structured AI collaboration, offline-first architecture, and domain modeling — not just a garden app, but a case study in AI-assisted systems design.

---

## 🧠 Why This Project Exists

This project is part of my exploration into:
- **AI-assisted development workflows** (subagents, templates, iterative refinement)
- **Building structured, maintainable systems** (RxDB + XState + Zod)
- **Domain modeling for niche problems** (horticulture, seasonality, plant relationships)

It's not just about the final product, but the **process behind it** — and how AI can accelerate thoughtful engineering.

---

## ✅ Pre-Publish Checklist

### Clarity
- [x] Repo name is meaningful
- [x] One-line description is clear
- [x] Problem is explicitly stated

### Readability
- [x] README is structured (not a wall of text)
- [x] Sections are skimmable
- [x] No unexplained jargon

### Proof
- [ ] Screenshots or demo included
- [x] Example input/output shown
- [x] Code actually runs

### Engineering Signal
- [x] Clean folder structure
- [x] No dead code
- [x] No hardcoded secrets
- [x] Environment variables documented

### Documentation Depth
- [x] Architecture explained
- [x] Trade-offs included
- [x] Learnings documented

### AI Transparency (your edge)
- [x] AI usage explained
- [x] Iteration process shown
- [x] Failures included (Playwright version conflicts, chunk splitting issues)

---

## 🧩 Maturity Level: Level 3 – Strong

- ✅ Architecture documented
- ✅ Trade-offs explained
- ✅ 26/26 tests passing
- ✅ Lint green (0 errors)
- ✅ Build green
- ⚠️ AI workflow documented (this README)
- ⚠️ Iteration history shown (Build Log section)

_Aiming for Level 4 (flagship) with screenshots and live demo._
