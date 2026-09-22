import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { isDiscoAdmin, type DiscoAdmin } from '../api/types'
import Copertina from '../components/Copertina'
import DiscoForm from '../components/DiscoForm'
import Loader from '../components/Loader'
import CountUp from '../components/reactbits/CountUp'
import SplitText from '../components/reactbits/SplitText'
import StarBorder from '../components/reactbits/StarBorder'
import { formattaEuro, margine } from '../components/format'
import { useToast } from '../context/contexts'

type Filtro = 'tutti' | 'pubblicati' | 'bozze'

export default function AdminPage() {
  const { mostra } = useToast()
  const [dischi, setDischi] = useState<DiscoAdmin[] | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('tutti')
  const [form, setForm] = useState<{ aperto: boolean; disco?: DiscoAdmin }>({ aperto: false })

  useEffect(() => {
    let vivo = true
    api.dischi
      .elenco()
      // con ruolo ADMIN il server manda la vista completa
      .then((d) => vivo && setDischi(d.filter(isDiscoAdmin)))
      .catch((e) => vivo && e instanceof ApiError && mostra(e.messaggio, 'errore'))
    return () => {
      vivo = false
    }
  }, [mostra])

  const stats = useMemo(() => {
    const lista = dischi ?? []
    const pubblicati = lista.filter((d) => d.pubblicato).length
    const magazzino = lista.reduce((s, d) => s + (d.prezzoAcquisto ?? 0), 0)
    const margini = lista.map((d) => margine(d.prezzoVendita, d.prezzoAcquisto)).filter((m): m is number => m != null)
    const medio = margini.length ? margini.reduce((a, b) => a + b, 0) / margini.length : 0
    return { totale: lista.length, pubblicati, bozze: lista.length - pubblicati, magazzino, medio }
  }, [dischi])

  const visibili = (dischi ?? []).filter((d) =>
    filtro === 'tutti' ? true : filtro === 'pubblicati' ? d.pubblicato : !d.pubblicato,
  )

  const sostituisci = (d: DiscoAdmin) =>
    setDischi((ds) => {
      const lista = ds ?? []
      return lista.some((x) => x.id === d.id) ? lista.map((x) => (x.id === d.id ? d : x)) : [d, ...lista]
    })

  const pubblicazione = async (d: DiscoAdmin) => {
    sostituisci({ ...d, pubblicato: !d.pubblicato })
    try {
      sostituisci(await api.dischi.pubblicazione(d.id, !d.pubblicato))
    } catch (e) {
      sostituisci(d)
      if (e instanceof ApiError) mostra(e.messaggio, 'errore')
    }
  }

  const elimina = async (d: DiscoAdmin) => {
    if (!window.confirm(`Eliminare «${d.titolo}»? Verrà tolto anche dalle casse degli utenti.`)) return
    try {
      await api.dischi.elimina(d.id)
      setDischi((ds) => (ds ?? []).filter((x) => x.id !== d.id))
      mostra('Disco eliminato', 'ok')
    } catch (e) {
      if (e instanceof ApiError) mostra(e.messaggio, 'errore')
    }
  }

  return (
    <div className="pagina regia">
      <header className="regia__testa">
        <div>
          <p className="occhiello">Regia · solo amministratore</p>
          <SplitText tag="h1" text="Il banco di regia" className="pagina__titolo" splitType="chars" delay={30} textAlign="left" />
          <p className="regia__nota">
            Ogni pulsante qui chiama un endpoint con <code>@PreAuthorize("hasRole('ADMIN')")</code>.
            Un utente normale che li chiamasse riceverebbe 403.
          </p>
        </div>
        <StarBorder as="button" type="button" color="#ff5b1f" speed="4s" className="cta" onClick={() => setForm({ aperto: true })}>
          + Nuovo disco
        </StarBorder>
      </header>

      <dl className="regia__stats">
        <div><dt>in archivio</dt><dd><CountUp to={stats.totale} duration={1} /></dd></div>
        <div><dt>in vetrina</dt><dd><CountUp to={stats.pubblicati} duration={1} /></dd></div>
        <div><dt>bozze</dt><dd><CountUp to={stats.bozze} duration={1} /></dd></div>
        <div><dt>costo magazzino</dt><dd>€ <CountUp to={Math.round(stats.magazzino)} duration={1.4} separator="." /></dd></div>
        <div><dt>margine medio</dt><dd><CountUp to={Math.round(stats.medio)} duration={1.4} />%</dd></div>
      </dl>

      <div className="schede" role="tablist" aria-label="Filtra per stato">
        {(['tutti', 'pubblicati', 'bozze'] as const).map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filtro === f} className={`scheda ${filtro === f ? 'scheda--attiva' : ''}`} onClick={() => setFiltro(f)}>
            {filtro === f && <motion.span layoutId="scheda-evidenza" className="scheda__evidenza" />}
            <span>{f}</span>
          </button>
        ))}
      </div>

      {!dischi && <Loader />}

      <div className="tabella" role="table" aria-label="Dischi in archivio">
        {dischi && visibili.length > 0 && (
          <div className="tabella__riga tabella__riga--testa" role="row">
            <span role="columnheader">Disco</span>
            <span role="columnheader">Vendita</span>
            <span role="columnheader">Acquisto</span>
            <span role="columnheader">Margine</span>
            <span role="columnheader">Fornitore</span>
            <span role="columnheader">In vetrina</span>
            <span role="columnheader"><span className="sr-only">Azioni</span></span>
          </div>
        )}
        <AnimatePresence initial={false}>
          {visibili.map((d) => {
            const m = margine(d.prezzoVendita, d.prezzoAcquisto)
            return (
              <motion.div
                key={d.id}
                layout
                role="row"
                className={`tabella__riga ${d.pubblicato ? '' : 'tabella__riga--bozza'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <span role="cell" className="tabella__disco">
                  <Copertina url={d.copertinaUrl} titolo={d.titolo} artista={d.artista} className="tabella__cover" />
                  <span>
                    <Link to={`/dischi/${d.id}`} className="tabella__titolo">{d.titolo}</Link>
                    <span className="tabella__artista">{d.artista}{d.anno ? ` · ${d.anno}` : ''}</span>
                  </span>
                </span>
                <span role="cell" className="tabella__num" data-label="Vendita">{formattaEuro(d.prezzoVendita)}</span>
                <span role="cell" className="tabella__num tabella__riservato" data-label="Acquisto">{formattaEuro(d.prezzoAcquisto)}</span>
                <span role="cell" className="tabella__num" data-label="Margine">
                  {m == null ? '—' : (
                    <span className="barra-margine" style={{ '--m': `${Math.max(0, Math.min(100, m))}%` } as React.CSSProperties}>
                      {m.toFixed(0)}%
                    </span>
                  )}
                </span>
                <span role="cell" className="tabella__riservato tabella__fornitore" data-label="Fornitore">{d.fornitore ?? '—'}</span>
                <span role="cell" data-label="In vetrina">
                  <label className="interruttore interruttore--solo">
                    <input type="checkbox" checked={d.pubblicato} onChange={() => void pubblicazione(d)} aria-label={d.pubblicato ? 'Riporta in bozza' : 'Pubblica'} />
                    <span className="interruttore__binario"><span /></span>
                  </label>
                </span>
                <span role="cell" className="tabella__azioni">
                  <button type="button" className="icona" onClick={() => setForm({ aperto: true, disco: d })} aria-label={`Modifica ${d.titolo}`} title="Modifica">✎</button>
                  <button type="button" className="icona icona--pericolo" onClick={() => void elimina(d)} aria-label={`Elimina ${d.titolo}`} title="Elimina">🗑</button>
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {dischi && visibili.length === 0 && <p className="vuoto-riga">Nessun disco in questa scheda.</p>}
      </div>

      <AnimatePresence>
        {form.aperto && (
          <DiscoForm
            iniziale={form.disco}
            onChiudi={() => setForm({ aperto: false })}
            onSalvato={(d) => {
              sostituisci(d)
              setForm({ aperto: false })
              if (!d.pubblicato) mostra(`«${d.titolo}» salvato in bozza: in vetrina lo vede solo l’admin`, 'info')
              else mostra(form.disco ? 'Disco aggiornato' : `«${d.titolo}» è in vetrina`, 'ok')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
