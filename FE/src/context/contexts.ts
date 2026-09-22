import { createContext, useContext } from 'react'
import type { Preferito, Utente } from '../api/types'

// ---------- Auth ----------

export type LivelloAccesso = 'OSPITE' | 'UTENTE' | 'ADMIN'

export interface AuthState {
  utente: Utente | null
  pronto: boolean
  livello: LivelloAccesso
  login: (email: string, password: string) => Promise<Utente>
  registrazione: (nome: string, email: string, password: string) => Promise<Utente>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>')
  return ctx
}

// ---------- Preferiti ----------

export interface PreferitiState {
  preferiti: Preferito[]
  caricamento: boolean
  /** discoId -> id del preferito, per sapere se un disco e' gia' salvato. */
  perDisco: Map<number, number>
  toggle: (discoId: number) => Promise<void>
  rimuovi: (preferitoId: number) => Promise<void>
  ricarica: () => Promise<void>
}

export const PreferitiContext = createContext<PreferitiState | null>(null)

export function usePreferiti(): PreferitiState {
  const ctx = useContext(PreferitiContext)
  if (!ctx) throw new Error('usePreferiti va usato dentro <PreferitiProvider>')
  return ctx
}

// ---------- Toast ----------

export type ToastTipo = 'ok' | 'errore' | 'info'

export interface ToastState {
  mostra: (messaggio: string, tipo?: ToastTipo) => void
}

export const ToastContext = createContext<ToastState | null>(null)

export function useToast(): ToastState {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast va usato dentro <ToastProvider>')
  return ctx
}
