import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { api, ApiError } from '../api/client'
import { cercaLibera, type Paese, type Traccia } from '../api/itunes'
import type { DiscoAdmin, DiscoRequest } from '../api/types'
import Copertina from './Copertina'
import { formattaEuro, margine } from './format'

interface Props {
  iniziale?: DiscoAdmin
  onChiudi: () => void
  onSalvato: (d: DiscoAdmin) => void
}

interface Campi {
  titolo: string
  artista: string
  genere: string
  anno: string
  descrizione: string
  copertinaUrl: string
  prezzoVendita: string
  anteprimaUrl: string
  anteprimaBrano: string
  anteprimaLink: string
  prezzoAcquisto: string
  fornitore: string
  pubblicato: boolean
}

const daDisco = (d?: DiscoAdmin): Campi => ({
  titolo: d?.titolo ?? '',
  artista: d?.artista ?? '',
  genere: d?.genere ?? '',
  anno: d?.anno?.toString() ?? '',
  descrizione: d?.descrizione ?? '',
  copertinaUrl: d?.copertinaUrl ?? '',
  prezzoVendita: d?.prezzoVendita?.toString() ?? '',
  anteprimaUrl: d?.anteprimaUrl ?? '',
  anteprimaBrano: d?.anteprimaBrano ?? '',
  anteprimaLink: d?.anteprimaLink ?? '',
  prezzoAcquisto: d?.prezzoAcquisto?.toString() ?? '',
  fornitore: d?.fornitore ?? '',
  // un disco nuovo va in vetrina, a meno di spegnere l'interruttore
  pubblicato: d?.pubblicato ?? true,
})

const vuotoANull = (s: string) => (s.trim() === '' ? null : s.trim())
const numero = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

