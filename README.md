# Garden Deck 🌿

**Garden Deck** is an offline-first, local-first horticultural grimoire and gardening management application. It combines the structured data of a botanical encyclopedia with the intuitive mechanics of a card game to help you plan, plant, and maintain a thriving garden.

Garden Deck is a **Local-First Web Application** built as a **PWA (Progressive Web App)**.

![Garden Deck Banner](public/logo.svg) <!-- Note: Add a logo later if needed -->

## 🌟 Core Pillars

- **Offline-First**: 100% functional without an internet connection. All your data stays on your device.
- **Local-First Storage**: Powered by **RxDB** and **IndexedDB** for seamless, real-time data persistence.
- **Horticultural Integrity**: Every recommendation is backed by a knowledge base of **52+ botanical species** with transitive synergy tracking.
- **Garden Deck Aesthetic**: A high-density "Command Center" / grimoire transformation for tactical gardening.

## 🚀 Key Features

- **The Garden Grid**: A 2D field where you can drag and drop seeds from your "Hand" to plant them.
- **The Command Center HUD**: Real-time monitoring of Sun, Moisture, and Temperature with temporal simulation controls.

- **The Logic Engine**:
  - **Plant FSM**: XState-driven scientific lifecycle management.
  - **Companion Logic**: Real-time evaluation of plant relationships and NPK bonuses.
  - **Temporal Scrubber**: Advance or rewind the global simulation clock to see future growth.
- **Plant Inspector**: Deep-dive into any plant to see its growth progress, health status, and "Horticultural Integrity" proofs.

## 🛠️ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Database**: [RxDB 15](https://rxdb.info/) with [Dexie.js](https://dexie.org/)
- **State Machines**: [XState](https://stately.ai/docs/xstate) (Plant Lifecycles)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom botanical palette)
- **Interacts**: [@dnd-kit](https://dnd-kit.com/) (Drag & Drop)
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
npm run deploy
```

## 🤝 Contributing

- [Technical Specification](Guidebook/TECHNICAL_SPEC.md): Deep dive into the architecture and schemas.
- [Data Governance](Guidebook/DATA_GOVERNANCE.md): Principles of horticultural truth and explainability.
- [User Guide](Guidebook/USER_GUIDE.md): Instructions for the modern gardener.
- [Roadmap](Guidebook/ROADMAP.md): Historical context of the build phases.

## 📜 Documentation

- [Technical Specification](Guidebook/TECHNICAL_SPEC.md): Deep dive into the architecture and schemas.
- [Data Governance](Guidebook/DATA_GOVERNANCE.md): Principles of horticultural truth and explainability.
- [User Guide](Guidebook/USER_GUIDE.md): Instructions for the modern gardener.
- [Roadmap](Guidebook/ROADMAP.md): Historical context of the build phases.

## ⚖️ License

MIT License - See [LICENSE](LICENSE) for details. (Placeholder)
