# Architecture

## Module Layout

```
src/
├── main.ts               Entry point: canvas boot, fixed-timestep loop, HUD text
├── style.css             Global dark deep-sea theme + HUD styling
├── core/
│   └── config.ts         Visual palette (backdrop colors)
├── sim/                  Headless simulation engine — zero DOM/canvas imports
│   ├── config.ts         All tunable simulation constants
│   ├── rng.ts            Seeded mulberry32 RNG (gauss, range, int, angle)
│   ├── genome.ts         Genome traits, bounds, cloning, bounded mutation
│   ├── creature.ts       Creature entity + factory
│   ├── food.ts           Food entity, factory, carrying-capacity regrowth
│   ├── world.ts          World state container + initial world generation
│   ├── spatialHash.ts    Generic uniform-grid spatial index
│   ├── energy.ts         Metabolism/movement costs, food sensing & eating
│   ├── behavior.ts       Gene-driven steering (wander / seek / flee) + motion integration
│   ├── reproduction.ts   Maturity/energy gating, offspring creation
│   ├── simulation.ts     Simulation class: orchestrates one deterministic tick
│   └── *.test.ts         Unit + headless stability tests (Vitest)
├── render/
│   └── renderer.ts       Canvas 2D drawing: backdrop, food, glowing creatures, trails
└── utils/
    └── math.ts           clamp, lerp, distSq, TAU
```

## Deterministic Tick Order

Each `Simulation.step()` advances exactly `1/30s` and runs systems in a fixed order:

1. Increment tick/time; rebuild the food spatial hash
2. For each living creature (array order): sense → steer → integrate motion → pay energy costs → eat
3. Reproduction pass over the same array (births appended after iteration)
4. Food regrowth toward carrying capacity (fractional accumulator)
5. Remove dead creatures and consumed food

Births/deaths are batched after iteration so update order is stable and reproducible.

## Core Principles

### Fixed-timestep simulation, decoupled rendering

The simulation advances in fixed ticks (30 tps); rendering runs on `requestAnimationFrame` with an
accumulator. A speed multiplier will run N ticks per frame rather than scaling delta time.

### Determinism

All randomness flows through one seeded RNG (`mulberry32`). Same seed → identical world history
(verified by tests that compare full serialized state after thousands of ticks). Simulation state
never reads wall-clock time or user input.

### Simulation/render separation

`sim/` knows nothing about the DOM or canvas and runs headless in Node via Vitest. `render` reads
sim state and draws it. This boundary keeps the engine testable and allows a future PixiJS/WebGL
backend without touching simulation code.

## Spatial Indexing

A uniform grid (`SpatialHash`, cell size 64px) is rebuilt from the food array each tick.
Creature sense/eat queries use `queryInto` with a reusable scratch buffer to avoid per-query
allocations. The hash stores `(x, y, item)` entries so queries are radius-filtered internally;
insertion-order iteration keeps results deterministic. Creature-creature interactions (predation)
will reuse the same structure.

## Performance Budgets

- 60 fps with ~900 creatures and ~600 food items (current caps) at 30 tps
- Spatial hash keeps neighbor queries near O(1) per entity instead of O(n·m)
- Glow rendering degrades gracefully above 400 creatures (shadowBlur disabled)

## Current Status

Implemented through Day 1: full engine (genetics, mutation, energy lifecycle, steering behavior,
reproduction, regrowth, spatial indexing), 54 passing tests including long-run stability and
seed determinism, plus a basic browser view. Camera, inspector, charts, and god tools are next.
