# EVOLVE

An interactive evolution simulator for the browser. Watch a population of procedurally drawn,
bioluminescent organisms mutate, compete, and adapt over thousands of generations — driven purely
by natural selection, never by scripted outcomes.

> **Status:** Work in progress — Phase 0 (scaffolding) complete.

## Planned Features

- Living 2D ecosystem: creatures with genomes competing for food in a primordial-soup world
- Mutation-driven evolution with emergent selection pressure (no hardcoded fitness function)
- Real-time inspection: click any creature to read its genes, energy, lineage, and history
- Live data dashboard: population curves, average-trait trends, generation counters
- God tools: play/pause, speed control up to 100x, food bursts, droughts, extinction events
- Deterministic, seeded runs — share any simulation via URL
- Speciation tracking and a growing phylogenetic tree

## Tech Stack

| Layer      | Choice                                |
| ---------- | ------------------------------------- |
| Language   | TypeScript (strict mode)              |
| Build      | Vite                                  |
| Rendering  | Canvas 2D (PixiJS/WebGL upgrade path) |
| UI         | Vanilla TS DOM overlay                |
| Linting    | ESLint (typescript-eslint)            |
| Formatting | Prettier                              |
| Testing    | Vitest (from Phase 1)                 |
| Hosting    | GitHub Pages                          |

## Getting Started

Requires Node.js 20+.

```bash
npm install
npm run dev      # start dev server
```

### Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the Vite dev server            |
| `npm run build`        | Type-check and build for production  |
| `npm run preview`      | Preview the production build locally |
| `npm run lint`         | Run ESLint                           |
| `npm run format`       | Format all files with Prettier       |
| `npm run format:check` | Verify formatting without writing    |

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md) — vision, scope, roadmap
- [Architecture](docs/ARCHITECTURE.md) — module layout, loop, rendering strategy
- [Simulation Design](docs/SIMULATION.md) — genetics, energy economy, mechanics
- [Development Guide](docs/DEVELOPMENT.md) — setup, workflow, conventions

## License

MIT
