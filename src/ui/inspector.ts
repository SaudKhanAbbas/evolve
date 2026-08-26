import type { Creature } from '../sim/creature'
import { GENE_LIMITS } from '../sim/genome'
import type { GeneKey } from '../sim/genome'
import { creatureCapacity } from '../sim/world'

interface TraitRow {
  key: GeneKey
  label: string
  format?: (value: number) => string
}

const TRAIT_ROWS: TraitRow[] = [
  { key: 'size', label: 'SIZE' },
  { key: 'maxSpeed', label: 'SPEED' },
  {
    key: 'senseRadius',
    label: 'SENSE',
    format: (v) => `${Math.round(v)} px`,
  },
  { key: 'metabolism', label: 'METAB' },
  {
    key: 'diet',
    label: 'DIET',
    format: (v) => (v < -0.15 ? 'HERBIVORE' : v > 0.15 ? 'CARNIVORE' : 'OMNIVORE'),
  },
  { key: 'aggression', label: 'AGGRESSION' },
  {
    key: 'maturityAge',
    label: 'MATURITY',
    format: (v) => `${v.toFixed(1)} s`,
  },
]

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  )
}

export class Inspector {
  private readonly root: HTMLElement

  constructor(root: HTMLElement) {
    this.root = root
  }

  show(creature: Creature): void {
    const g = creature.genome
    const capacity = creatureCapacity(g)
    const energyPct = Math.max(0, Math.min(100, (creature.energy / capacity) * 100))
    const dietLabel = g.diet < -0.15 ? 'herbivore' : g.diet > 0.15 ? 'carnivore' : 'omnivore'

    const traitRows = TRAIT_ROWS.map(({ key, label, format }) => {
      const { min, max } = GENE_LIMITS[key]
      const pct = ((g[key] - min) / (max - min)) * 100
      const display = format ? format(g[key]) : g[key].toFixed(2)
      return `<div class="trait"><div class="trait-head"><span>${label}</span><span>${escapeHtml(display)}</span></div><div class="bar"><div class="fill" style="width:${pct.toFixed(1)}%"></div></div></div>`
    }).join('')

    this.root.innerHTML = `
      <h2>CELL #${creature.id}</h2>
      <div class="stat-row"><span>GENERATION</span><span>${creature.generation}</span></div>
      <div class="stat-row"><span>AGE</span><span>${creature.age.toFixed(1)} s</span></div>
      <div class="stat-row"><span>OFFSPRING</span><span>${creature.offspringCount}</span></div>
      <div class="trait">
        <div class="trait-head"><span>ENERGY</span><span>${creature.energy.toFixed(0)} / ${capacity.toFixed(0)}</span></div>
        <div class="bar energy"><div class="fill" style="width:${energyPct.toFixed(1)}%"></div></div>
      </div>
      <div class="diet-note">diet bias: ${dietLabel}</div>
      ${traitRows}
      <div class="swatch-row"><span>HUE</span><span class="hue-swatch" style="background:hsl(${g.hue}, 85%, 60%)"></span><span>${Math.round(g.hue)}°</span></div>
    `
    this.root.hidden = false
  }

  hide(): void {
    this.root.hidden = true
    this.root.innerHTML = ''
  }
}
