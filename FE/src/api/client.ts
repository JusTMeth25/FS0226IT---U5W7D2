import type {
  AuthResponse,
  Disco,
  DiscoAdmin,
  DiscoRequest,
  ErroreApi,
  Preferito,
  Utente,
} from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'solco.token'

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* storage non disponibile: il token vive solo in memoria */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* niente da fare */
    }
  },
}

export class ApiError extends Error implements ErroreApi {
  status: number
  messaggio: string
  campi?: Record<string, string>

  constructor(status: number, messaggio: string, campi?: Record<string, string>) {
    super(messaggio)
    this.status = status
    this.messaggio = messaggio
    this.campi = campi
  }
}

/** Chiamato quando il server risponde 401 con un token: sessione scaduta. */
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn
}

const MESSAGGI_DEFAULT: Record<number, string> = {
  401: 'Serve un accesso per questa operazione',
  403: 'Operazione riservata all’amministratore',
  404: 'Non trovato',
  409: 'Conflitto con i dati esistenti',
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      0,
      import.meta.env.MODE === 'pages'
        ? 'Il server non risponde: si sta ancora svegliando oppure è in manutenzione. Riprova tra qualche secondo.'
        : 'Server non raggiungibile. Il backend è acceso?',
    )
  }

  if (res.status === 401 && token) onUnauthorized?.()

  if (!res.ok) {
    let corpo: Partial<ErroreApi> = {}
    try {
      corpo = await res.json()
    } catch {
      /* 401/403 dalla catena dei filtri arrivano senza body */
    }
    throw new ApiError(
      res.status,
      corpo.messaggio ?? MESSAGGI_DEFAULT[res.status] ?? `Errore ${res.status}`,
      corpo.campi,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: json({ email, password }) }),
    registrazione: (nome: string, email: string, password: string) =>
      request<AuthResponse>('/api/auth/registrazione', {
        method: 'POST',
        body: json({ nome, email, password }),
      }),
    me: () => request<Utente>('/api/auth/me'),
  },
  dischi: {
    elenco: () => request<Disco[]>('/api/dischi'),
    dettaglio: (id: number) => request<Disco>(`/api/dischi/${id}`),
    crea: (d: DiscoRequest) =>
      request<DiscoAdmin>('/api/dischi', { method: 'POST', body: json(d) }),
    aggiorna: (id: number, d: DiscoRequest) =>
      request<DiscoAdmin>(`/api/dischi/${id}`, { method: 'PUT', body: json(d) }),
    pubblicazione: (id: number, pubblicato: boolean) =>
      request<DiscoAdmin>(`/api/dischi/${id}/pubblicazione?pubblicato=${pubblicato}`, {
        method: 'PATCH',
      }),
    elimina: (id: number) => request<void>(`/api/dischi/${id}`, { method: 'DELETE' }),
  },
  preferiti: {
    elenco: () => request<Preferito[]>('/api/preferiti'),
    aggiungi: (discoId: number) =>
      request<Preferito>('/api/preferiti', { method: 'POST', body: json({ discoId }) }),
    rimuovi: (id: number) => request<void>(`/api/preferiti/${id}`, { method: 'DELETE' }),
  },
}
