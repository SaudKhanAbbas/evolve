# Project Overview

## Vision

A browser-based artificial-life simulator that makes evolution visible. A population of simple,
beautifully rendered organisms carries digital genomes; mutation and survival pressure do the
rest. The user is an observer — part scientist, part god — who can zoom from population-level
trends down to a single organism's DNA, and can intervene with environmental events to steer the
course of evolution.

This is a portfolio project: the priorities are visual polish, technically interesting simulation
mechanics, and clean engineering — not academic rigor or feature maximalism.

## Pillars

1. **Visual quality first** — bioluminescent deep-sea aesthetic; every gene has visible phenotypic
   expression.
2. **Real emergence** — no scripted outcomes; selection arises from energy economics and ecology.
3. **Determinism** — seeded RNG and fixed timestep make every run reproducible and shareable.
4. **Performance** — hundreds of creatures at 60fps on ordinary hardware.

## MVP Scope (target: 3–4 days)

- Simulation engine: genomes, mutation, energy, eating, reproduction, death, plant regrowth
- Procedural cell/organism rendering reacting to velocity, camera pan/zoom/follow
- Inspector panel, play/pause/speed controls, live population chart, vision-radius overlay
- Seeded runs with reset

Explicitly out of MVP scope: phylogeny view, seasons/zones, neural-network brains, sexual
reproduction, sound, touch support.

## Roadmap

| Phase | Deliverable                                                        | Status      |
| ----- | ------------------------------------------------------------------ | ----------- |
| 0     | Scaffold, tooling, docs                                            | ✅ Complete |
| 1     | Sim engine (genetics, energy, lifecycle, spatial grid) + tests     | ✅ Complete |
| 2     | Rendering: procedural creatures, camera, animation                 | Planned     |
| 3     | Interaction: inspector, controls, charts, overlays                 | Planned     |
| 4     | Depth: predation tuning, speciation, environment zones             | Planned     |
| 5     | Polish: particles, glow, scenarios, shareable seeds                | Planned     |
| 6     | Stretch: neural-net brains, sexual reproduction, paintable terrain | Maybe       |

## Non-Goals

- Scientific fidelity to real biology — plausibility over accuracy
- Multiplayer, accounts, or backend services of any kind
- Mobile-first design (desktop browser is the target)
