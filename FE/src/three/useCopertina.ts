import { useEffect, useState } from 'react'
import type * as THREE from 'three'
import { textureCopertina, textureSegnaposto } from './textures'

/** Restituisce subito un segnaposto e lo sostituisce con la copertina appena pronta. */
export function useCopertina(
  tipo: 'etichetta' | 'busta',
  url: string | null,
  titolo: string,
  artista: string,
): THREE.Texture {
  const [tex, setTex] = useState<THREE.Texture>(() => textureSegnaposto(tipo, titolo, artista))

  useEffect(() => {
    let vivo = true
    textureCopertina(tipo, url, titolo, artista).then((t) => {
      if (vivo) setTex(t)
    })
    return () => {
      vivo = false
    }
  }, [tipo, url, titolo, artista])

  return tex
}
