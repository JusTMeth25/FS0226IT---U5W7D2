import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import Copertina from '../components/Copertina'
import Loader from '../components/Loader'
import CountUp from '../components/reactbits/CountUp'
import SplitText from '../components/reactbits/SplitText'
import { formattaData, formattaEuro } from '../components/format'
import { useAuth, usePreferiti } from '../context/contexts'

export default function PreferitiPage() {
  const { utente } = useAuth()
  const { preferiti, caricamento, rimuovi } = usePreferiti()
  const totale = preferiti.reduce((s, p) => s + p.disco.prezzoVendita, 0)

  return (
    <div className="pagina cassa">
      <header className="cassa__testa">
        <div>
          <p className="occhiello">La cassa di {utente?.nome}</p>
          <SplitText tag="h1" text="I dischi che hai messo da parte" className="pagina__titolo" splitType="words" delay={60} textAlign="left" />
          <p className="cassa__nota">
            Il server ti restituisce solo le righe con il tuo <code>utente_id</code>.
            Chiedere il preferito di un altro, anche conoscendone il numero, risponde 404.
          </p>
        </div>
        <dl className="cassa__numeri">
          <div>
            <dt>dischi</dt>
            <dd><CountUp to={preferiti.length} duration={1} /></dd>
          </div>
          <div>
            <dt>valore</dt>
            <dd>€ <CountUp to={Math.round(totale)} duration={1.2} separator="." /></dd>
          </div>
        </dl>
      </header>

      {caricamento && preferiti.length === 0 && <Loader />}

      {!caricamento && preferiti.length === 0 && (
        <div className="vuoto">
          <div className="cassa__vuota" aria-hidden>
            <span /><span /><span />
          </div>
          <h2>La cassa è vuota</h2>
          <p>Passa dalla vetrina e premi il cuore sui dischi che ti piacciono.</p>
          <Link to="/" className="bottone bottone--pieno">Vai alla vetrina</Link>
        </div>
      )}

      <ul className="cassa__lista">
        <AnimatePresence initial={false}>
          {preferiti.map((p, i) => (
            <motion.li
              key={p.id}
              layout
              className="cassa__riga"
              initial={{ opacity: 0, rotateX: -60, y: 20 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, x: 80, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(i * 0.05, 0.4) }}
            >
              <span className="cassa__numero" title="Id del preferito sul server">#{p.id}</span>
              <Link to={`/dischi/${p.disco.id}`} className="cassa__cover">
                <Copertina url={p.disco.copertinaUrl} titolo={p.disco.titolo} artista={p.disco.artista} />
              </Link>
              <div className="cassa__info">
                <Link to={`/dischi/${p.disco.id}`} className="cassa__titolo">{p.disco.titolo}</Link>
                <span className="cassa__artista">{p.disco.artista}</span>
                <span className="cassa__data">aggiunto il {formattaData(p.aggiuntoIl)}</span>
              </div>
              <span className="prezzo">{formattaEuro(p.disco.prezzoVendita)}</span>
              <button type="button" className="bottone bottone--fantasma bottone--piccolo" onClick={() => void rimuovi(p.id)}>
                Togli
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
