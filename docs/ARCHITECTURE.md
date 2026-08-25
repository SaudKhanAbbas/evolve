# Architecture

## Module Layout

```
src/
├── main.ts           Entry point: canvas boot, render loop
├── style.css         Global dark deep-sea theme
├── core/
│   └── config.ts     Central tunable constants (world, palette, later: sim params)
├── sim/              Simulation engine (Phase 1): genetics, entities, world state
├── render/
│   └── renderer.ts   Canvas 2D drawing (currently: backdrop only)
└── utils/
    └── math.ts       Shared math helpers (clamp, lerp)
```

Planned as the project grows:

- `sim/` — `genome.ts`, `rng.ts`, `world.ts`, `entity.ts`, spatial hash grid
- `render/` — creature drawing, camera, particles; stays behind the `Renderer` interface so a
  PixiJS/WebGL backend can replace Canvas 2D without touching simulation code
- `ui/` — HUD, inspector panel, charts (DOM overlay, not canvas-drawn)

## Core Principles

### Fixed-timestep simulation, decoupled rendering

The simulation advances in fixed ticks (target ~30 tps); rendering runs on
`requestAnimationFrame`. A speed multiplier runs N ticks per frame rather than scaling delta
time. This keeps physics/genetics stable and deterministic at any speed.

### Determinism

All randomness flows through one seeded RNG (mulberry32). Same seed → same world history.
Simulation state never reads wall-clock time or user input directly.

### Simulation/render separation

`sim` knows nothing about the DOM or canvas. `render` reads sim state and draws it. `ui` reads
sim state for panels/charts. This boundary is enforced by convention and keeps the engine
headless-testable (Vitest in Phase 1).

## Rendering Strategy

Canvas 2D with device-pixel-ratio-aware sizing. Expected load (≤1k creatures + ≤2k food) is well
within Canvas 2D's comfort zone. Neighbor queries use a spatial hash grid to keep collision/sense
checks near O(1) per entity. If visuals demand shader effects (bloom) or entity counts grow past
~2–3k, the renderer interface allows migrating to PixiJS without engine changes.

## Performance Budgets

- 60 fps with 1,000 creatures and 2,000 food items on mid-range hardware
- Sim tick budget: < 8 ms per tick at full load
- No per-frame allocations in hot paths (object pooling where needed)
