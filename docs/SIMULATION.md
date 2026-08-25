# Simulation Design

Status legend: **[implemented]** — live in the engine · **[designed]** — specified, not yet built.

## Genome

Each organism carries a fixed set of floating-point genes. Genes mutate independently.
**[implemented]**

| Gene          | Range    | Expression                                                 |
| ------------- | -------- | ---------------------------------------------------------- |
| `size`        | 0.5 – 3  | Body radius (`3 + size·2.5 px`); energy capacity `80·size` |
| `maxSpeed`    | 0.5 – 3  | Speed ceiling `maxSpeed · 45 px/s`                         |
| `senseRadius` | 20 – 200 | Food sensing distance (px)                                 |
| `metabolism`  | 0.5 – 2  | Baseline burn multiplier                                   |
| `diet`        | -1 … +1  | Herbivore (-1) ↔ carnivore (+1)                            |
| `aggression`  | 0 – 1    | Reserved for predation behavior                            |
| `maturityAge` | 5 – 30 s | Minimum age before reproduction                            |
| `hue`         | 0 – 360  | Bioluminescent color                                       |

Initial populations spawn in mid-range bands so evolution has room in every direction.

**Mutation [implemented]:** each gene mutates with probability 0.12, perturbed by gaussian noise
(σ = 6% of the gene's range), clamped to bounds. No mutation explosions observed in long runs.

## Energy Economy **[implemented]**

Everything runs on energy:

- Capacity: `80 × size`; newborns start at 70%
- Metabolism: `1.4 × metabolism × √size` J/s
- Movement: `0.0009 × speed_px² × size × metabolism` J/s (speed² makes sprinting expensive)
- Plants: worth 30 energy; digested at efficiency `clamp(1 − 0.75·max(0, diet), 0.25, 1)` — a
  deliberate placeholder until predation exists, keeping carnivore-leaning genes costly for now
- Energy ≤ 0 → death by starvation; dead creatures are removed the same tick

## Reproduction & Selection **[implemented]**

- Requirements: age ≥ `maturityAge`, energy ≥ 75% of capacity, cooldown expired (3 s)
- Asexual split: child receives 50% of (parent energy − birth cost 10), parent keeps the rest
- Child genome = mutated clone of parent; generation = parent + 1; spawns near the parent
- Hard cap 900 creatures exists purely as a performance guard (equilibrium sits below it)
- No fitness function anywhere; selection emerges from scarcity and competition

Observed dynamics (seed 42): population grows from 140 to ~850 over ~26 simulated minutes while
food is grazed down to ~5% standing stock — strong, stable selection pressure without collapse.

## Behavior **[implemented]**

Gene-parameterized steering, no neural networks:

1. **Seek** — nearest food within `senseRadius`: turn toward it (4 rad/s), full speed
2. **Flee** — threat nearby (reserved for predation): turn away at double turn rate
3. **Wander** — no targets: heading random-walks (gaussian σ ≈ 0.22 rad/tick), cruise 55% speed

Motion is kinematic (velocity from heading/speed) with wall reflections in the bounded arena.

## World Model **[implemented]**

- Walled arena 1600×1200, 30 ticks/second fixed timestep
- Plants regrow logistically: spawn rate ∝ deficit fraction of capacity (600), max 60/s,
  accumulated fractionally per tick for smooth deterministic growth
- Spatial hash (64px cells) rebuilt each tick indexes food for sense/eat queries

## Planned Depth **[designed]**

- Predation: carnivores gain energy from prey (activates `diet`, `aggression`, flee behavior)
- Speciation via genetic-distance clustering; phylogeny view
- Environment zones/events shifting regrowth and hazards
- Optional neural-net brains replacing gene-parameterized steering
