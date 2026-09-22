import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, usePreferiti } from '../context/contexts'
import GradientText from './reactbits/GradientText'
import StarBorder from './reactbits/StarBorder'

const ETICHETTA_LIVELLO = { OSPITE: 'Ospite', UTENTE: 'Utente', ADMIN: 'Admin' } as const

export default function Navbar() {
  const { utente, livello, logout } = useAuth()
  const { preferiti } = usePreferiti()
  const navigate = useNavigate()
  const [aperto, setAperto] = useState(false)
  const [scorsa, setScorsa] = useState(false)

  useEffect(() => {
    const onScroll = () => setScorsa(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const esci = () => {
    logout()
    navigate('/')
  }

  const links = (
    <>
      <NavLink to="/" end className="nav__link">Vetrina</NavLink>
      {utente && (
        <NavLink to="/preferiti" className="nav__link">
          La tua cassa
          {preferiti.length > 0 && <span className="nav__conta">{preferiti.length}</span>}
        </NavLink>
      )}
      {utente?.ruolo === 'ADMIN' && <NavLink to="/admin" className="nav__link">Regia</NavLink>}
    </>
  )

  return (
    <header className={`nav ${scorsa ? 'nav--scorsa' : ''}`}>
      <div className="nav__interno">
        <Link to="/" className="nav__logo" aria-label="Solco, torna alla vetrina">
          <span className="nav__logo-disco" aria-hidden />
          <GradientText colors={['#ff5b1f', '#ffb347', '#f2e8d5', '#ff5b1f']} animationSpeed={6} className="nav__logo-testo">
            Solco
          </GradientText>
        </Link>

        <nav className="nav__links" aria-label="Principale">{links}</nav>

        <div className="nav__destra">
          <span className={`pill pill--${livello.toLowerCase()}`} title="Il livello con cui il server ti riconosce">
            <span className="pill__punto" />
            {ETICHETTA_LIVELLO[livello]}
          </span>
          {utente ? (
            <>
              <span className="nav__nome">{utente.nome}</span>
              <button type="button" className="bottone bottone--fantasma" onClick={esci}>Esci</button>
            </>
          ) : (
            <StarBorder as={Link} to="/login" className="nav__accedi" color="#ffb347" speed="5s">
              Accedi
            </StarBorder>
          )}
          <button
            type="button"
            className="nav__hamburger"
            aria-expanded={aperto}
            aria-label="Menu"
            onClick={() => setAperto((a) => !a)}
          >
            <span /><span />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {aperto && (
          <motion.nav
            className="nav__mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            aria-label="Mobile"
            onClick={() => setAperto(false)}
          >
            {links}
            {utente && <span className="nav__mobile-nome">Collegato come {utente.nome}</span>}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
