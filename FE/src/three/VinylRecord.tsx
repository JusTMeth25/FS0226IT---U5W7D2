import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { grooveTexture } from './textures'
import { useCopertina } from './useCopertina'

export interface VinylInfo {
  titolo: string
  artista: string
  copertinaUrl: string | null
}

interface Props {
  disco: VinylInfo
  /** Il gruppo ruota sull'asse Y locale: chi usa il disco lo fa girare dal suo useFrame. */
  raggio?: number
}

const SPESSORE = 0.022

/** Disco in vinile steso sul piano XZ, faccia verso +Y. */
export const VinylRecord = forwardRef<THREE.Group, Props>(function VinylRecord(
  { disco, raggio = 1.5 },
  ref,
) {
  const etichetta = useCopertina('etichetta', disco.copertinaUrl, disco.titolo, disco.artista)
  const solchi = grooveTexture()

  const [bordo, faccia] = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: '#080808', roughness: 0.35, metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({
        map: solchi,
        color: '#ffffff',
        roughness: 0.32,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        sheen: 0.4,
        sheenColor: new THREE.Color('#6b5a4a'),
      }),
    ],
    [solchi],
  )

  const materiali = useMemo(() => [bordo, faccia, faccia], [bordo, faccia])

  return (
    <group ref={ref}>
      <mesh material={materiali} castShadow receiveShadow>
        <cylinderGeometry args={[raggio, raggio, SPESSORE, 160, 1]} />
      </mesh>
      {/* etichetta sopra e sotto */}
      <mesh position={[0, SPESSORE / 2 + 0.0008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[raggio * 0.34, 96]} />
        <meshStandardMaterial map={etichetta} roughness={0.75} />
      </mesh>
      <mesh position={[0, -SPESSORE / 2 - 0.0008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[raggio * 0.34, 96]} />
        <meshStandardMaterial map={etichetta} roughness={0.75} />
      </mesh>
    </group>
  )
})
