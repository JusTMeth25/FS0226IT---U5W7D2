import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setOnUnauthorized, tokenStore } from '../api/client'
import type { Utente } from '../api/types'
import { AuthContext, type AuthState, type LivelloAccesso } from './contexts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null)
  // senza token non c'e' niente da verificare: si parte subito come ospite
  const [pronto, setPronto] = useState(() => !tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.clear()
    setUtente(null)
  }, [])

  // Il ruolo si chiede sempre al server: un token nel browser non basta a dire chi sei.
  useEffect(() => {
    setOnUnauthorized(logout)
    if (!tokenStore.get()) return () => setOnUnauthorized(null)
    api.auth
      .me()
      .then(setUtente)
      .catch(() => tokenStore.clear())
      .finally(() => setPronto(true))
    return () => setOnUnauthorized(null)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    tokenStore.set(res.token)
    setUtente(res.utente)
    return res.utente
  }, [])

  const registrazione = useCallback(async (nome: string, email: string, password: string) => {
    const res = await api.auth.registrazione(nome, email, password)
    tokenStore.set(res.token)
    setUtente(res.utente)
    return res.utente
  }, [])

  const livello: LivelloAccesso = !utente ? 'OSPITE' : utente.ruolo === 'ADMIN' ? 'ADMIN' : 'UTENTE'

  const value = useMemo<AuthState>(
    () => ({ utente, pronto, livello, login, registrazione, logout }),
    [utente, pronto, livello, login, registrazione, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
