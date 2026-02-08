# Raida's Garden 🌿

**Raida's Garden** is an offline-first, local-first horticultural grimoire and gardening management application. It combines the structured data of a botanical encyclopedia with the intuitive mechanics of a card game to help you plan, plant, and maintain a thriving garden.

Built as a **Local-First PWA (Progressive Web App)** with a premium "Command Center" aesthetic.

![Version](https://img.shields.io/badge/version-0.3.0--alpha-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-blue)

---

## 🌟 Core Pillars

- **Offline-First**: 100% functional without an internet connection. All your data stays on your device.
- **Local-First Storage**: Powered by **RxDB** and **IndexedDB** for seamless, real-time data persistence.
- **Horticultural Integrity**: Every recommendation is backed by a knowledge base of **52+ botanical species** with transitive synergy tracking.
- **Premium Aesthetics**: 3D glassmorphism, intelligent animations, and realistic terrain textures.

---

## 🚀 Key Features

### 🎮 The Garden Grid
A 2D tactical field where you can drag and drop seeds from your "Bag" to plant them. Features:
- **Realistic Terrain**: Multi-layered CSS ground texture (dirt, grit, pebbles, vegetation)
- **3D Depth Effects**: Glassmorphism panels with perspective transforms
- **Intelligent Animations**: Plants pulse based on health status (healthy, stressed, pest-infested)

### 📊 The Command Center HUD
Real-time monitoring dashboard with:
- **Temporal Controls**: Advance or rewind the simulation clock
- **Grid Capacity**: Live tracking of planted vs. available slots
- **Intervention Console**: Quick-access watering, fertilizing, and remedy tools
- **Spectral Layers**: Toggle between visual, hydration, and blight overlays

### 🧠 The Logic Engine
- **Plant FSM**: XState-driven scientific lifecycle management (germination → seedling → mature → harvest)
- **Companion Logic**: Real-time evaluation of plant relationships and NPK bonuses
- **Temporal Scrubber**: See future growth by advancing the global clock
- **Season Detection**: Automatic "In Season" filtering for optimal planting times

### 🔍 Plant Inspector
Deep-dive into any plant to see:
- Growth progress and lifecycle stage
- Health status and stress indicators
- Companion plant relationships
- Horticultural integrity proofs

---

## 🛠️ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Database**: [RxDB 15](https://rxdb.info/) with [Dexie.js](https://dexie.org/)
- **State Machines**: [XState](https://stately.ai/docs/xstate) (Plant Lifecycles)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS utilities
- **Interactions**: [@dnd-kit](https://dnd-kit.com/) (Drag & Drop)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Playwright](https://playwright.dev/)

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shahriarhaqueabir/RaidasGarden.git
   cd RaidasGarden
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

To create a PWA-ready production build:
```bash
npm run build
npm run preview  # Preview the build locally
```

---

## 🎨 Visual Enhancements (v0.3.0)

### 3D Glassmorphism
- Premium translucent panels with backdrop blur
- Depth effects using CSS perspective transforms
- Subtle shimmer animations on interactive elements

### Intelligent Plant Animations
- **Healthy Plants**: Slow green pulse (stress < 20%, hydration > 70%)
- **Stressed Plants**: Fast red pulse with scale jitter (stress > 70%)
- **Pest Infested**: Vertical hop animation with amber glow
- **Contagion Risk**: Red perimeter pulse on adjacent slots

### Realistic Terrain
Multi-layered CSS background simulating natural ground:
- Base dirt color with radial gradient grit
- Larger pits and dents for depth
- Small pebble spots for texture
- Sparse grass spikes for realism
- Fractal noise overlay (SVG filter)

---

## 📜 Documentation

- **[PROJECT_STATE.md](PROJECT_STATE.md)**: Current state, architecture, and roadmap
- **[CODE_REVIEW.md](CODE_REVIEW.md)**: Technical debt analysis and action plan
- **[Guidebook/](Guidebook/)**: Detailed technical specifications (private)

---

## 🧪 Testing

Run end-to-end tests:
```bash
npm run test
```

View test report:
```bash
npx playwright show-report
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Ensure TypeScript compiles without errors (`npm run build`)
- Run tests before submitting PR (`npm run test`)

---

## 📊 Project Status

### Current Version: 0.3.0-alpha
- ✅ Core gardening functionality
- ✅ Offline-first data persistence
- ✅ Plant lifecycle simulation
- ✅ Companion planting logic
- ✅ Premium visual design
- ⚠️ Accessibility improvements needed
- ⚠️ Test coverage expansion needed

### Roadmap
- **v0.4.0**: Accessibility compliance, component refactoring
- **v0.5.0**: Performance optimization, lazy loading
- **v0.6.0**: Mobile responsiveness, PWA features
- **v1.0.0**: Production-ready release

---

## ⚖️ License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

This project leverages incredible open-source tools:
- **RxDB** for reactive local-first data
- **XState** for state machine clarity
- **Tailwind CSS** for rapid styling
- **Vite** for blazing-fast dev experience

---

**Built with 🌱 by the Raida's Garden Team**  
**Last Updated**: 2026-02-08
