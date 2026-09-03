# EVOLVE

An interactive artificial-life simulator where a population of organisms mutates, reproduces, competes for resources, and evolves over time.

There are no scripted outcomes or predefined winners. Every run develops from the same underlying rules: energy, movement, food, reproduction, inheritance, and mutation.

Built with TypeScript and Canvas 2D.

## Live Demo

**[Launch EVOLVE](https://evolve-beryl.vercel.app/)**

## What You Can Do

- Watch a living population evolve across generations
- Pause the simulation or run it from `0.25×` to `10×`
- Pan around the world and smoothly zoom in on individual organisms
- Click an organism to inspect its genome, energy, age, generation, traits, and offspring
- Run deterministic simulations with a custom seed using `?seed=1234`
- Watch population and trait trends update in real time

## Simulation

Each organism has a genome that influences its behaviour and appearance.

The simulation includes:

- Seeded deterministic randomness
- Bounded genome mutation
- Energy consumption and metabolism
- Food seeking and grazing
- Starvation and death
- Energy-gated reproduction
- Mutated inheritance
- Generation tracking
- Logistic food regrowth
- Spatial hashing for efficient food queries
- A population safety cap of 900 organisms

There is no hardcoded fitness score. Traits survive or disappear based on how they interact with the environment.

The simulation engine is completely separate from the browser and rendering code, making it headless, testable, and deterministic.

## Visuals and Interaction

EVOLVE uses Canvas 2D to render a living microscopic ecosystem.

### Organisms

Organisms are procedurally generated from their genomes, with visual differences including:

- Body proportions and morphology
- Membrane variation
- Tails and fins
- Internal organelles
- Direction and movement
- Bioluminescent colour
- Energy-dependent brightness

The renderer also includes motion interpolation, squash and stretch, turn lean, wakes, bloom effects, and adaptive levels of detail.

### Environment

The ecosystem includes:

- Layered bioluminescent atmosphere
- Parallax marine snow
- Ambient current effects
- Food shimmer
- Arena depth and boundary cues
- Camera-aware world-space effects

### Interaction

- Drag to pan
- Scroll to smoothly zoom
- Click an organism to inspect it
- Hover organisms for visual feedback
- Press `Space` to pause or resume
- Change simulation speed from `0.25×` to `10×`

## Performance

The renderer is designed to handle large populations efficiently.

Performance optimizations include:

- Uniform-grid spatial hashing
- Cached organism geometry
- Cached bloom sprites
- Adaptive levels of detail
- Dynamic quality control
- Bounded wake buffers
- Lightweight particle systems
- Interpolated rendering between fixed simulation ticks

The simulation itself runs at a deterministic fixed timestep of 30 ticks per second.

## Deterministic Runs

EVOLVE uses a seeded RNG rather than `Math.random()`.

The same seed and simulation conditions produce the same results.

You can run a specific simulation by adding a seed to the URL:

    ?seed=1234

This makes runs reproducible and allows the simulation engine to be tested independently from rendering.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Build | Vite |
| Rendering | Canvas 2D |
| UI | Vanilla TypeScript + DOM |
| Testing | Vitest |
| Linting | ESLint |
| Formatting | Prettier |
| Deployment | Vercel |

## Getting Started

Requires Node.js 20+.

    npm install
    npm run dev

Open the local URL shown by Vite.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm test` | Run the test suite |

## Project Structure

    src/
    ├── sim/        # Deterministic simulation engine
    ├── render/     # Canvas rendering and visual systems
    ├── ui/         # HUD, inspector, controls, and interaction
    ├── core/       # Shared configuration
    └── utils/      # Shared utilities

The simulation layer does not depend on the DOM or Canvas APIs.

Rendering reads simulation state but does not control simulation behaviour, helping keep the engine deterministic and independently testable.

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Simulation Design](docs/SIMULATION.md)
- [Development Guide](docs/DEVELOPMENT.md)

## License

MIT
