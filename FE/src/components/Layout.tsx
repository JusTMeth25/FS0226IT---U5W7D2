import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import ClickSpark from './reactbits/ClickSpark'
import LightRays from './reactbits/LightRays'
import Noise from './reactbits/Noise'
import Navbar from './Navbar'

export default function Layout() {
  const location = useLocation()

  return (
    <ClickSpark sparkColor="#ffb347" sparkSize={9} sparkRadius={18} sparkCount={9} duration={420}>
      <div className="sfondo" aria-hidden>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffb070"
          raysSpeed={0.6}
          lightSpread={0.9}
          rayLength={1.4}
          fadeDistance={1.1}
          followMouse
          mouseInfluence={0.08}
          noiseAmount={0.08}
          distortion={0.04}
        />
      </div>
      <div className="grana" aria-hidden>
        <Noise patternRefreshInterval={4} patternAlpha={10} />
      </div>

      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="contenuto"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <footer className="piede">
        <span>Solco · U5W7D2</span>
        <span>
          Tre livelli di protezione: <em>filtri</em>, <em>@PreAuthorize</em>, <em>query per proprietario</em>.
        </span>
      </footer>
    </ClickSpark>
  )
}
