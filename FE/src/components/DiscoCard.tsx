import { Link } from 'react-router-dom'
import { isDiscoAdmin, type Disco } from '../api/types'
import DecryptedText from './reactbits/DecryptedText'
import SpotlightCard from './reactbits/SpotlightCard'
import Copertina from './Copertina'
import HeartButton from './HeartButton'
import { formattaEuro, margine } from './format'

interface Props {
  disco: Disco
  extra?: React.ReactNode
}

export default function DiscoCard({ disco, extra }: Props) {
  const admin = isDiscoAdmin(disco)
  const m = admin ? margine(disco.prezzoVendita, disco.prezzoAcquisto) : null

  return (
    <SpotlightCard className={`disco-card ${admin && !disco.pubblicato ? 'disco-card--bozza' : ''}`} spotlightColor="rgba(255, 140, 60, 0.22)">
      <Link to={`/dischi/${disco.id}`} className="disco-card__link" aria-label={`${disco.titolo} di ${disco.artista}`}>
        <div className="disco-card__media">
          <div className="disco-card__vinile" aria-hidden />
          <Copertina url={disco.copertinaUrl} titolo={disco.titolo} artista={disco.artista} className="disco-card__cover" />
          {admin && !disco.pubblicato && <span className="timbro">Bozza</span>}
        </div>
      </Link>

      <div className="disco-card__corpo">
        <div className="disco-card__testa">
          <div>
            <p className="disco-card__artista">{disco.artista}</p>
            <h3 className="disco-card__titolo">
              <Link to={`/dischi/${disco.id}`}>{disco.titolo}</Link>
            </h3>
          </div>
          <HeartButton discoId={disco.id} />
        </div>
        <p className="disco-card__meta">
          {[disco.anno, disco.genere].filter(Boolean).join(' · ') || '—'}
        </p>
        <div className="disco-card__piede">
          <span className="prezzo">{formattaEuro(disco.prezzoVendita)}</span>
          {extra}
        </div>

        {/* questi campi esistono solo se il server li ha mandati */}
        {admin && (
          <div className="riservato" title="Campi inviati dal server solo all'amministratore">
            <span className="riservato__etichetta">riservato</span>
            <span>
              acq.{' '}
              <DecryptedText text={formattaEuro(disco.prezzoAcquisto)} animateOn="view" sequential speed={35} className="riservato__valore" encryptedClassName="riservato__cifrato" />
            </span>
            <span>
              {m == null ? '' : (
                <DecryptedText text={`+${m.toFixed(0)}%`} animateOn="view" sequential speed={35} className="riservato__valore" encryptedClassName="riservato__cifrato" />
              )}
            </span>
            <span className="riservato__fornitore">
              <DecryptedText text={disco.fornitore ?? '—'} animateOn="view" speed={30} maxIterations={14} className="riservato__valore" encryptedClassName="riservato__cifrato" />
            </span>
          </div>
        )}
      </div>
    </SpotlightCard>
  )
}
