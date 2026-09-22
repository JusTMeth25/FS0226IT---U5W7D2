/**
 * Motore audio del giradischi.
 *
 * L'anteprima viene decodificata in un AudioBuffer e letta da un AudioWorklet
 * a velocita' variabile, anche negativa: e' questo che permette lo scratch.
 * Come su un vinile vero, velocita' e intonazione vanno insieme
 * (45 giri = piu' veloce e piu' acuto, freno = "tape stop", indietro = suono al contrario).
 */
export const VELOCITA_45 = 45 / (100 / 3)

// Scorrimento morbido verso la velocita' obiettivo, per campione (48 kHz circa).
const MOTORE = 0.00012 // avvio del piatto: circa mezzo secondo
const FRENO = 0.00007 // arresto: il suono scende di tono fino a fermarsi
const MANO = 0.004 // la mano sul disco: risposta quasi immediata
const RIPRESA = 0.0009 // mano lasciata: il motore riprende in fretta

const WORKLET = /* js */ `
class Giradischi extends AudioWorkletProcessor {
  constructor() {
    super()
    this.canali = null
    this.len = 0
    this.pos = 0
    this.rate = 0
    this.target = 0
    this.lisciatura = 0.001
    this.scala = 1
    this.fine = false
    this.blocchi = 0
    this.port.onmessage = (e) => {
      const m = e.data
      if (m.tipo === 'buffer') {
        this.canali = m.canali
        this.len = m.canali[0].length
        this.scala = m.sampleRate / sampleRate
        this.pos = 0
        this.rate = 0
        this.target = 0
        this.fine = false
      } else if (m.tipo === 'velocita') {
        this.target = m.valore
        this.lisciatura = m.lisciatura
        if (m.immediata) this.rate = m.valore
      } else if (m.tipo === 'posizione') {
        this.pos = m.valore * this.len
        this.fine = false
      }
    }
  }

  process(_ingressi, uscite) {
    const out = uscite[0]
    const n = out[0].length
    if (!this.canali) return true
    const s = this.canali[0]
    const d = this.canali[1] || s
    const ultimo = this.len - 1
    for (let i = 0; i < n; i++) {
      this.rate += (this.target - this.rate) * this.lisciatura
      this.pos += this.rate * this.scala
      if (this.pos < 0) this.pos = 0
      if (this.pos >= ultimo) {
        this.pos = ultimo
        if (!this.fine && this.rate > 0) {
          this.fine = true
          this.port.postMessage({ tipo: 'fine' })
        }
        out[0][i] = 0
        if (out[1]) out[1][i] = 0
        continue
      }
      this.fine = false
      const i0 = this.pos | 0
      const f = this.pos - i0
      out[0][i] = s[i0] + (s[i0 + 1] - s[i0]) * f
      if (out[1]) out[1][i] = d[i0] + (d[i0 + 1] - d[i0]) * f
    }
    if (++this.blocchi % 8 === 0) {
      this.port.postMessage({ tipo: 'stato', pos: this.pos / this.len, rate: this.rate })
    }
    return true
  }
}
registerProcessor('giradischi', Giradischi)
`

const buffers = new Map<string, Promise<AudioBuffer>>()

export class AnteprimaAudio {
  private ctx: AudioContext | null = null
  private nodo: AudioWorkletNode | null = null
  private volume: GainNode | null = null
  private taglio: GainNode | null = null
  private pronto: Promise<void> | null = null
  private urlCaricato: string | null = null
  private inRiproduzione = false
  private scratchAttivo = false
  private base = 1
  private rate = 0
  private pos = 0
  private timerBackspin = 0

  onProgresso: ((frazione: number) => void) | null = null
  onFine: (() => void) | null = null
  onErrore: ((url: string) => void) | null = null

  /** Velocita' attuale letta dal worklet (1 = 33⅓ giri). null se non c'e' audio caricato. */
  get velocitaAttuale(): number | null {
    if (!this.urlCaricato) return null
    // disco fermo e nessuna mano: decide il piatto (per esempio mentre il braccio scende)
    if (!this.inRiproduzione && !this.scratchAttivo && Math.abs(this.rate) < 0.01) return null
    return this.rate
  }

  get caricato() {
    return this.urlCaricato !== null
  }

  set velocitaBase(v: number) {
    this.base = v
    if (this.inRiproduzione && !this.scratchAttivo) this.invia(v, MOTORE)
  }

