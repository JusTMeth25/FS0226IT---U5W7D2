/**
 * Ricerca delle anteprime da 30 secondi sulla iTunes Search API di Apple.
 * Niente chiave, CORS aperto: il browser la chiama direttamente.
 * https://performance-partners.apple.com/search-api
 */

export interface Traccia {
  brano: string
  artista: string
  album: string
  anteprimaUrl: string
  /** Pagina del brano su Apple Music. */
  link: string
  copertina: string | null
}

interface RisultatoItunes {
  kind?: string
  trackName?: string
  artistName?: string
  collectionName?: string
  previewUrl?: string
  trackViewUrl?: string
  artworkUrl100?: string
  trackNumber?: number
  discNumber?: number
}

const normalizza = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const cache = new Map<string, Promise<Traccia[]>>()

/**
 * Restituisce le tracce trovate, prima quelle dell'album cercato
 * (in ordine di scaletta), poi le altre dello stesso artista.
 */
export function cercaTracce(artista: string, titolo: string): Promise<Traccia[]> {
  const chiave = `${artista}|${titolo}`
  const hit = cache.get(chiave)
  if (hit) return hit

  const url = new URL('https://itunes.apple.com/search')
  url.search = new URLSearchParams({
    term: `${artista} ${titolo}`,
    entity: 'song',
    media: 'music',
    limit: '40',
    country: 'IT',
  }).toString()

  const p = fetch(url)
    .then((r) => (r.ok ? r.json() : { results: [] }))
    .then((j: { results?: RisultatoItunes[] }) => {
      const art = normalizza(artista)
      const alb = normalizza(titolo)
      const valide = (j.results ?? []).filter(
        (r): r is Required<RisultatoItunes> =>
          r.kind === 'song' && !!r.previewUrl && !!r.trackName && !!r.trackViewUrl,
      )
      const dellArtista = valide.filter((r) => normalizza(r.artistName ?? '').includes(art) || art.includes(normalizza(r.artistName ?? '')))
      const dellAlbum = dellArtista
        .filter((r) => normalizza(r.collectionName ?? '').startsWith(alb))
        .sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
      const altre = dellArtista.filter((r) => !dellAlbum.includes(r))

      // stesso brano in edizioni diverse: si tiene solo il primo
      const viste = new Set<string>()
      return [...dellAlbum, ...altre]
        .filter((r) => {
          const nome = normalizza(r.trackName)
          if (viste.has(nome)) return false
          viste.add(nome)
          return true
        })
        .map<Traccia>((r) => ({
          brano: r.trackName,
          artista: r.artistName,
          album: r.collectionName,
          anteprimaUrl: r.previewUrl,
          link: r.trackViewUrl,
          copertina: r.artworkUrl100 ?? null,
        }))
    })
    .catch(() => [] as Traccia[])

  cache.set(chiave, p)
  return p
}
