import { useState } from 'react'
import { coloreDa } from '../three/textures'

interface Props {
  url: string | null
  titolo: string
  artista: string
  className?: string
}

/** Copertina con ripiego grafico se l'immagine manca o non si carica. */
export default function Copertina({ url, titolo, artista, className = '' }: Props) {
  const [rotta, setRotta] = useState(false)

  if (!url || rotta) {
    const colore = coloreDa(titolo + artista)
    return (
      <div
        className={`copertina copertina--vuota ${className}`}
        style={{ '--c': colore } as React.CSSProperties}
        aria-label={`${titolo} di ${artista}`}
      >
        <span className="copertina__titolo">{titolo}</span>
        <span className="copertina__artista">{artista}</span>
      </div>
    )
  }

  return (
    <img
      className={`copertina ${className}`}
      src={url}
      alt={`Copertina di ${titolo} di ${artista}`}
      loading="lazy"
      onError={() => setRotta(true)}
    />
  )
}