export default function DiscoForm({ iniziale, onChiudi, onSalvato }: Props) {
  const [c, setC] = useState<Campi>(() => daDisco(iniziale))
  const [errori, setErrori] = useState<Record<string, string>>({})
  const [messaggio, setMessaggio] = useState<string | null>(null)
  const [invio, setInvio] = useState(false)

  // ---------- ricerca anteprime su iTunes ----------
  const [risultati, setRisultati] = useState<Traccia[] | null>(null)
  const [cercando, setCercando] = useState(false)
  const [termine, setTermine] = useState<string | null>(null)
  const [paese, setPaese] = useState<Paese>('IT')
  // finche' non lo si modifica, il testo da cercare segue artista e titolo
  const testoRicerca = termine ?? `${c.artista} ${c.titolo}`.trim()
  const [inAscolto, setInAscolto] = useState<string | null>(null)
  const prova = useRef<HTMLAudioElement | null>(null)

  useEffect(() => () => prova.current?.pause(), [])

  const cerca = async () => {
    if (!testoRicerca) {
      setMessaggio('Scrivi cosa cercare: brano, artista o album')
      return
    }
    setMessaggio(null)
    setCercando(true)
    // testo non modificato a mano: si cerca anche nella discografia dell'artista
    const disco = termine === null && c.artista.trim() && c.titolo.trim() ? { artista: c.artista.trim(), titolo: c.titolo.trim() } : undefined
    setRisultati(await cercaLibera(testoRicerca, paese, disco))
    setCercando(false)
  }

  const ascolta = (url: string) => {
    prova.current ??= new Audio()
    const a = prova.current
    if (inAscolto === url) {
      a.pause()
      setInAscolto(null)
      return
    }
    a.src = url
    a.volume = 0.8
    a.onended = () => setInAscolto(null)
    void a.play()
    setInAscolto(url)
  }

  const usa = (t: Traccia) => {
    setC((p) => ({
      ...p,
      anteprimaUrl: t.anteprimaUrl,
      anteprimaBrano: t.brano,
      anteprimaLink: t.link,
      // campi ancora vuoti: si riempiono con i dati di iTunes
      artista: p.artista || t.artista,
      titolo: p.titolo || t.album.replace(/ - (Single|EP)$/, ''),
      copertinaUrl: p.copertinaUrl || t.copertinaGrande || '',
    }))
    prova.current?.pause()
    setInAscolto(null)
    setRisultati(null)
  }

  const usaCopertina = (t: Traccia) => t.copertinaGrande && setC((p) => ({ ...p, copertinaUrl: t.copertinaGrande ?? '' }))

  const togliAnteprima = () => setC((p) => ({ ...p, anteprimaUrl: '', anteprimaBrano: '', anteprimaLink: '' }))

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onChiudi()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onChiudi])

  const set = <K extends keyof Campi>(k: K) => (v: Campi[K]) => setC((p) => ({ ...p, [k]: v }))

  const invia = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvio(true)
    setErrori({})
    setMessaggio(null)
    const corpo: DiscoRequest = {
      titolo: c.titolo.trim(),
      artista: c.artista.trim(),
      genere: vuotoANull(c.genere),
      anno: numero(c.anno),
      descrizione: vuotoANull(c.descrizione),
      copertinaUrl: vuotoANull(c.copertinaUrl),
      prezzoVendita: numero(c.prezzoVendita) ?? 0,
      anteprimaUrl: vuotoANull(c.anteprimaUrl),
      anteprimaBrano: vuotoANull(c.anteprimaBrano),
      anteprimaLink: vuotoANull(c.anteprimaLink),
      prezzoAcquisto: numero(c.prezzoAcquisto),
      fornitore: vuotoANull(c.fornitore),
      pubblicato: c.pubblicato,
    }
    try {
      const salvato = iniziale ? await api.dischi.aggiorna(iniziale.id, corpo) : await api.dischi.crea(corpo)
      onSalvato(salvato)
    } catch (err) {
      if (err instanceof ApiError) {
        setMessaggio(err.messaggio)
        if (err.campi) setErrori(err.campi)
      }
    } finally {
      setInvio(false)
    }
  }

  const pv = numero(c.prezzoVendita)
  const pa = numero(c.prezzoAcquisto)
  const m = pv != null ? margine(pv, pa) : null

  const campo = (k: keyof Campi, etichetta: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={`campo ${errori[k] ? 'campo--errore' : ''}`}>
      <span>{etichetta}</span>
      <input
        value={c[k] as string}
        onChange={(e) => set(k)(e.target.value as never)}
        {...props}
      />
      {errori[k] && <small>{errori[k]}</small>}
    </label>
  )

  // portal su body: dentro <main> la modale resterebbe sotto la navbar (stacking context)
  return createPortal(
    <motion.div className="modale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onChiudi}>
      <motion.div
        className="modale__pannello"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-disco-titolo"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="form-disco">
          <aside className="form-disco__anteprima">
            <div className="anteprima">
              <div className={`anteprima__vinile ${c.pubblicato ? 'anteprima__vinile--fuori' : ''}`} />
              <Copertina
                key={c.copertinaUrl}
                url={vuotoANull(c.copertinaUrl)}
                titolo={c.titolo || 'Senza titolo'}
                artista={c.artista || 'Artista'}
                className="anteprima__cover"
              />
            </div>
            <p className="anteprima__stato">{c.pubblicato ? 'Andrà in vetrina' : 'Resterà in bozza'}</p>
            <dl className="anteprima__conti">
              <div><dt>Vendita</dt><dd>{formattaEuro(pv)}</dd></div>
              <div><dt>Acquisto</dt><dd>{formattaEuro(pa)}</dd></div>
              <div><dt>Margine</dt><dd className={m != null && m < 0 ? 'negativo' : ''}>{m == null ? '—' : `${m.toFixed(1)}%`}</dd></div>
            </dl>
          </aside>

          <form className="form-disco__campi" onSubmit={invia} noValidate>
            <header className="modale__testa">
              <h2 id="form-disco-titolo">{iniziale ? 'Modifica disco' : 'Nuovo disco'}</h2>
              <button type="button" className="modale__chiudi" onClick={onChiudi} aria-label="Chiudi">×</button>
            </header>

            <div className="griglia-campi">
              {campo('titolo', 'Titolo *', { required: true, autoFocus: true })}
              {campo('artista', 'Artista *', { required: true })}
              {campo('genere', 'Genere')}
              {campo('anno', 'Anno', { inputMode: 'numeric', placeholder: 'es. 1977' })}
              <div className="span-2">{campo('copertinaUrl', 'URL copertina', { type: 'url', placeholder: 'https://…' })}</div>
              <label className={`campo span-2 ${errori.descrizione ? 'campo--errore' : ''}`}>
                <span>Descrizione</span>
                <textarea rows={3} value={c.descrizione} onChange={(e) => set('descrizione')(e.target.value)} />
                {errori.descrizione && <small>{errori.descrizione}</small>}
              </label>
            </div>

            <fieldset className="campi-anteprima">
              <legend>Anteprima audio <span>· pubblica</span></legend>
              <p className="campi-anteprima__nota">
                Cerca il brano su iTunes: con <strong>Usa</strong> prendi anteprima e link Apple Music
                (e riempi copertina, artista e titolo se sono vuoti). <strong>Copertina</strong> usa solo l’immagine dell’album.
                Senza anteprima, la pagina del disco ne cerca una da sola.
              </p>
              <div className="ricerca-itunes">
                <label className="campo campo--cerca">
                  <span className="sr-only">Cerca su iTunes</span>
                  <input
                    type="search"
                    value={testoRicerca}
                    placeholder="brano, artista o album…"
                    onChange={(e) => setTermine(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void cerca()
                      }
                    }}
                  />
                </label>
                <div className="consolle__giri" role="group" aria-label="Store iTunes">
                  {(['IT', 'US'] as const).map((p) => (
                    <button key={p} type="button" className={paese === p ? 'attivo' : ''} onClick={() => setPaese(p)} title={p === 'US' ? 'Alcune versioni esistono solo nello store americano' : 'Store italiano'}>
                      {p}
                    </button>
                  ))}
                </div>
                <button type="button" className="bottone bottone--piccolo" onClick={() => void cerca()} disabled={cercando}>
                  {cercando ? 'Cerco…' : '♫ Cerca'}
                </button>
              </div>
              <div className="campi-anteprima__azioni">
                {c.anteprimaUrl && (
                  <>
                    <button type="button" className="bottone bottone--piccolo bottone--fantasma" onClick={() => ascolta(c.anteprimaUrl)}>
                      {inAscolto === c.anteprimaUrl ? '❚❚ Pausa' : '▶ Ascolta la scelta'}
                    </button>
                    <button type="button" className="bottone bottone--piccolo bottone--pericolo" onClick={togliAnteprima}>
                      Togli
                    </button>
                  </>
                )}
              </div>

              {risultati && (
                <ul className="risultati-itunes">
                  {risultati.length === 0 && <li className="risultati-itunes__vuoto">Nessun brano trovato: prova altre parole o lo store US.</li>}
                  {risultati.slice(0, 12).map((t) => (
                    <li key={t.anteprimaUrl}>
                      {t.copertina && <img src={t.copertina} alt="" width={36} height={36} />}
                      <span className="risultati-itunes__testo">
                        <strong>{t.brano}</strong>
                        <small>{t.artista} · {t.album}</small>
                      </span>
                      <button type="button" className="icona" onClick={() => ascolta(t.anteprimaUrl)} aria-label={`Ascolta ${t.brano}`}>
                        {inAscolto === t.anteprimaUrl ? '❚❚' : '▶'}
                      </button>
                      {t.copertinaGrande && (
                        <button type="button" className="bottone bottone--piccolo bottone--fantasma" onClick={() => usaCopertina(t)} title="Usa la copertina di questo album">
                          Copertina
                        </button>
                      )}
                      <button type="button" className="bottone bottone--piccolo" onClick={() => usa(t)}>Usa</button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="griglia-campi">
                {campo('anteprimaBrano', 'Brano')}
                {campo('anteprimaUrl', 'URL audio (30 s)', { type: 'url', placeholder: 'https://…m4a' })}
                <div className="span-2">{campo('anteprimaLink', 'Link Apple Music', { type: 'url', placeholder: 'https://music.apple.com/…' })}</div>
              </div>
            </fieldset>

            <fieldset className="riservati">
              <legend>Campi riservati <span>· solo admin</span></legend>
              <div className="griglia-campi">
                {campo('prezzoVendita', 'Prezzo di vendita (€) *', { inputMode: 'decimal', required: true })}
                {campo('prezzoAcquisto', 'Prezzo d’acquisto (€)', { inputMode: 'decimal' })}
                <div className="span-2">{campo('fornitore', 'Fornitore')}</div>
              </div>
              <label className="interruttore">
                <input type="checkbox" checked={c.pubblicato} onChange={(e) => set('pubblicato')(e.target.checked)} />
                <span className="interruttore__binario"><span /></span>
                Pubblicato in vetrina
              </label>
            </fieldset>

            {messaggio && <p className="avviso avviso--errore">{messaggio}</p>}

            <div className="modale__azioni">
              <button type="button" className="bottone bottone--fantasma" onClick={onChiudi}>Annulla</button>
              <button type="submit" className="bottone bottone--pieno" disabled={invio}>
                {invio ? 'Salvo…' : iniziale ? 'Salva modifiche' : 'Crea disco'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
