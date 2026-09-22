import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="pagina pagina--stretta vuoto">
      <div className="vuoto__lucchetto vuoto__lucchetto--gira" aria-hidden>404</div>
      <h1>Il solco è finito</h1>
      <p>La puntina è arrivata al centro del disco: qui non c’è altro da ascoltare.</p>
      <Link className="bottone bottone--pieno" to="/">Torna alla vetrina</Link>
    </div>
  )
}
