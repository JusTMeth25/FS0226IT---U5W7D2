import { Environment, Lightformer } from '@react-three/drei'

/**
 * Luci da studio fotografico generate in locale (niente HDR scaricati):
 * sono loro a disegnare i riflessi sulla vernice lucida del vinile.
 */
export function Studio({ calda = '#ffb347' }: { calda?: string }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} castShadow />
      <pointLight position={[-4, 2, 3]} intensity={18} color={calda} distance={14} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -2]} scale={[10, 1.2, 1]} />
        <Lightformer form="rect" intensity={2} color={calda} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ff5b1f" position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 1, 1]} />
        <Lightformer form="ring" intensity={2.5} position={[0, 2, 6]} scale={3} />
      </Environment>
    </>
  )
}
