import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/contexts'
import Loader from './Loader'

/**
 * Le guardie del frontend servono solo all'esperienza d'uso (non mostrare un form inutile).
 * La protezione vera e' sul server: anche aggirandole, le API rispondono 401/403.
 */
export function RichiedeAccesso({ children }: { children: ReactNode }) {
  const { utente, pronto } = useAuth()
  const location = useLocation()
  if (!pronto) return <Loader />
  if (!utente) return <Navigate to="/login" replace state={{ da: location.pathname }} />
  return <>{children}</>
}

export function RichiedeAdmin({ children }: { children: ReactNode }) {
  const { utente, pronto } = useAuth()
  const location = useLocation()
  if (!pronto) return <Loader />
  if (!utente) return <Navigate to="/login" replace state={{ da: location.pathname }} />
  if (utente.ruolo !== 'ADMIN') {
    return (
      <div className="pagina pagina--stretta vuoto">
        <div className="vuoto__lucchetto" aria-hidden>403</div>
        <h1>La regia è per l’amministratore</h1>
        <p>
          Anche se questa pagina si aprisse, il server rifiuterebbe ogni modifica:
          le operazioni sui dischi hanno <code>@PreAuthorize("hasRole('ADMIN')")</code>.
        </p>
        <Link className="bottone" to="/">Torna alla vetrina</Link>
      </div>
    )
  }
  return <>{children}</>
}
