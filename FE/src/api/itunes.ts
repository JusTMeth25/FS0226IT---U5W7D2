/**
 * Ricerca delle anteprime da 30 secondi sulla iTunes Search API di Apple.
 * Niente chiave, CORS aperto: il browser la chiama direttamente.
 * https://performance-partners.apple.com/search-api
 */

export type Paese = 'IT' | 'US'

export interface Traccia {
  brano: string
  artista: string
  album: string
  anteprimaUrl: string
  /** Pagina del brano su Apple Music. */
  link: string
  /** Miniatura 100x100 per le liste. */
  copertina: string | null
  /** Copertina 600x600, adatta come copertina del disco. */
  copertinaGrande: string | null
}

interface RisultatoItunes {
  wrapperType?: string
  kind?: string
  artistId?: number
  collectionId?: number
  trackName?: string
  artistName?: string
  collectionName?: string
  previewUrl?: string
  trackViewUrl?: string
  artworkUrl100?: string
  trackNumber?: number
  discNumber?: number
}

type Canzone = RisultatoItunes & Required<Pick<RisultatoItunes, 'trackName' | 'previewUrl' | 'trackViewUrl'>>

const normalizza = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const cache = new Map<string, Promise<Canzone[]>>()

const canzoni = (lista: RisultatoItunes[] = []) =>
  lista.filter((r): r is Canzone => r.kind === 'song' && !!r.previewUrl && !!r.trackName && !!r.trackViewUrl)

async function chiedi(percorso: 'search' | 'lookup', parametri: Record<string, string>): Promise<RisultatoItunes[]> {
  const url = new URL(`https://itunes.apple.com/${percorso}`)
  url.search = new URLSearchParams(parametri).toString()
  try {
    const r = await fetch(url)
    return r.ok ? (((await r.json()) as { results?: RisultatoItunes[] }).results ?? []) : []
  } catch {
    return []
  }
}

/**
 * La ricerca libera di iTunes ordina per popolarita': "Miguel All I Want Is You"
 * restituisce U2 e Bieber prima di Miguel. Qui si parte dall'artista:
 * artista -> suoi album -> album col titolo cercato -> tracce in ordine di scaletta.
 */
function cercaNellaDiscografia(artista: string, titolo: string, paese: Paese): Promise<Canzone[]> {
  const chiave = `disco|${paese}|${artista}|${titolo}`
  const hit = cache.get(chiave)
  if (hit) return hit
  const p = (async () => {
    const art = normalizza(artista)
    const alb = normalizza(titolo)
    if (!art || !alb) return []
    const artisti = await chiedi('search', { term: artista, entity: 'musicArtist', limit: '5', country: paese })
    const trovato = artisti.find((a) => normalizza(a.artistName ?? '') === art) ?? artisti[0]
    if (!trovato?.artistId) return []
    const album = (await chiedi('lookup', { id: String(trovato.artistId), entity: 'album', limit: '200', country: paese }))
      .filter((r) => r.wrapperType === 'collection' && r.collectionId)
      .filter((r) => normalizza(r.collectionName ?? '').startsWith(alb))
      .slice(0, 2)
    const tracce = await Promise.all(
      album.map((a) => chiedi('lookup', { id: String(a.collectionId), entity: 'song', country: paese })),
    )
    return tracce.flatMap((t) =>
      canzoni(t).sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0)),
    )
  })()
  cache.set(chiave, p)
  return p
}

function cerca(termine: string, paese: Paese): Promise<Canzone[]> {
  const chiave = `${paese}|${termine}`
  const hit = cache.get(chiave)
  if (hit) return hit
  const p = chiedi('search', { term: termine, entity: 'song', media: 'music', limit: '40', country: paese }).then(canzoni)
  cache.set(chiave, p)
  return p
}

function inTraccia(r: Canzone): Traccia {
  const mini = r.artworkUrl100 ?? null
  return {
    brano: r.trackName,
    artista: r.artistName ?? '',
    album: r.collectionName ?? '',
    anteprimaUrl: r.previewUrl,
    link: r.trackViewUrl,
    copertina: mini,
    copertinaGrande: mini ? mini.replace(/\/\d+x\d+bb\./, '/600x600bb.') : null,
  }
}

/** Stesso brano in edizioni diverse: si tiene solo il primo. */
function senzaDoppioni(lista: Canzone[]): Canzone[] {
  const viste = new Set<string>()
  return lista.filter((r) => {
    const nome = normalizza(`${r.artistName} ${r.trackName}`)
    if (viste.has(nome)) return false
    viste.add(nome)
    return true
  })
}

/**
 * Tracce di un disco: prima quelle dell'album cercato (in ordine di scaletta),
 * poi le altre dello stesso artista. Usata dalla pagina del disco senza anteprima.
 */
export async function cercaTracce(artista: string, titolo: string, paese: Paese = 'IT'): Promise<Traccia[]> {
  const risultati = await cerca(`${artista} ${titolo}`, paese)
  const art = normalizza(artista)
  const alb = normalizza(titolo)
  const dellArtista = risultati.filter((r) => {
    const a = normalizza(r.artistName ?? '')
    return a.includes(art) || art.includes(a)
  })
  const dellAlbum = dellArtista
    .filter((r) => normalizza(r.collectionName ?? '').startsWith(alb))
    .sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
  const altre = dellArtista.filter((r) => !dellAlbum.includes(r))
  // album non trovato dalla ricerca libera: si passa dalla discografia dell'artista
  const primaDellAlbum = dellAlbum.length ? dellAlbum : await cercaNellaDiscografia(artista, titolo, paese)
  return senzaDoppioni([...primaDellAlbum, ...altre]).map(inTraccia)
}

/**
 * Ricerca libera (brano, artista, album) per il form della regia.
 * Se si conoscono artista e titolo del disco, le tracce di quell'album vengono prima.
 */
export async function cercaLibera(
  termine: string,
  paese: Paese,
  disco?: { artista: string; titolo: string },
): Promise<Traccia[]> {
  if (!termine.trim()) return []
  const [dalDisco, libere] = await Promise.all([
    disco ? cercaNellaDiscografia(disco.artista, disco.titolo, paese) : Promise.resolve([]),
    cerca(termine.trim(), paese),
  ])
  return senzaDoppioni([...dalDisco, ...libere]).map(inTraccia)
}
