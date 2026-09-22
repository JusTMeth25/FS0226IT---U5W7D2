// Tipi speculari ai DTO del backend.

export type Ruolo = 'USER' | 'ADMIN'

export interface Utente {
  id: number
  nome: string
  email: string
  ruolo: Ruolo
}

export interface AuthResponse {
  token: string
  tipo: string
  utente: Utente
}

/** Vista pubblica: la ricevono visitatori e utenti. */
export interface DiscoPubblico {
  id: number
  titolo: string
  artista: string
  genere: string | null
  anno: number | null
  descrizione: string | null
  copertinaUrl: string | null
  prezzoVendita: number
  anteprimaUrl: string | null
  anteprimaBrano: string | null
  anteprimaLink: string | null
}

/** Vista completa: il server la manda solo all'amministratore. */
export interface DiscoAdmin extends DiscoPubblico {
  prezzoAcquisto: number | null
  fornitore: string | null
  pubblicato: boolean
  creatoIl: string
}

export type Disco = DiscoPubblico | DiscoAdmin

/**
 * Il frontend non decide chi vede cosa: si limita a mostrare
 * i campi riservati se il server li ha inclusi nella risposta.
 */
export function isDiscoAdmin(d: Disco): d is DiscoAdmin {
  return 'pubblicato' in d
}

export interface DiscoRequest {
  titolo: string
  artista: string
  genere: string | null
  anno: number | null
  descrizione: string | null
  copertinaUrl: string | null
  prezzoVendita: number
  anteprimaUrl: string | null
  anteprimaBrano: string | null
  anteprimaLink: string | null
  prezzoAcquisto: number | null
  fornitore: string | null
  pubblicato: boolean
}

export interface Preferito {
  id: number
  aggiuntoIl: string
  disco: DiscoPubblico
}

export interface ErroreApi {
  status: number
  messaggio: string
  campi?: Record<string, string>
}
