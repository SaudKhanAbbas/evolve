# Simulation Design

Status legend: **[designed]** — specified here, not yet implemented (Phase 1+).

## Genome

Each organism carries a fixed-length set of floating-point genes. Genes mutate independently.

| Gene          | Range    | Expression                                          |
| ------------- | -------- | --------------------------------------------------- |
| `size`        | 0.5 – 3  | Body radius; mass, energy capacity, food value      |
| `maxSpeed`    | 0.5 – 3  | Movement speed ceiling                              |
| `senseRadius` | 20 – 200 | Distance at which food/predators are perceived      |
| `metabolism`  | 0.5 – 2  | Baseline energy burn multiplier                     |
| `diet`        | -1 … +1  | Herbivore (-1) ↔ carnivore (+1); what it can digest |
| `aggression`  | 0 – 1    | Willingness to pursue prey vs. flee                 |
| `maturityAge` | 5 – 30 s | Minimum age before reproduction                     |
| `hue`         | 0 – 360  | Visual color (bioluminescent glow tint)             |

**[designed]** Mutation: each gene perturbed by gaussian noise (~10% of range) with small
probability; values clamped to range. Mutation rate/strength are world constants, tunable in UI.

## Energy Economy

Everything is energy. Nothing happens without it. **[designed]**

- Movement cost ∝ `size * speed² * metabolism`
- Baseline upkeep ∝ `metabolism * size` per second
- Eating plants yields energy scaled by plant size
- Eating prey yields energy proportional to prey biomass (carnivore diet required)
- Energy ≤ 0 → death; energy above threshold + mature age → reproduce (split)

## Reproduction & Selection **[designed]**

- Asexual splitting: parent pays a fixed energy cost, child spawns nearby with mutated genome
- Population cap via food carrying capacity — no hard-coded limits
- No fitness function anywhere; selection emerges from scarcity, predation, and environment

## World Model **[designed]**

- Fixed arena (1600×1200), toroidal or walled (decided in Phase 1)
- Plants regrow toward a carrying-capacity field; local depletion creates grazing pressure
- Spatial hash grid partitions the arena for sense/collision queries

## Planned Depth (Phase 4+) **[designed]**

- Speciation: organisms cluster by genetic distance; species tracked, colored, counted
- Environment zones/seasons shifting food density and hazards to drive niche specialization
- Optional neural-net brains replacing gene-parameterized steering behaviors