  private avvia(): Promise<void> {
    if (this.pronto) return this.pronto
    const ctx = new AudioContext()
    this.ctx = ctx
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' }))
    this.pronto = ctx.audioWorklet.addModule(url).then(() => {
      URL.revokeObjectURL(url)
      const nodo = new AudioWorkletNode(ctx, 'giradischi', { outputChannelCount: [2] })
      const volume = ctx.createGain()
      const taglio = ctx.createGain()
      volume.gain.value = 0
      nodo.connect(taglio).connect(volume).connect(ctx.destination)
      nodo.port.onmessage = (e: MessageEvent) => {
        const m = e.data as { tipo: string; pos?: number; rate?: number }
        if (m.tipo === 'stato') {
          this.rate = m.rate ?? 0
          this.pos = m.pos ?? 0
          this.onProgresso?.(this.pos)
        } else if (m.tipo === 'fine') {
          this.onProgresso?.(1)
          this.onFine?.()
        }
      }
      this.nodo = nodo
      this.volume = volume
      this.taglio = taglio
    })
    return this.pronto
  }

  /** Scarica e decodifica l'anteprima. Si puo' chiamare prima del click: il contesto resta sospeso. */
  async carica(url: string) {
    if (this.urlCaricato === url) return
    await this.avvia()
    const ctx = this.ctx!
    let p = buffers.get(url)
    if (!p) {
      p = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.arrayBuffer()
        })
        .then((dati) => ctx.decodeAudioData(dati))
      buffers.set(url, p)
    }
    try {
      const buffer = await p
      const canali = Array.from({ length: Math.min(2, buffer.numberOfChannels) }, (_, i) =>
        buffer.getChannelData(i).slice(),
      )
      this.nodo!.port.postMessage(
        { tipo: 'buffer', canali, sampleRate: buffer.sampleRate },
        canali.map((c) => c.buffer),
      )
      this.urlCaricato = url
      this.rate = 0
      this.pos = 0
      this.onProgresso?.(0)
    } catch {
      buffers.delete(url)
      this.urlCaricato = null
      this.onErrore?.(url)
    }
  }

  async suona() {
    if (!this.urlCaricato || !this.ctx) return
    await this.ctx.resume()
    // anteprima finita: si riparte dall'inizio, come rimettere la puntina sul primo solco
    if (this.pos > 0.995) this.riavvolgi()
    this.inRiproduzione = true
    this.dissolvi(0.9, 0.9)
    if (!this.scratchAttivo) this.invia(this.base, MOTORE)
  }

  /** Il motore si spegne: il disco rallenta e il suono scende di tono. */
  ferma() {
    this.inRiproduzione = false
    window.clearTimeout(this.timerBackspin)
    if (!this.scratchAttivo) this.invia(0, FRENO)
    this.dissolvi(0, 1.4)
  }

  riavvolgi() {
    this.nodo?.port.postMessage({ tipo: 'posizione', valore: 0 })
    this.pos = 0
    this.onProgresso?.(0)
  }

  // ---------- scratch ----------

  /** Velocita' imposta dalla mano: 1 = avanti a 33⅓, negativa = indietro, 0 = disco fermo. */
  scratch(velocita: number) {
    if (!this.urlCaricato || !this.ctx) return
    if (!this.scratchAttivo) {
      this.scratchAttivo = true
      window.clearTimeout(this.timerBackspin)
      void this.ctx.resume()
      this.dissolvi(0.9, 0.04)
    }
    this.invia(Math.max(-8, Math.min(8, velocita)), MANO)
  }

  fineScratch() {
    if (!this.scratchAttivo) return
    this.scratchAttivo = false
    if (this.inRiproduzione) {
      this.invia(this.base, RIPRESA)
    } else {
      this.invia(0, MANO)
      this.dissolvi(0, 0.3)
    }
  }

  /** Il DJ lancia il disco all'indietro, poi il motore lo riprende. */
  backspin() {
    if (!this.inRiproduzione || this.scratchAttivo) return
    this.invia(-4.5, 0.00006, true)
    window.clearTimeout(this.timerBackspin)
    this.timerBackspin = window.setTimeout(() => {
      if (this.inRiproduzione && !this.scratchAttivo) this.invia(this.base, RIPRESA)
    }, 1300)
  }

  /** Crossfader chiuso: il suono sparisce finche' si tiene premuto. */
  taglia(chiuso: boolean) {
    if (!this.taglio || !this.ctx) return
    const g = this.taglio.gain
    g.cancelScheduledValues(this.ctx.currentTime)
    g.setTargetAtTime(chiuso ? 0 : 1, this.ctx.currentTime, 0.004)
  }

  dispose() {
    window.clearTimeout(this.timerBackspin)
    this.onProgresso = this.onFine = this.onErrore = null
    void this.ctx?.close()
    this.ctx = null
  }

  private invia(valore: number, lisciatura: number, immediata = false) {
    this.nodo?.port.postMessage({ tipo: 'velocita', valore, lisciatura, immediata })
  }

  private dissolvi(verso: number, secondi: number) {
    if (!this.volume || !this.ctx) return
    const g = this.volume.gain
    const ora = this.ctx.currentTime
    g.cancelScheduledValues(ora)
    g.setValueAtTime(g.value, ora)
    g.linearRampToValueAtTime(verso, ora + secondi)
  }
}
