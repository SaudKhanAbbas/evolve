# Architecture

## Module Layout

```
src/
├── main.ts               Entry point: boot, fixed-timestep loop, wiring
├── style.css             Deep-sea theme + HUD/controls/inspector styling
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
│   ├── events.ts         SimEvent/SimObserver types (birth/death notifications)
│   ├── simulation.ts     Simulation class: orchestrates one deterministic tick
│   └── *.test.ts         Unit + headless stability tests (Vitest)
├── render/               Canvas 2D presentation layer (reads sim, never writes it)
│   ├── camera.ts         Pan/zoom camera: fit scaling, cursor anchoring, world clamping
│   ├── renderer.ts       Backdrop, trails, food, boundary, selection highlight
│   ├── creatureArtist.ts Procedural genome-driven organism drawing
│   ├── effects.ts        Render-only birth ring / death puff particles
│   ├── series.ts         Bounded numeric sample buffer
│   └── sparkline.ts      Tiny custom canvas chart for HUD graphs
└── ui/                   DOM overlay (reads sim state, never mutates it)
    ├── input.ts          Pointer/wheel handling mapped onto the camera + picking
    ├── controls.ts       Play/pause + speed buttons (Space toggles pause)
    ├── hud.ts            Stats text, sampling cadence, sparkline updates
    ├── inspector.ts      Selected-cell genome panel
    └── selection.ts      Currently selected creature id

Plus `src/utils/math.ts` (clamp, lerp, distSq, TAU) shared by sim and render.
```

## Rendering Pipeline

Each frame (`requestAnimationFrame`): advance 0..N fixed sim steps through an accumulator scaled
by playback speed → update render-side effects with wall dt → `Renderer.draw` paints backdrop,
applies `Camera.applyTransform` (world→screen), draws food, organisms (procedural artist), effect
particles, then the selection highlight. A per-frame trail-fade fill gives motion smear; it is
replaced by a full backdrop repaint whenever the camera moved, preventing ghosting during pans.

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
accumulator. Playback speed multiplies accumulated time so 10x runs 10 ticks per sim-second of
wall clock while every step stays a fixed `1/30s` — determinism is unaffected.

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

Implemented through Day 2: full deterministic engine (genetics, mutation, energy lifecycle,
steering behavior, reproduction, regrowth, spatial indexing), pan/zoom camera, procedural
genome-driven organism rendering, birth/death effect particles, playback controls (pause +
0.25x–10x), click-to-inspect cell panel with live genome bars, and an HUD with population/trait
sparklines. 77 passing tests including long-run stability and seed determinism.

Next up (Day 3): environmental god events (food burst, drought, meteor), shareable-seed polish,
trait-distribution overlays, deployment, final documentation pass.
