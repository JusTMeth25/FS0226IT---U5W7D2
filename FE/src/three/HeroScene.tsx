import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Studio } from './Studio'
import { useCopertina } from './useCopertina'
import { VinylRecord, type VinylInfo } from './VinylRecord'

interface Props {
  dischi: VinylInfo[]
  indice: number
  /** true = disco fuori dalla busta, false = rientrato (in attesa del cambio). */
  fuori: boolean
  onClick?: () => void
}

const LATO = 3.2

function Busta({ disco, onClick }: { disco: VinylInfo; onClick?: () => void }) {
  const tex = useCopertina('busta', disco.copertinaUrl, disco.titolo, disco.artista)
  const ref = useRef<THREE.Group>(null)
  const giro = useRef(0)
  const ultimo = useRef(disco.titolo)

  // a ogni cambio di disco la busta fa un giro completo
  useEffect(() => {
    if (ultimo.current !== disco.titolo) {
      giro.current += Math.PI * 2
      ultimo.current = disco.titolo
    }
  }, [disco.titolo])

  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, giro.current, 4, dt)
  })

  return (
    <group ref={ref}>
      <mesh
        castShadow
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <boxGeometry args={[LATO, LATO, 0.05]} />
        <meshStandardMaterial attach="material-0" color="#1a1411" />
        <meshStandardMaterial attach="material-1" color="#1a1411" />
        <meshStandardMaterial attach="material-2" color="#1a1411" />
        <meshStandardMaterial attach="material-3" color="#1a1411" />
        <meshStandardMaterial attach="material-4" map={tex} roughness={0.7} />
        <meshStandardMaterial attach="material-5" color="#231c18" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Protagonista({ dischi, indice, fuori, onClick }: Props) {
  const scena = useRef<THREE.Group>(null)
  const carrello = useRef<THREE.Group>(null)
  const disco = useRef<THREE.Group>(null)
  const corrente = dischi[indice % dischi.length]

  useFrame((state, dt) => {
    if (scena.current) {
      // parallasse col mouse
      scena.current.rotation.y = THREE.MathUtils.damp(scena.current.rotation.y, -0.38 + state.pointer.x * 0.22, 3, dt)
      scena.current.rotation.x = THREE.MathUtils.damp(scena.current.rotation.x, -state.pointer.y * 0.12, 3, dt)
    }
    if (carrello.current) {
      carrello.current.position.x = THREE.MathUtils.damp(carrello.current.position.x, fuori ? 1.3 : -0.6, fuori ? 2.2 : 5, dt)
    }
    if (disco.current) {
      disco.current.rotation.y -= dt * (fuori ? 1.2 : 0.2)
    }
  })

  return (
    <group ref={scena} position={[0.2, 0, 0]}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
        {/* il disco sta dietro la busta e scivola fuori a destra */}
        <group ref={carrello} position={[-0.6, 0, -0.07]}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <VinylRecord ref={disco} disco={corrente} />
          </group>
        </group>
        <group position={[-0.6, 0, 0]}>
          <Busta disco={corrente} onClick={onClick} />
        </group>
      </Float>
    </group>
  )
}

/** Dischi piccoli che fluttuano sullo sfondo con le altre copertine. */
function Sciame({ dischi }: { dischi: VinylInfo[] }) {
  const posizioni = useMemo(
    () =>
      dischi.slice(0, 6).map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        return {
          pos: [Math.cos(a) * 4.6 + 1, Math.sin(a) * 2.4, -4 - (i % 3)] as [number, number, number],
          rot: [Math.PI / 2 + Math.sin(i) * 0.6, 0, Math.cos(i) * 0.5] as [number, number, number],
          scala: 0.35 + (i % 3) * 0.12,
        }
      }),
    [dischi],
  )
  const refs = useRef<(THREE.Group | null)[]>([])

  useFrame((_, dt) => {
    refs.current.forEach((g, i) => {
      if (g) g.rotation.y += dt * (0.3 + i * 0.07)
    })
  })

  return (
    <>
      {posizioni.map((p, i) => (
        <Float key={i} speed={1 + i * 0.2} floatIntensity={1.2} rotationIntensity={0.6}>
          <group position={p.pos} rotation={p.rot} scale={p.scala}>
            <VinylRecord
              ref={(g) => {
                refs.current[i] = g
              }}
              disco={dischi[i]}
            />
          </group>
        </Float>
      ))}
    </>
  )
}

export default function HeroScene(props: Props) {
  if (props.dischi.length === 0) return null
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <Suspense fallback={null}>
        <Studio />
        <Sciame dischi={props.dischi} />
        <Protagonista {...props} />
      </Suspense>
    </Canvas>
  )
}
