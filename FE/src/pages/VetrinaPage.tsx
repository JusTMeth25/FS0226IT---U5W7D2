import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { isDiscoAdmin, type Disco } from '../api/types'
import DiscoCard from '../components/DiscoCard'
import LivelliAccesso from '../components/LivelliAccesso'
import Loader from '../components/Loader'
import Magnet from '../components/reactbits/Magnet'
import ShinyText from '../components/reactbits/ShinyText'
import SplitText from '../components/reactbits/SplitText'
import StarBorder from '../components/reactbits/StarBorder'
import { useAuth } from '../context/contexts'

const HeroScene = lazy(() => import('../three/HeroScene'))

type Ordine = 'titolo' | 'prezzo-su' | 'prezzo-giu' | 'anno'

const DURATA_FUORI = 5200
const DURATA_DENTRO = 900

export default function VetrinaPage() {
  const { livello, pronto } = useAuth()
  const navigate = useNavigate()
  const [dischi, setDischi] = useState<Disco[] | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [cerca, setCerca] = useState('')
  const [genere, setGenere] = useState<string | null>(null)
  const [ordine, setOrdine] = useState<Ordine>('titolo')

  // Ricarico quando cambia il livello: stesso indirizzo, risposta diversa.
  useEffect(() => {
    if (!pronto) return
    let vivo = true
    api.dischi
      .elenco()
      .then((d) => {
        if (!vivo) return
        setDischi(d)
        setErrore(null)
      })
      .catch((e) => vivo && setErrore(e instanceof ApiError ? e.messaggio : 'Errore imprevisto'))
    return () => {
      vivo = false
    }
  }, [livello, pronto])

  // ---------- hero: il disco esce e rientra dalla busta ----------
  const perHero = useMemo(
    () => (dischi ?? []).filter((d) => !isDiscoAdmin(d) || d.pubblicato),
    [dischi],
  )
  const [indice, setIndice] = useState(0)
  const [fuori, setFuori] = useState(false)

  useEffect(() => {
    if (perHero.length === 0) return
    let timer: number
    const esci = () => {
      setFuori(true)
      timer = window.setTimeout(rientra, DURATA_FUORI)
    }
    const rientra = () => {
      setFuori(false)
      timer = window.setTimeout(() => {
        setIndice((i) => (i + 1) % perHero.length)
        esci()
      }, DURATA_DENTRO)
    }
    timer = window.setTimeout(esci, 600)
    return () => window.clearTimeout(timer)
  }, [perHero.length])

  const inHero = perHero.length ? perHero[indice % perHero.length] : null

  // ---------- filtri ----------
  const generi = useMemo(
    () => [...new Set((dischi ?? []).map((d) => d.genere).filter((g): g is string => !!g))].sort(),
    [dischi],
  )

  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    const lista = (dischi ?? []).filter(
      (d) =>
        (!genere || d.genere === genere) &&
        (!q || `${d.titolo} ${d.artista}`.toLowerCase().includes(q)),
    )
    const cmp: Record<Ordine, (a: Disco, b: Disco) => number> = {
      titolo: (a, b) => a.titolo.localeCompare(b.titolo),
      'prezzo-su': (a, b) => a.prezzoVendita - b.prezzoVendita,
      'prezzo-giu': (a, b) => b.prezzoVendita - a.prezzoVendita,
      anno: (a, b) => (a.anno ?? 0) - (b.anno ?? 0),
    }
    return [...lista].sort(cmp[ordine])
  }, [dischi, cerca, genere, ordine])

  const bozze = (dischi ?? []).filter((d) => isDiscoAdmin(d) && !d.pubblicato).length
  const campi = dischi && dischi.length ? Object.keys(dischi[0]).length : 0

  return (
    <div className="vetrina">
      <section className="hero">
        <div className="hero__testo">
          <ShinyText text="Negozio di dischi · Vinile nuovo e ristampe" className="occhiello" speed={4} color="#a39686" shineColor="#ffe2c2" />
          <SplitText
            tag="h1"
            text="Ogni disco ha un solco da raccontare."
            className="hero__titolo"
            splitType="words"
            delay={70}
            duration={0.9}
            from={{ opacity: 0, y: 40, rotateX: -40 }}
            to={{ opacity: 1, y: 0, rotateX: 0 }}
            textAlign="left"
          />
          <p className="hero__sottotitolo">
            Sfoglia la vetrina, metti da parte i tuoi preferiti in una cassa tutta tua.
            Quello che vedi dipende da chi sei: lo decide il server, non la pagina.
          </p>
          <div className="hero__azioni">
            <Magnet padding={60} magnetStrength={4}>
              <StarBorder as="a" href="#vetrina" color="#ff5b1f" speed="4s" className="cta">
                Sfoglia la vetrina
              </StarBorder>
            </Magnet>
            {livello === 'OSPITE' && (
              <Link to="/registrazione" className="bottone bottone--fantasma">Crea un account</Link>
            )}
            {livello === 'ADMIN' && (
              <Link to="/admin" className="bottone bottone--fantasma">Vai in regia</Link>
            )}
          </div>

          <AnimatePresence mode="wait">
            {inHero && (
              <motion.button
                type="button"
                key={inHero.id}
                className="hero__ora"
                onClick={() => navigate(`/dischi/${inHero.id}`)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <span className="hero__ora-punto" />
                Sul piatto: <strong>{inHero.titolo}</strong> — {inHero.artista}
                <span aria-hidden>→</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="hero__scena">
          <Suspense fallback={<Loader />}>
            {perHero.length > 0 && (
              <HeroScene
                dischi={perHero}
                indice={indice}
                fuori={fuori}
                onClick={() => inHero && navigate(`/dischi/${inHero.id}`)}
              />
            )}
          </Suspense>
        </div>
      </section>

      {dischi && (
        <LivelliAccesso livello={livello} ricevuti={dischi.length} bozze={bozze} campi={campi} />
      )}

      <section id="vetrina" className="sezione">
        <div className="sezione__testa">
          <div>
            <p className="occhiello">La vetrina</p>
            <h2 className="sezione__titolo">In negozio adesso</h2>
          </div>
          <div className="filtri">
            <label className="campo campo--cerca">
              <span className="sr-only">Cerca</span>
              <input
                type="search"
                placeholder="Cerca titolo o artista…"
                value={cerca}
                onChange={(e) => setCerca(e.target.value)}
              />
            </label>
            <label className="campo campo--select">
              <span className="sr-only">Ordina</span>
              <select value={ordine} onChange={(e) => setOrdine(e.target.value as Ordine)}>
                <option value="titolo">Titolo A–Z</option>
                <option value="prezzo-su">Prezzo crescente</option>
                <option value="prezzo-giu">Prezzo decrescente</option>
                <option value="anno">Anno</option>
              </select>
            </label>
          </div>
        </div>

        {generi.length > 0 && (
          <div className="chips" role="group" aria-label="Filtra per genere">
            <button type="button" className={`chip ${genere === null ? 'chip--attivo' : ''}`} onClick={() => setGenere(null)}>
              Tutti
            </button>
            {generi.map((g) => (
              <button key={g} type="button" className={`chip ${genere === g ? 'chip--attivo' : ''}`} onClick={() => setGenere(g === genere ? null : g)}>
                {g}
              </button>
            ))}
          </div>
        )}

        {errore && <p className="avviso avviso--errore">{errore}</p>}
        {!dischi && !errore && <Loader />}

        {dischi && (
          <motion.div layout className="griglia">
            <AnimatePresence mode="popLayout">
              {visibili.map((d, i) => (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                >
                  <DiscoCard disco={d} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {dischi && visibili.length === 0 && (
          <p className="vuoto-riga">Nessun disco corrisponde alla ricerca.</p>
        )}
      </section>
    </div>
  )
}
