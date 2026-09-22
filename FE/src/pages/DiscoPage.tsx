import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { isDiscoAdmin, type Disco, type DiscoAdmin } from '../api/types'
import Copertina from '../components/Copertina'
import DiscoForm from '../components/DiscoForm'
import HeartButton from '../components/HeartButton'
import Loader from '../components/Loader'
import CountUp from '../components/reactbits/CountUp'
import DecryptedText from '../components/reactbits/DecryptedText'
import SplitText from '../components/reactbits/SplitText'
import TiltedCard from '../components/reactbits/TiltedCard'
import { formattaData, formattaEuro, margine } from '../components/format'
import { useAuth, useToast } from '../context/contexts'
import { cercaTracce, type Traccia } from '../api/itunes'
import { AnteprimaAudio, VELOCITA_45 } from '../three/anteprima'
import { Crackle } from '../three/crackle'
import type { Mixer } from '../three/TurntableScene'

const TurntableScene = lazy(() => import('../three/TurntableScene'))

export default function DiscoPage() {
  const { id } = useParams()
  const { livello } = useAuth()
  const { mostra } = useToast()
  const navigate = useNavigate()
  // la risposta vale per un id e un livello precisi: se cambiano, si torna al caricamento
  const chiave = `${id}|${livello}`
  const [risposta, setRisposta] = useState<{
    chiave: string
    disco?: Disco
    errore?: { status: number; messaggio: string }
  } | null>(null)
  const attuale = risposta?.chiave === chiave ? risposta : null
  const disco = attuale?.disco ?? null
  const errore = attuale?.errore ?? null
  const setDisco = (d: Disco) => setRisposta({ chiave, disco: d })
  const [suona, setSuona] = useState(false)
  const [giri, setGiri] = useState<33 | 45>(33)
  const [audio, setAudio] = useState(true)
  const [modifica, setModifica] = useState(false)
  const crackle = useRef<Crackle | null>(null)

  useEffect(() => {
    let vivo = true
    api.dischi
      .dettaglio(Number(id))
      .then((d) => vivo && setRisposta({ chiave, disco: d }))
      .catch((e) => {
        if (!vivo) return
        setRisposta({
          chiave,
          errore: e instanceof ApiError ? { status: e.status, messaggio: e.messaggio } : { status: 0, messaggio: 'Errore' },
        })
      })
    return () => {
      vivo = false
    }
  }, [id, chiave])

  // ---------- anteprima audio ----------
  // Se la scheda ha un'anteprima scelta dall'admin si usa quella, altrimenti si cerca su iTunes.
  const artista = disco?.artista
  const titolo = disco?.titolo
  const urlScheda = disco?.anteprimaUrl ?? null
  const chiaveRicerca = artista && titolo && !urlScheda ? `${artista}|${titolo}` : null
  const [trovata, setTrovata] = useState<{ per: string; traccia: Traccia | null } | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [urlGuasto, setUrlGuasto] = useState<string | null>(null)
  const player = useRef<AnteprimaAudio | null>(null)
  const [caricato, setCaricato] = useState<string | null>(null)
  const [tagliato, setTagliato] = useState(false)

  useEffect(() => {
    if (!chiaveRicerca || !artista || !titolo) return
    let vivo = true
    cercaTracce(artista, titolo).then((t) => vivo && setTrovata({ per: chiaveRicerca, traccia: t[0] ?? null }))
    return () => {
      vivo = false
    }
  }, [chiaveRicerca, artista, titolo])

  /** undefined = ricerca in corso, null = nessuna anteprima */
  const traccia: { brano: string; url: string; link: string | null; fonte: 'scheda' | 'itunes' } | null | undefined =
    disco && urlScheda
      ? { brano: disco.anteprimaBrano ?? disco.titolo, url: urlScheda, link: disco.anteprimaLink, fonte: 'scheda' }
      : trovata?.per === chiaveRicerca
        ? trovata?.traccia
          ? { brano: trovata.traccia.brano, url: trovata.traccia.anteprimaUrl, link: trovata.traccia.link, fonte: 'itunes' }
          : null
        : undefined
  const urlAnteprima = traccia && traccia.url !== urlGuasto ? traccia.url : null

  useEffect(() => {
    const p = (player.current ??= new AnteprimaAudio())
    p.onProgresso = setProgresso
    // finiti i 30 secondi la puntina si alza da sola
    p.onFine = () => setSuona(false)
    p.onErrore = (url) => setUrlGuasto(url)
    return () => {
      p.dispose()
      player.current = null
    }
  }, [])

  // l'anteprima si scarica subito: cosi' lo scratch e' pronto anche prima di premere play
  useEffect(() => {
    if (!urlAnteprima) return
    const p = (player.current ??= new AnteprimaAudio())
    let vivo = true
    p.carica(urlAnteprima).then(() => vivo && p.caricato && setCaricato(urlAnteprima))
    return () => {
      vivo = false
    }
  }, [urlAnteprima])

  useEffect(() => {
    const p = (player.current ??= new AnteprimaAudio())
    if (!suona || !urlAnteprima) {
      p.ferma()
      return
    }
    // la musica parte quando la puntina tocca il disco
    const t = window.setTimeout(() => void p.carica(urlAnteprima).then(() => p.suona()), 1400)
    return () => window.clearTimeout(t)
  }, [suona, urlAnteprima])

  useEffect(() => {
    if (player.current) player.current.velocitaBase = giri === 45 ? VELOCITA_45 : 1
  }, [giri, caricato])

  const mixerPronto = !!urlAnteprima && caricato === urlAnteprima
  const mixer = useMemo<Mixer>(
    () => ({
      velocita: () => player.current?.velocitaAttuale ?? null,
      scratch: (v) => player.current?.scratch(v),
      fineScratch: () => player.current?.fineScratch(),
    }),
    [],
  )

  const taglia = (chiuso: boolean) => {
    player.current?.taglia(chiuso)
    setTagliato(chiuso)
  }

  // barra spaziatrice tenuta premuta = crossfader chiuso (transformer scratch)
  useEffect(() => {
    if (!mixerPronto) return
    const fuoriDaiCampi = (e: KeyboardEvent) =>
      !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement)
    const giu = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !fuoriDaiCampi(e)) return
      e.preventDefault()
      if (!e.repeat) {
        player.current?.taglia(true)
        setTagliato(true)
      }
    }
    const su = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      player.current?.taglia(false)
      setTagliato(false)
    }
    window.addEventListener('keydown', giu)
    window.addEventListener('keyup', su)
    return () => {
      window.removeEventListener('keydown', giu)
      window.removeEventListener('keyup', su)
    }
  }, [mixerPronto])

  // fruscio: parte solo dopo un click, come vogliono i browser; sotto la musica resta leggero
  useEffect(() => {
    crackle.current ??= new Crackle()
    crackle.current.setLivello(urlAnteprima ? 0.14 : 0.6)
    if (suona && audio) crackle.current.start()
    else crackle.current.stop()
  }, [suona, audio, urlAnteprima])

  useEffect(() => () => crackle.current?.dispose(), [])

  if (errore) {
    return (
      <div className="pagina pagina--stretta vuoto">
        <div className="vuoto__lucchetto" aria-hidden>{errore.status || '!'}</div>
        <h1>{errore.status === 404 ? 'Questo disco non è in vetrina' : 'Qualcosa è andato storto'}</h1>
        <p>
          {errore.status === 404
            ? 'Non esiste, oppure è una bozza: per chi non amministra il server risponde 404, come se non ci fosse.'
            : errore.messaggio}
        </p>
        <Link className="bottone" to="/">Torna alla vetrina</Link>
      </div>
    )
  }

  if (!disco) return <Loader />

  const admin = isDiscoAdmin(disco)
  const m = admin ? margine(disco.prezzoVendita, disco.prezzoAcquisto) : null

  const aggiornato = (d: DiscoAdmin) => {
    setDisco(d)
    setModifica(false)
    mostra('Disco aggiornato', 'ok')
  }

  const pubblicazione = async () => {
    if (!admin) return
    try {
      const d = await api.dischi.pubblicazione(disco.id, !disco.pubblicato)
      setDisco(d)
      mostra(d.pubblicato ? 'Pubblicato in vetrina' : 'Riportato in bozza', 'ok')
    } catch (e) {
      if (e instanceof ApiError) mostra(e.messaggio, 'errore')
    }
  }

  const elimina = async () => {
    if (!window.confirm(`Eliminare «${disco.titolo}»? Verrà tolto anche dalle casse degli utenti.`)) return
    try {
      await api.dischi.elimina(disco.id)
      mostra('Disco eliminato', 'ok')
      navigate('/')
    } catch (e) {
      if (e instanceof ApiError) mostra(e.messaggio, 'errore')
    }
  }

  return (
    <div className="pagina disco">
      <Link to="/" className="indietro">← Vetrina</Link>

      <div className="disco__griglia">
        <section className="disco__palco" aria-label="Giradischi">
          <div className="disco__canvas">
            <Suspense fallback={<Loader testo="Monto il giradischi…" />}>
              <TurntableScene disco={disco} inRiproduzione={suona} giri={giri} mixer={mixerPronto ? mixer : undefined} />
            </Suspense>
          </div>
          <div className="consolle">
            <button
              type="button"
              className={`consolle__play ${suona ? 'consolle__play--attivo' : ''}`}
              onClick={() => {
                // sbloccare l'audio qui, dentro il tocco: sui telefoni dopo non si puo' piu'
                player.current?.sblocca()
                crackle.current ??= new Crackle()
                crackle.current.sblocca()
                setSuona((s) => !s)
              }}
              aria-pressed={suona}
            >
              {suona ? '❚❚ Ferma' : '▶ Metti su'}
            </button>
            <div className="consolle__giri" role="group" aria-label="Giri al minuto">
              {([33, 45] as const).map((g) => (
                <button key={g} type="button" className={giri === g ? 'attivo' : ''} onClick={() => setGiri(g)}>
                  {g === 33 ? '33⅓' : '45'}
                </button>
              ))}
            </div>
            <label className="consolle__audio">
              <input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} />
              fruscio
            </label>
            <span className="consolle__hint">
              {mixerPronto ? 'trascina il disco per lo scratch · fuori dal disco giri la visuale' : 'trascina per girare intorno'}
            </span>
          </div>

          {mixerPronto && (
            <div className="deck" role="group" aria-label="Controlli da DJ">
              <button
                type="button"
                className={`deck__cut ${tagliato ? 'deck__cut--chiuso' : ''}`}
                onPointerDown={() => {
                  player.current?.sblocca()
                  taglia(true)
                }}
                onPointerUp={() => taglia(false)}
                onPointerLeave={() => tagliato && taglia(false)}
                title="Tieni premuto (o tieni premuta la barra spaziatrice) per tagliare il suono mentre fai scratch"
              >
                CUT <kbd>spazio</kbd>
              </button>
              <button
                type="button"
                className="deck__backspin"
                onClick={() => {
                  player.current?.sblocca()
                  player.current?.backspin()
                }}
                disabled={!suona}
                title="Lancia il disco all'indietro: il motore lo riprende da solo"
              >
                ⟲ Backspin
              </button>
              <span className="deck__nota">Scratch sull’anteprima: mano sul disco, avanti e indietro.</span>
            </div>
          )}

          <div className={`anteprima-audio ${suona && urlAnteprima ? 'anteprima-audio--in-onda' : ''}`} aria-live="polite">
            {traccia === undefined && <p className="anteprima-audio__stato">Cerco un’anteprima su iTunes…</p>}
            {traccia === null && (
              <p className="anteprima-audio__stato">Nessuna anteprima trovata: il giradischi suona solo il fruscio.</p>
            )}
            {traccia && (
              <>
                <div className="anteprima-audio__riga">
                  <span className="anteprima-audio__eq" aria-hidden>
                    <i /><i /><i /><i />
                  </span>
                  <div className="anteprima-audio__brano">
                    <span className="anteprima-audio__etichetta">
                      {suona && urlAnteprima ? 'Stai ascoltando' : 'Anteprima'} · 30 s
                    </span>
                    <strong>{traccia.brano}</strong>
                  </div>
                  {traccia.link && (
                    <a className="apple-music" href={traccia.link} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                        <path fill="currentColor" d="M16 3v11.5a3.5 3.5 0 1 1-2-3.16V6.3L9 7.4v9.1a3.5 3.5 0 1 1-2-3.16V5.8L16 3z" />
                      </svg>
                      Ascolta su Apple Music
                    </a>
                  )}
                </div>
                <div className="anteprima-audio__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso * 100)}>
                  <span style={{ transform: `scaleX(${progresso})` }} />
                </div>
                <p className="anteprima-audio__nota">
                  {urlGuasto === traccia.url
                    ? 'Questa anteprima non si riesce a riprodurre.'
                    : traccia.fonte === 'itunes'
                      ? 'Anteprima trovata automaticamente su iTunes · audio © Apple'
                      : 'Anteprima scelta dal negozio'}
                </p>
              </>
            )}
          </div>
        </section>

        <section className="disco__info">
          <div className="disco__copertina">
            {disco.copertinaUrl ? (
            <TiltedCard
              imageSrc={disco.copertinaUrl ?? ''}
              altText={`Copertina di ${disco.titolo}`}
              captionText={`${disco.artista} — ${disco.titolo}`}
              containerHeight="220px"
              containerWidth="220px"
              imageHeight="220px"
              imageWidth="220px"
              rotateAmplitude={12}
              scaleOnHover={1.06}
              showMobileWarning={false}
              showTooltip
            />
            ) : (
              <Copertina url={null} titolo={disco.titolo} artista={disco.artista} className="disco__copertina-vuota" />
            )}
          </div>

          <p className="occhiello">{disco.artista}</p>
          <SplitText
            key={disco.id}
            tag="h1"
            text={disco.titolo}
            className="disco__titolo"
            splitType="chars"
            delay={28}
            duration={0.6}
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            textAlign="left"
          />
          <p className="disco__meta">
            {[disco.anno, disco.genere].filter(Boolean).join(' · ')}
            {admin && !disco.pubblicato && <span className="timbro timbro--inline">Bozza</span>}
          </p>
          {disco.descrizione && <p className="disco__descrizione">{disco.descrizione}</p>}

          <div className="disco__acquisto">
            <span className="prezzo prezzo--grande">{formattaEuro(disco.prezzoVendita)}</span>
            <HeartButton discoId={disco.id} grande />
          </div>

          <AnimatePresence>
            {admin && (
              <motion.aside
                className="scheda-riservata"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                aria-label="Dati riservati all'amministratore"
              >
                <header>
                  <span className="riservato__etichetta">Scheda riservata</span>
                  <span className="scheda-riservata__nota">questi campi arrivano solo con ruolo ADMIN</span>
                </header>
                <dl>
                  <div>
                    <dt>Prezzo d’acquisto</dt>
                    <dd><DecryptedText text={formattaEuro(disco.prezzoAcquisto)} animateOn="view" sequential speed={40} encryptedClassName="riservato__cifrato" /></dd>
                  </div>
                  <div>
                    <dt>Margine</dt>
                    <dd>{m == null ? '—' : <><CountUp to={Math.round(m)} duration={1.4} />%</>}</dd>
                  </div>
                  <div>
                    <dt>Fornitore</dt>
                    <dd><DecryptedText text={disco.fornitore ?? '—'} animateOn="view" speed={35} maxIterations={16} encryptedClassName="riservato__cifrato" /></dd>
                  </div>
                  <div>
                    <dt>Inserito il</dt>
                    <dd>{formattaData(disco.creatoIl)}</dd>
                  </div>
                </dl>
                <div className="scheda-riservata__azioni">
                  <button type="button" className="bottone" onClick={() => setModifica(true)}>Modifica</button>
                  <button type="button" className="bottone bottone--fantasma" onClick={pubblicazione}>
                    {disco.pubblicato ? 'Riporta in bozza' : 'Pubblica'}
                  </button>
                  <button type="button" className="bottone bottone--pericolo" onClick={elimina}>Elimina</button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
        {modifica && admin && (
          <DiscoForm iniziale={disco} onChiudi={() => setModifica(false)} onSalvato={aggiornato} />
        )}
      </AnimatePresence>
    </div>
  )
}
