import { useState } from 'react'
import { motion } from 'motion/react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import GradientText from '../components/reactbits/GradientText'
import Magnet from '../components/reactbits/Magnet'
import { useAuth, useToast } from '../context/contexts'

interface Props {
  modo: 'login' | 'registrazione'
}

const DEMO = [
  { etichetta: 'Admin', email: 'admin@vetrina.it', password: 'admin1234' },
  { etichetta: 'Utente Anna', email: 'anna@test.it', password: 'password1' },
  { etichetta: 'Utente Bruno', email: 'bruno@test.it', password: 'password1' },
]

export default function AuthPage({ modo }: Props) {
  const { utente, login, registrazione } = useAuth()
  const { mostra } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const da = (location.state as { da?: string } | null)?.da ?? '/'

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errori, setErrori] = useState<Record<string, string>>({})
  const [messaggio, setMessaggio] = useState<string | null>(null)
  const [invio, setInvio] = useState(false)
  // dopo un login riuscito naviga invia(): il redirect qui sotto vale solo per chi arriva gia' collegato
  const [appenaEntrato, setAppenaEntrato] = useState(false)

  if (utente && !appenaEntrato) return <Navigate to={da} replace />

  const invia = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvio(true)
    setErrori({})
    setMessaggio(null)
    setAppenaEntrato(true)
    try {
      const u =
        modo === 'login' ? await login(email, password) : await registrazione(nome, email, password)
      mostra(`Ciao ${u.nome}!`, 'ok')
      navigate(u.ruolo === 'ADMIN' && da === '/' ? '/admin' : da, { replace: true })
    } catch (err) {
      setAppenaEntrato(false)
      if (err instanceof ApiError) {
        setMessaggio(err.messaggio)
        if (err.campi) setErrori(err.campi)
      }
    } finally {
      setInvio(false)
    }
  }

  const login_ = modo === 'login'

  return (
    <div className="pagina accesso">
      <motion.div className="accesso__carta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="accesso__lato">
          <div className="accesso__giradischi" aria-hidden>
            <div className="accesso__vinile" />
            <div className="accesso__braccio" />
          </div>
          <GradientText colors={['#ff5b1f', '#ffb347', '#f2e8d5', '#ff5b1f']} animationSpeed={5} className="accesso__motto">
            {login_ ? 'Bentornato' : 'Benvenuto'}
          </GradientText>
          <p>
            {login_
              ? 'Accedi per ritrovare la tua cassa di preferiti.'
              : 'Un account ti dà una cassa di preferiti tutta tua. Il ruolo è sempre utente: l’amministratore non si crea da qui.'}
          </p>
        </div>

        <form className="accesso__form" onSubmit={invia} noValidate>
          <h1>{login_ ? 'Accedi' : 'Crea un account'}</h1>

          {!login_ && (
            <label className={`campo ${errori.nome ? 'campo--errore' : ''}`}>
              <span>Nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" required />
              {errori.nome && <small>{errori.nome}</small>}
            </label>
          )}
          <label className={`campo ${errori.email ? 'campo--errore' : ''}`}>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            {errori.email && <small>{errori.email}</small>}
          </label>
          <label className={`campo ${errori.password ? 'campo--errore' : ''}`}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={login_ ? 'current-password' : 'new-password'}
              minLength={login_ ? undefined : 8}
              required
            />
            {errori.password && <small>{errori.password}</small>}
          </label>

          {messaggio && <p className="avviso avviso--errore">{messaggio}</p>}

          <Magnet padding={40} magnetStrength={6} wrapperClassName="accesso__magnete">
            <button type="submit" className="bottone bottone--pieno bottone--largo" disabled={invio}>
              {invio ? 'Un attimo…' : login_ ? 'Entra' : 'Registrati'}
            </button>
          </Magnet>

          <p className="accesso__cambio">
            {login_ ? (
              <>Non hai un account? <Link to="/registrazione" state={location.state}>Registrati</Link></>
            ) : (
              <>Hai già un account? <Link to="/login" state={location.state}>Accedi</Link></>
            )}
          </p>

          {login_ && (
            <div className="demo">
              <span className="demo__titolo">Account di prova</span>
              <div className="demo__pulsanti">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setEmail(d.email)
                      setPassword(d.password)
                    }}
                  >
                    {d.etichetta}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  )
}
