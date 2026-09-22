import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { Studio } from './Studio'
import { VinylRecord, type VinylInfo } from './VinylRecord'

interface Props {
  disco: VinylInfo
  inRiproduzione: boolean
  giri: 33 | 45
}

const ALTEZZA_PIATTO = 0.36
const PERNO: [number, number, number] = [2.05, 0.52, -1.35]
const ANGOLO_RIPOSO = 0.12
const ANGOLO_INIZIO = -0.4
const ANGOLO_FINE = -0.52

function Giradischi({ disco, inRiproduzione, giri }: Props) {
  const piatto = useRef<THREE.Group>(null)
  const braccio = useRef<THREE.Group>(null)
  const alzata = useRef<THREE.Group>(null)
  const velocita = useRef(0)
  const avanzamento = useRef(0)

  useFrame((_, dt) => {
    // il piatto accelera e frena come un motore vero, non parte a scatto
    const obiettivo = inRiproduzione ? (giri * Math.PI * 2) / 60 : 0
    velocita.current = THREE.MathUtils.damp(velocita.current, obiettivo, inRiproduzione ? 1.6 : 0.9, dt)
    if (piatto.current) piatto.current.rotation.y -= velocita.current * dt

    // la puntina avanza lentamente verso il centro mentre suona
    if (inRiproduzione) avanzamento.current = Math.min(1, avanzamento.current + dt / 240)
    const angolo = inRiproduzione
      ? THREE.MathUtils.lerp(ANGOLO_INIZIO, ANGOLO_FINE, avanzamento.current)
      : ANGOLO_RIPOSO
    if (braccio.current) {
      braccio.current.rotation.y = THREE.MathUtils.damp(braccio.current.rotation.y, angolo, 2.2, dt)
    }
    if (alzata.current) {
      // prima si sposta, poi si abbassa sul disco
      const sopraDisco = braccio.current ? braccio.current.rotation.y < ANGOLO_INIZIO + 0.06 : false
      const inclinazione = inRiproduzione && sopraDisco ? 0.084 : -0.03
      alzata.current.rotation.x = THREE.MathUtils.damp(alzata.current.rotation.x, inclinazione, 5, dt)
    }
  })

  return (
    <group position={[-0.35, -0.55, 0]}>
      {/* base */}
      <RoundedBox args={[5.2, 0.34, 4.1]} radius={0.08} smoothness={4} position={[0.3, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#7a4a2a" roughness={0.42} clearcoat={0.7} clearcoatRoughness={0.2} />
      </RoundedBox>
      <mesh position={[0.3, 0.172, 0]} receiveShadow>
        <boxGeometry args={[5.05, 0.01, 3.95]} />
        <meshStandardMaterial color="#231a15" roughness={0.55} metalness={0.25} />
      </mesh>

      {/* piatto */}
      <group ref={piatto} position={[0, ALTEZZA_PIATTO - 0.08, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.62, 1.62, 0.1, 128]} />
          <meshStandardMaterial color="#b9b3aa" metalness={0.95} roughness={0.25} />
        </mesh>
        {/* strobo sul bordo */}
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i / 72) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 1.625, 0, Math.sin(a) * 1.625]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.012, 0.06, 0.03]} />
              <meshStandardMaterial color="#3d3833" metalness={0.6} roughness={0.4} />
            </mesh>
          )
        })}
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[1.56, 1.56, 0.01, 96]} />
          <meshStandardMaterial color="#141414" roughness={0.95} />
        </mesh>
        <group position={[0, 0.072, 0]}>
          <VinylRecord disco={disco} />
        </group>
        {/* perno centrale */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.14, 24]} />
          <meshStandardMaterial color="#d8d2c8" metalness={1} roughness={0.15} />
        </mesh>
      </group>

      {/* braccio */}
      <group position={PERNO}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.2, 48]} />
          <meshStandardMaterial color="#c9c3b9" metalness={0.9} roughness={0.2} />
        </mesh>
        <group ref={braccio} rotation={[0, ANGOLO_RIPOSO, 0]}>
          <group ref={alzata} position={[0, 0.14, 0]}>
            {/* contrappeso */}
            <mesh position={[0, 0, -0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.13, 0.22, 32]} />
              <meshStandardMaterial color="#2a2522" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* asta */}
            <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.028, 0.028, 2.3, 16]} />
              <meshStandardMaterial color="#e4ded4" metalness={1} roughness={0.12} />
            </mesh>
            {/* testina */}
            <group position={[0, -0.03, 2.2]} rotation={[0, 0.35, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.16, 0.05, 0.34]} />
                <meshStandardMaterial color="#1b1b1b" metalness={0.4} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.05, 0.06]}>
                <boxGeometry args={[0.1, 0.06, 0.12]} />
                <meshStandardMaterial color="#ff5b1f" roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* spia e manopola dei giri */}
      <mesh position={[-2.05, 0.2, 1.65]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
        <meshStandardMaterial
          color={inRiproduzione ? '#ff5b1f' : '#3a2a20'}
          emissive={inRiproduzione ? '#ff5b1f' : '#000000'}
          emissiveIntensity={inRiproduzione ? 3 : 0}
        />
      </mesh>
      <mesh position={[-1.6, 0.21, 1.65]}>
        <cylinderGeometry args={[0.16, 0.18, 0.08, 40]} />
        <meshStandardMaterial color="#c9c3b9" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  )
}

export default function TurntableScene(props: Props) {
  return (
    <Canvas
      className="turntable-canvas"
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [3.6, 4.4, 5.6], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Studio />
        <ambientLight intensity={0.45} />
        <spotLight position={[0, 7, 2]} angle={0.5} penumbra={0.8} intensity={60} color="#fff1dc" castShadow />
        <Giradischi {...props} />
        <ContactShadows position={[0, -0.74, 0]} opacity={0.55} scale={12} blur={2.6} far={3} />
        <OrbitControls
          enablePan={false}
          minDistance={4.5}
          maxDistance={10}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, -0.2, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
