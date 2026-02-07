# Garden Deck 🌿

**Garden Deck** is an offline-first, local-first horticultural grimoire and gardening management application. It combines the structured data of a botanical encyclopedia with the intuitive mechanics of a card game to help you plan, plant, and maintain a thriving garden.

![Garden Deck Banner](public/logo.svg) <!-- Note: Add a logo later if needed -->

## 🌟 Core Pillars

- **Offline-First**: 100% functional without an internet connection. All your data stays on your device.
- **Local-First Storage**: Powered by **RxDB** and **IndexedDB** for seamless, real-time data persistence.
- **Horticultural Integrity**: Every recommendation is backed by authoritative sources (RHS, UC Davis, etc.) with transparent confidence scores.
- **Card-Game Metaphor**: Manage your garden as a deck of seeds and a grid of possibilities.

## 🚀 Key Features

- **The Garden Grid**: A 2D field where you can drag and drop seeds from your "Hand" to plant them.
- **The Logic Engine**: 
  - **Plant FSM**: Scientific lifecycle management from seed to harvest.
  - **Companion Logic**: Real-time evaluation of plant relationships and bonuses.
  - **Seasonal Awareness**: Adaptive sowing windows based on your hemisphere and current date.
- **Plant Inspector**: Deep-dive into any plant to see its growth progress, health status, and the "why" behind its recommendations.
- **Seed Vault**: Acquire new species and expand your botanical knowledge.

## 🛠️ Technology Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Database**: [RxDB](https://rxdb.info/) with [Dexie.js](https://dexie.org/)
- **State Management**: [XState](https://stately.ai/docs/xstate) (Plant Lifecycles)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Interactions**: [@dnd-kit](https://dnd-kit.com/) (Drag & Drop)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/raidas-garden.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

To create a PWA-ready production build:
```bash
npm run build
npm run preview
```

## 📜 Documentation

- [Technical Specification](Guidebook/TECHNICAL_SPEC.md): Deep dive into the architecture and schemas.
- [Data Governance](Guidebook/DATA_GOVERNANCE.md): Principles of horticultural truth and explainability.
- [User Guide](Guidebook/USER_GUIDE.md): Instructions for the modern gardener.
- [Roadmap](Guidebook/ROADMAP.md): Historical context of the build phases.

## ⚖️ License

MIT License - See [LICENSE](LICENSE) for details. (Placeholder)
