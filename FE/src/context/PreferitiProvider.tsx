import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { Preferito } from '../api/types'
import { PreferitiContext, useAuth, useToast, type PreferitiState } from './contexts'

interface Stato {
  /** Id dell'utente a cui appartiene la lista caricata. */
  per: number | null
  lista: Preferito[]
}

export function PreferitiProvider({ children }: { children: ReactNode }) {
  const { utente } = useAuth()
  const { mostra } = useToast()
  const [stato, setStato] = useState<Stato>({ per: null, lista: [] })

  const scarica = useCallback(
    (utenteId: number, vivo: () => boolean = () => true) =>
      api.preferiti
        .elenco()
        .then((lista) => vivo() && setStato({ per: utenteId, lista }))
        .catch((e) => {
          if (!vivo()) return
          setStato({ per: utenteId, lista: [] })
          if (e instanceof ApiError) mostra(e.messaggio, 'errore')
        }),
    [mostra],
  )

  useEffect(() => {
    if (!utente) return
    let attivo = true
    void scarica(utente.id, () => attivo)
    return () => {
      attivo = false
    }
  }, [utente, scarica])

  // La lista vale solo per l'utente che l'ha caricata: dopo un logout sparisce subito.
  const mia = utente != null && stato.per === utente.id
  const preferiti = useMemo(() => (mia ? stato.lista : []), [mia, stato.lista])
  const caricamento = utente != null && !mia

  const ricarica = useCallback(async () => {
    if (utente) await scarica(utente.id)
  }, [utente, scarica])

  const perDisco = useMemo(
    () => new Map(preferiti.map((p) => [p.disco.id, p.id])),
    [preferiti],
  )

  const setLista = (fn: (l: Preferito[]) => Preferito[]) =>
    setStato((s) => ({ ...s, lista: fn(s.lista) }))

  const rimuovi = useCallback(
    async (preferitoId: number) => {
      const prima = preferiti
      setLista((l) => l.filter((p) => p.id !== preferitoId))
      try {
        await api.preferiti.rimuovi(preferitoId)
      } catch (e) {
        setLista(() => prima)
        if (e instanceof ApiError) mostra(e.messaggio, 'errore')
      }
    },
    [preferiti, mostra],
  )

  const toggle = useCallback(
    async (discoId: number) => {
      const esistente = perDisco.get(discoId)
      if (esistente !== undefined) {
        await rimuovi(esistente)
        mostra('Tolto dalla tua cassa', 'info')
        return
      }
      try {
        const nuovo = await api.preferiti.aggiungi(discoId)
        setLista((l) => [nuovo, ...l])
        mostra(`«${nuovo.disco.titolo}» è nella tua cassa`, 'ok')
      } catch (e) {
        if (e instanceof ApiError) mostra(e.messaggio, 'errore')
      }
    },
    [perDisco, rimuovi, mostra],
  )

  const value = useMemo<PreferitiState>(
    () => ({ preferiti, caricamento, perDisco, toggle, rimuovi, ricarica }),
    [preferiti, caricamento, perDisco, toggle, rimuovi, ricarica],
  )

  return <PreferitiContext.Provider value={value}>{children}</PreferitiContext.Provider>
}
