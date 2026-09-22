import { motion } from 'motion/react'
import type { LivelloAccesso } from '../context/contexts'
import CountUp from './reactbits/CountUp'

interface Props {
  livello: LivelloAccesso
  ricevuti: number
  bozze: number
  campi: number
}

const LIVELLI: { id: LivelloAccesso; nome: string; cosa: string }[] = [
  { id: 'OSPITE', nome: 'Ospite', cosa: 'Solo dischi pubblicati, solo i campi pubblici.' },
  { id: 'UTENTE', nome: 'Utente', cosa: 'Come l’ospite, più la tua cassa di preferiti.' },
  { id: 'ADMIN', nome: 'Admin', cosa: 'Anche bozze, prezzo d’acquisto e fornitore.' },
]

/**
 * Mostra come il server ha risposto a GET /api/dischi per chi sta guardando.
 * I numeri vengono dalla risposta reale, non da una regola scritta nel frontend.
 */
export default function LivelliAccesso({ livello, ricevuti, bozze, campi }: Props) {
  return (
    <section className="livelli" aria-label="Come ti vede il server">
      <div className="livelli__intro">
        <p className="occhiello">Stesso indirizzo, tre risposte</p>
        <h2>
          Il server ti vede come <em>{LIVELLI.find((l) => l.id === livello)?.nome}</em>
        </h2>
        <p className="livelli__nota">
          <code>GET /api/dischi</code> ha restituito:
        </p>
        <dl className="livelli__numeri">
          <div>
            <dt>dischi</dt>
            <dd><CountUp to={ricevuti} duration={1.2} /></dd>
          </div>
          <div>
            <dt>bozze</dt>
            <dd><CountUp to={bozze} duration={1.2} /></dd>
          </div>
          <div>
            <dt>campi per disco</dt>
            <dd><CountUp to={campi} duration={1.2} /></dd>
          </div>
        </dl>
      </div>

      <ol className="livelli__scala">
        {LIVELLI.map((l, i) => {
          const attivo = l.id === livello
          return (
            <li key={l.id} className={`livello ${attivo ? 'livello--attivo' : ''}`}>
              {attivo && (
                <motion.span layoutId="livello-evidenza" className="livello__evidenza" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
              )}
              <span className="livello__numero">0{i + 1}</span>
              <span className="livello__nome">{l.nome}</span>
              <span className="livello__cosa">{l.cosa}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
