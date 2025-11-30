# Celestial Spark 🌟

A beautiful cosmic adventure - a space exploration and stargazing game where players ignite new worlds and civilizations.

![Celestial Spark](https://img.shields.io/badge/Game-Space%20Exploration-blue)
![Tech Stack](https://img.shields.io/badge/Tech-Babylon.js%20%7C%20Pixi.js%20%7C%20Vite-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎮 Play Now

Visit the live game at: [GitHub Pages URL after deployment]

## 🚀 Features

- **Procedurally Generated Solar System**: Explore a unique star system with multiple planets, each with their own characteristics
- **Planet Ignition System**: Ignite dormant planets to bring life and civilization to the cosmos
- **3D Space Exploration**: Navigate through space using intuitive camera controls
- **Beautiful Visuals**: Stunning graphics powered by Babylon.js with Pixi.js UI overlay
- **Dynamic Lighting**: Realistic sun with corona effects and planet atmospheres
- **Particle Effects**: Spectacular ignition effects when activating new worlds
- **Progress Tracking**: Track your discoveries and ignited worlds

## 🎯 How to Play

1. **Explore**: Use your mouse to rotate and zoom around the solar system
2. **Discover**: Click on planets to learn about them
3. **Ignite**: Press `SPACE` to ignite selected planets and bring them to life
4. **Complete**: Ignite all planets to complete your cosmic mission

### Controls

| Key/Action | Function |
|------------|----------|
| Left-click + drag | Rotate camera |
| Right-click + drag | Pan camera |
| Scroll wheel | Zoom in/out |
| Click on planet | Select planet |
| `SPACE` | Ignite selected planet |
| `1-5` | Quick select planets |
| `R` | Reset camera view |
| `H` | Toggle help panel |

## 🛠️ Technology Stack

- **[Babylon.js](https://www.babylonjs.com/)** - Powerful 3D engine for WebGL rendering
- **[Pixi.js](https://pixijs.com/)** - Fast 2D rendering for UI elements
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

## 🏗️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/bansal-saurabh/celestial-spark.git
cd celestial-spark

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
celestial-spark/
├── public/
│   ├── favicon.svg
│   ├── textures/
│   └── models/
├── src/
│   ├── game/
│   │   ├── Game.ts           # Main game engine
│   │   ├── GameState.ts      # Game state management
│   │   ├── StarField.ts      # Background star field
│   │   ├── CelestialBody.ts  # Base celestial body class
│   │   └── ProceduralPlanet.ts # Procedural planet generation
│   ├── ui/
│   │   └── UIOverlay.ts      # Pixi.js UI overlay
│   ├── main.ts               # Application entry point
│   └── style.css             # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Assets

This project uses:
- Procedurally generated textures for planets and celestial bodies
- Custom particle effects for sun corona and ignition animations
- SVG graphics for UI elements

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA and ESA for inspiration and public domain space imagery references
- Babylon.js community for the excellent 3D engine
- Pixi.js team for the fast 2D rendering library

---

Made with ❤️ for the cosmos

