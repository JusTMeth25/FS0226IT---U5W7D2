import * as THREE from 'three'

/** Palette per le etichette generate quando manca la copertina. */
const ETICHETTE = ['#ff5b1f', '#ffb347', '#e8d5b0', '#7bd88f', '#6ea8ff', '#d96cff']

function hash(testo: string): number {
  let h = 0
  for (let i = 0; i < testo.length; i++) h = (h * 31 + testo.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function coloreDa(testo: string): string {
  return ETICHETTE[hash(testo) % ETICHETTE.length]
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D non disponibile')
  return [c, ctx]
}

function finalizza(c: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

// ---------- Solchi ----------

let grooveCache: THREE.CanvasTexture | null = null

/** Texture della faccia del disco: solchi concentrici con le pause fra le tracce. */
export function grooveTexture(): THREE.CanvasTexture {
  if (grooveCache) return grooveCache
  const size = 1024
  const [c, ctx] = canvas(size)
  const cx = size / 2
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, size, size)

  const pause = [0.62, 0.71, 0.8, 0.9]
  for (let r = cx * 0.36; r < cx * 0.985; r += 1.35) {
    const t = r / cx
    const vicinoPausa = pause.some((p) => Math.abs(t - p) < 0.008)
    const luce = vicinoPausa ? 6 : 16 + Math.random() * 16
    ctx.strokeStyle = `rgb(${luce},${luce},${luce})`
    ctx.lineWidth = vicinoPausa ? 1.4 : 0.7
    ctx.beginPath()
    ctx.arc(cx, cx, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  // bordo esterno lucido
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.992, 0, Math.PI * 2)
  ctx.stroke()

  grooveCache = finalizza(c)
  return grooveCache
}

// ---------- Etichetta centrale ----------

function scriviAdArco(
  ctx: CanvasRenderingContext2D,
  testo: string,
  cx: number,
  raggio: number,
  inizio: number,
) {
  const lettere = testo.split('')
  const passo = 0.075
  let angolo = inizio - (lettere.length * passo) / 2
  for (const l of lettere) {
    ctx.save()
    ctx.translate(cx + Math.cos(angolo) * raggio, cx + Math.sin(angolo) * raggio)
    ctx.rotate(angolo + Math.PI / 2)
    ctx.fillText(l, 0, 0)
    ctx.restore()
    angolo += passo
  }
}

function etichettaBase(
  ctx: CanvasRenderingContext2D,
  size: number,
  titolo: string,
  artista: string,
  immagine?: HTMLImageElement,
) {
  const cx = size / 2
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cx, cx, 0, Math.PI * 2)
  ctx.clip()

  if (immagine) {
    ctx.drawImage(immagine, 0, 0, size, size)
    // velatura per leggere il testo sul bordo
    const g = ctx.createRadialGradient(cx, cx, cx * 0.55, cx, cx, cx)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  } else {
    ctx.fillStyle = coloreDa(titolo + artista)
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(12,10,9,0.9)'
    ctx.font = `600 ${size * 0.085}px Fraunces, Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(titolo.length > 18 ? titolo.slice(0, 17) + '…' : titolo, cx, cx - size * 0.16)
    ctx.font = `500 ${size * 0.05}px Manrope, sans-serif`
    ctx.fillText(artista.toUpperCase(), cx, cx + size * 0.17)
  }

  ctx.fillStyle = immagine ? 'rgba(255,245,230,0.9)' : 'rgba(12,10,9,0.75)'
  ctx.font = `500 ${size * 0.034}px "JetBrains Mono", monospace`
  ctx.textAlign = 'center'
  scriviAdArco(ctx, 'SOLCO · 33⅓ RPM · STEREO', cx, cx * 0.86, -Math.PI / 2)

  ctx.restore()

  // anello e foro centrale
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = size * 0.01
  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.97, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#0c0a09'
  ctx.beginPath()
  ctx.arc(cx, cx, size * 0.035, 0, Math.PI * 2)
  ctx.fill()
}

// ---------- Copertina quadrata (busta) ----------

function bustaBase(
  ctx: CanvasRenderingContext2D,
  size: number,
  titolo: string,
  artista: string,
  immagine?: HTMLImageElement,
) {
  if (immagine) {
    ctx.drawImage(immagine, 0, 0, size, size)
    return
  }
  const col = coloreDa(titolo + artista)
  const g = ctx.createLinearGradient(0, 0, size, size)
  g.addColorStop(0, col)
  g.addColorStop(1, '#1a1411')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(255,245,230,0.18)'
  for (let r = size * 0.1; r < size * 0.9; r += size * 0.045) {
    ctx.beginPath()
    ctx.arc(size * 0.72, size * 0.3, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#f2e8d5'
  ctx.textAlign = 'left'
  ctx.font = `700 ${size * 0.1}px Fraunces, Georgia, serif`
  ctx.fillText(titolo.length > 16 ? titolo.slice(0, 15) + '…' : titolo, size * 0.07, size * 0.82)
  ctx.font = `500 ${size * 0.045}px Manrope, sans-serif`
  ctx.fillText(artista.toUpperCase(), size * 0.07, size * 0.9)
}

// ---------- Caricamento con cache ----------

type Tipo = 'etichetta' | 'busta'
const cache = new Map<string, Promise<THREE.CanvasTexture>>()

function caricaImmagine(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function genera(tipo: Tipo, titolo: string, artista: string, img?: HTMLImageElement) {
  const size = tipo === 'etichetta' ? 512 : 1024
  const [c, ctx] = canvas(size)
  if (tipo === 'etichetta') etichettaBase(ctx, size, titolo, artista, img)
  else bustaBase(ctx, size, titolo, artista, img)
  return finalizza(c)
}

/** Texture generata subito, senza rete: serve come segnaposto e come ripiego. */
export function textureSegnaposto(tipo: Tipo, titolo: string, artista: string) {
  return genera(tipo, titolo, artista)
}

/**
 * Carica la copertina e la disegna su canvas (etichetta rotonda o busta quadrata).
 * Se l'immagine non arriva (CORS, 404, rete) si ripiega su una grafica generata.
 */
export function textureCopertina(
  tipo: Tipo,
  url: string | null,
  titolo: string,
  artista: string,
): Promise<THREE.CanvasTexture> {
  const chiave = `${tipo}|${url ?? ''}|${titolo}|${artista}`
  const hit = cache.get(chiave)
  if (hit) return hit
  const p = (url ? caricaImmagine(url) : Promise.reject(new Error('senza copertina')))
    .then((img) => genera(tipo, titolo, artista, img))
    .catch(() => genera(tipo, titolo, artista))
  cache.set(chiave, p)
  return p
}
