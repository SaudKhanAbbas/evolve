export interface Playback {
  paused: boolean
  speed: number
}

export function createControls(root: HTMLElement, playback: Playback): void {
  const toggle = root.querySelector<HTMLButtonElement>('#play-pause')
  if (!toggle) {
    throw new Error('EVOLVE: play-pause button missing')
  }
  const speedButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.speed'))
  if (speedButtons.length === 0) {
    throw new Error('EVOLVE: speed buttons missing')
  }

  const refreshSpeedButtons = (): void => {
    for (const button of speedButtons) {
      button.classList.toggle('active', Number(button.dataset.speed) === playback.speed)
    }
  }

  const setPaused = (paused: boolean): void => {
    playback.paused = paused
    toggle.textContent = paused ? 'PLAY' : 'PAUSE'
  }

  toggle.addEventListener('click', () => setPaused(!playback.paused))

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.code === 'Space' && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault()
      setPaused(!playback.paused)
    }
  })

  for (const button of speedButtons) {
    button.addEventListener('click', () => {
      const speed = Number(button.dataset.speed)
      if (Number.isFinite(speed) && speed > 0) {
        playback.speed = speed
        refreshSpeedButtons()
      }
    })
  }

  refreshSpeedButtons()
}
