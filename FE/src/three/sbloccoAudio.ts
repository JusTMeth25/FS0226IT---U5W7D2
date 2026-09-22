/**
 * I browser dei telefoni (Safari su iPhone in particolare) fanno suonare un AudioContext
 * solo se viene ripreso dentro il gesto dell'utente, non in un timer o in un effetto successivo.
 * Queste funzioni vanno chiamate direttamente nel gestore del tocco/click.
 */

interface AudioSession {
  type: string
}

/**
 * Su iPhone il Web Audio rispetta l'interruttore silenzioso laterale.
 * Con la sessione "playback" (Safari 17+) suona come un lettore musicale.
 */
export function sessioneRiproduzione() {
  const sessione = (navigator as Navigator & { audioSession?: AudioSession }).audioSession
  if (sessione && sessione.type !== 'playback') {
    try {
      sessione.type = 'playback'
    } catch {
      /* browser che non lo permette: nessun effetto */
    }
  }
}

/** Riprende il contesto e fa passare un campione muto: da qui in poi il contesto e' sbloccato. */
export function sbloccaContesto(ctx: AudioContext) {
  sessioneRiproduzione()
  void ctx.resume()
  const muto = ctx.createBuffer(1, 1, ctx.sampleRate)
  const sorgente = ctx.createBufferSource()
  sorgente.buffer = muto
  sorgente.connect(ctx.destination)
  sorgente.start(0)
}
