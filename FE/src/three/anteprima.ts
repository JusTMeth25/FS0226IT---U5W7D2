/**
 * Riproduce l'anteprima di 30 secondi come su un giradischi:
 * entra e esce in dissolvenza, e a 45 giri suona piu' veloce e piu' acuta.
 */
export const VELOCITA_45 = 45 / (100 / 3)

export class AnteprimaAudio {
  private audio = new Audio()
  private fade = 0
  private volumeMax = 0.85

  onProgresso: ((frazione: number) => void) | null = null
  onFine: (() => void) | null = null
  onErrore: (() => void) | null = null

  constructor() {
    this.audio.preload = 'none'
    this.audio.volume = 0
    // effetto vinile: cambiando velocita' cambia anche l'intonazione
    this.audio.preservesPitch = false
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.duration) this.onProgresso?.(this.audio.currentTime / this.audio.duration)
    })
    this.audio.addEventListener('ended', () => {
      this.onProgresso?.(1)
      this.onFine?.()
    })
    this.audio.addEventListener('error', () => this.onErrore?.())
  }

  get url() {
    return this.audio.src
  }

  carica(url: string) {
    if (this.audio.src === url) return
    this.ferma(0)
    this.audio.src = url
    this.audio.currentTime = 0
    this.onProgresso?.(0)
  }

  set velocita(v: number) {
    // defaultPlaybackRate sopravvive al cambio di src, playbackRate no
    this.audio.defaultPlaybackRate = v
    this.audio.playbackRate = v
  }

  async suona() {
    if (this.audio.ended) this.audio.currentTime = 0
    try {
      await this.audio.play()
      this.dissolvi(this.volumeMax, 900)
    } catch {
      this.onErrore?.()
    }
  }

  /** Abbassa il volume e mette in pausa: la puntina si alza ma il punto resta. */
  ferma(durata = 500) {
    this.dissolvi(0, durata, () => this.audio.pause())
  }

  riavvolgi() {
    this.audio.currentTime = 0
    this.onProgresso?.(0)
  }

  dispose() {
    cancelAnimationFrame(this.fade)
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    this.onProgresso = this.onFine = this.onErrore = null
  }

  private dissolvi(verso: number, durata: number, poi?: () => void) {
    cancelAnimationFrame(this.fade)
    const da = this.audio.volume
    if (durata <= 0) {
      this.audio.volume = verso
      poi?.()
      return
    }
    const inizio = performance.now()
    const passo = (ora: number) => {
      const t = Math.min(1, (ora - inizio) / durata)
      this.audio.volume = da + (verso - da) * t
      if (t < 1) this.fade = requestAnimationFrame(passo)
      else poi?.()
    }
    this.fade = requestAnimationFrame(passo)
  }
}
