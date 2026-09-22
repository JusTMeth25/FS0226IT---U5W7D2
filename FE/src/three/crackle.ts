/**
 * Fruscio del vinile sintetizzato con Web Audio: rumore rosa filtrato
 * piu' qualche "pop" casuale. Nessun file audio da scaricare.
 */
export class Crackle {
  private ctx: AudioContext | null = null
  private sorgente: AudioBufferSourceNode | null = null
  private volume: GainNode | null = null
  private livello = 0.6

  private creaBuffer(ctx: AudioContext): AudioBuffer {
    const durata = 4
    const buffer = ctx.createBuffer(1, ctx.sampleRate * durata, ctx.sampleRate)
    const dati = buffer.getChannelData(0)
    let b0 = 0
    let b1 = 0
    let b2 = 0
    for (let i = 0; i < dati.length; i++) {
      const bianco = Math.random() * 2 - 1
      // rumore rosa (filtro di Paul Kellet, versione ridotta)
      b0 = 0.99765 * b0 + bianco * 0.099046
      b1 = 0.963 * b1 + bianco * 0.2965164
      b2 = 0.57 * b2 + bianco * 1.0526913
      let campione = (b0 + b1 + b2 + bianco * 0.1848) * 0.018
      // pop: rari impulsi che decadono in fretta
      if (Math.random() < 0.00018) {
        const ampiezza = 0.25 + Math.random() * 0.5
        const lunghezza = 40 + Math.floor(Math.random() * 120)
        for (let j = 0; j < lunghezza && i + j < dati.length; j++) {
          dati[i + j] += (Math.random() * 2 - 1) * ampiezza * Math.exp(-j / 18)
        }
      }
      // giro del disco: leggerissima pulsazione a 33 giri
      campione *= 0.85 + 0.15 * Math.sin((i / ctx.sampleRate) * Math.PI * 2 * 0.555)
      dati[i] += campione
    }
    return buffer
  }

  /** Volume del fruscio: si abbassa quando sotto c'e' la musica. */
  setLivello(livello: number) {
    this.livello = livello
    if (!this.ctx || !this.volume || !this.sorgente) return
    this.volume.gain.cancelScheduledValues(this.ctx.currentTime)
    this.volume.gain.setValueAtTime(this.volume.gain.value, this.ctx.currentTime)
    this.volume.gain.linearRampToValueAtTime(livello, this.ctx.currentTime + 0.6)
  }

  start() {
    if (this.sorgente) return
    this.ctx ??= new AudioContext()
    void this.ctx.resume()
    const filtro = this.ctx.createBiquadFilter()
    filtro.type = 'bandpass'
    filtro.frequency.value = 2400
    filtro.Q.value = 0.4
    this.volume = this.ctx.createGain()
    this.volume.gain.value = 0
    this.volume.gain.linearRampToValueAtTime(this.livello, this.ctx.currentTime + 0.8)
    this.sorgente = this.ctx.createBufferSource()
    this.sorgente.buffer = this.creaBuffer(this.ctx)
    this.sorgente.loop = true
    this.sorgente.connect(filtro).connect(this.volume).connect(this.ctx.destination)
    this.sorgente.start()
  }

  stop() {
    if (!this.ctx || !this.sorgente || !this.volume) return
    const s = this.sorgente
    this.volume.gain.cancelScheduledValues(this.ctx.currentTime)
    this.volume.gain.setValueAtTime(this.volume.gain.value, this.ctx.currentTime)
    this.volume.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5)
    window.setTimeout(() => s.stop(), 600)
    this.sorgente = null
  }

  dispose() {
    this.stop()
    window.setTimeout(() => void this.ctx?.close(), 700)
  }
}
