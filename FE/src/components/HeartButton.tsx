import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth, usePreferiti, useToast } from '../context/contexts'

interface Props {
  discoId: number
  grande?: boolean
}

export default function HeartButton({ discoId, grande = false }: Props) {
  const { utente } = useAuth()
  const { perDisco, toggle } = usePreferiti()
  const { mostra } = useToast()
  const navigate = useNavigate()
  const attivo = perDisco.has(discoId)

  const click = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!utente) {
      mostra('Accedi per mettere dischi nella tua cassa', 'info')
      navigate('/login', { state: { da: window.location.pathname } })
      return
    }
    void toggle(discoId)
  }

  return (
    <motion.button
      type="button"
      className={`cuore ${attivo ? 'cuore--attivo' : ''} ${grande ? 'cuore--grande' : ''}`}
      onClick={click}
      whileTap={{ scale: 0.8 }}
      aria-pressed={attivo}
      aria-label={attivo ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
      title={attivo ? 'Togli dalla tua cassa' : 'Metti nella tua cassa'}
    >
      <motion.svg
        viewBox="0 0 24 24"
        width={grande ? 22 : 18}
        height={grande ? 22 : 18}
        animate={attivo ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.5 1.1 4.8 2.8C13.3 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"
          fill={attivo ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </motion.svg>
      {grande && <span>{attivo ? 'Nella tua cassa' : 'Metti nella cassa'}</span>}
    </motion.button>
  )
}
