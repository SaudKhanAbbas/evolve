import type { Creature } from '../sim/creature'
import { GENE_LIMITS } from '../sim/genome'
import type { GeneKey } from '../sim/genome'
import { creatureCapacity } from '../sim/world'
import { drawOrganism } from '../render/creatureArtist'

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

interface ViewRefs {
  title: HTMLElement
  portrait: HTMLCanvasElement | null
  generation: HTMLElement
  age: HTMLElement
  offspring: HTMLElement
  energyText: HTMLElement
  energyFill: HTMLElement
  traitValues: Map<GeneKey, HTMLElement>
  traitFills: Map<GeneKey, HTMLElement>
  swatch: HTMLElement
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  )
}

export class Inspector {
  private readonly root: HTMLElement
  private currentId: number | null = null
  private refs: ViewRefs | null = null

  constructor(root: HTMLElement) {
    this.root = root
    this.showPlaceholder()
  }

  showPlaceholder(): void {
    this.currentId = null
    this.refs = null
    this.root.innerHTML = `
      <h2>INSPECTOR</h2>
      <div class="placeholder">Click a cell in the simulation to inspect its genome, energy, and lineage stats.</div>
    `
  }

  show(creature: Creature): void {
    if (this.currentId !== creature.id || !this.refs) {
      this.buildView(creature)
    }
    this.updateView(creature)
  }

  hide(): void {
    this.showPlaceholder()
  }

  private buildView(creature: Creature): void {
    const g = creature.genome
    const traitMarkup = TRAIT_ROWS.map(({ key, label }) => {
      return `<div class="trait"><div class="trait-head"><span>${label}</span><span class="trait-value" data-trait="${key}">—</span></div><div class="bar"><div class="fill" data-trait-fill="${key}" style="width:0%"></div></div></div>`
    }).join('')

    this.root.innerHTML = `
      <div class="cell-view">
        <h2 id="inspector-title">CELL #${creature.id}</h2>
        <canvas id="ref-portrait" class="portrait" aria-label="Selected organism preview"></canvas>
        <div class="stat-row"><span>GENERATION</span><span class="value" id="ref-generation">—</span></div>
        <div class="stat-row"><span>AGE</span><span class="value" id="ref-age">—</span></div>
        <div class="stat-row"><span>OFFSPRING</span><span class="value" id="ref-offspring">—</span></div>
        <div class="trait">
          <div class="trait-head"><span>ENERGY</span><span class="trait-value" id="ref-energy">—</span></div>
          <div class="bar energy"><div class="fill" id="ref-energy-fill" style="width:0%"></div></div>
        </div>
        ${traitMarkup}
        <div class="swatch-row">
          <span>HUE</span>
          <span class="hue-swatch" id="ref-swatch"></span>
          <span class="value" id="ref-hue-value">—</span>
        </div>
      </div>
    `

    const traitValues = new Map<GeneKey, HTMLElement>()
    const traitFills = new Map<GeneKey, HTMLElement>()
    for (const { key } of TRAIT_ROWS) {
      const valueEl = this.root.querySelector<HTMLElement>(`[data-trait="${key}"]`)
      const fillEl = this.root.querySelector<HTMLElement>(`[data-trait-fill="${key}"]`)
      if (valueEl) traitValues.set(key, valueEl)
      if (fillEl) traitFills.set(key, fillEl)
    }

    this.refs = {
      title: this.root.querySelector('#inspector-title') as HTMLElement,
      portrait: this.root.querySelector('#ref-portrait'),
      generation: this.root.querySelector('#ref-generation') as HTMLElement,
      age: this.root.querySelector('#ref-age') as HTMLElement,
      offspring: this.root.querySelector('#ref-offspring') as HTMLElement,
      energyText: this.root.querySelector('#ref-energy') as HTMLElement,
      energyFill: this.root.querySelector('#ref-energy-fill') as HTMLElement,
      traitValues,
      traitFills,
      swatch: this.root.querySelector('#ref-swatch') as HTMLElement,
    }
    this.currentId = creature.id

    const hueText = this.root.querySelector('#ref-hue-value')
    if (hueText) hueText.textContent = `${Math.round(g.hue)}°`
    if (this.refs.swatch) {
      const color = `hsl(${g.hue}, 85%, 60%)`
      this.refs.swatch.style.background = color
      this.refs.swatch.style.color = color
    }
  }

  private updateView(creature: Creature): void {
    const refs = this.refs
    if (!refs) return
    const g = creature.genome
    const capacity = creatureCapacity(g)
    const energyPct = Math.max(0, Math.min(100, (creature.energy / capacity) * 100))

    refs.title.textContent = `CELL #${creature.id}`
    refs.generation.textContent = String(creature.generation)
    refs.age.textContent = `${creature.age.toFixed(1)} s`
    refs.offspring.textContent = String(creature.offspringCount)
    refs.energyText.textContent = `${creature.energy.toFixed(0)} / ${capacity.toFixed(0)}`
    refs.energyFill.style.width = `${energyPct.toFixed(1)}%`

    for (const { key, format } of TRAIT_ROWS) {
      const valueEl = refs.traitValues.get(key)
      const fillEl = refs.traitFills.get(key)
      if (!valueEl || !fillEl) continue
      const display = format ? format(g[key]) : g[key].toFixed(2)
      if (valueEl.textContent !== escapeHtml(display)) {
        valueEl.textContent = display
      }
      const { min, max } = GENE_LIMITS[key]
      fillEl.style.width = `${(((g[key] - min) / (max - min)) * 100).toFixed(1)}%`
    }
  }

  renderPortrait(creature: Creature, timeSec: number): void {
    const canvas = this.refs?.portrait
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.clientWidth || 200
    const cssH = canvas.clientHeight || 120
    const targetW = Math.floor(cssW * dpr)
    const targetH = Math.floor(cssH * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#02070f'
    ctx.fillRect(0, 0, cssW, cssH)

    const g = creature.genome
    const radius = 3 + g.size * 2.5
    const scale = (Math.min(cssW, cssH) * 0.34) / radius

    const glow = ctx.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, cssH * 0.62)
    glow.addColorStop(0, `hsla(${g.hue}, 80%, 40%, 0.22)`)
    glow.addColorStop(1, 'rgba(2, 7, 15, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, cssW, cssH)

    ctx.save()
    ctx.translate(cssW / 2, cssH / 2 + Math.sin(timeSec * 1.3) * 2.5)
    ctx.scale(scale, scale)
    drawOrganism(ctx, creature, timeSec, 'high', 0, 0, -0.18 + Math.sin(timeSec * 0.6) * 0.08)
    ctx.restore()
  }
}
