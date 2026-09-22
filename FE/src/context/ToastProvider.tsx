import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ToastContext, type ToastTipo } from './contexts'

interface Toast {
  id: number
  messaggio: string
  tipo: ToastTipo
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const mostra = useCallback((messaggio: string, tipo: ToastTipo = 'info') => {
    const id = nextId.current++
    setToasts((ts) => [...ts.slice(-2), { id, messaggio, tipo }])
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3600)
  }, [])

  const value = useMemo(() => ({ mostra }), [mostra])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast toast--${t.tipo}`}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <span className="toast__dot" />
              {t.messaggio}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
