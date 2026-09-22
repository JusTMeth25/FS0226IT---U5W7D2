// sul sito pubblico il server gratuito si addormenta: la prima risposta puo' tardare
const TESTO =
  import.meta.env.MODE === 'pages'
    ? 'Metto su il disco… se il server dormiva può servire fino a un minuto'
    : 'Metto su il disco…'

export default function Loader({ testo = TESTO }: { testo?: string }) {
  return (
    <div className="loader" role="status">
      <div className="loader__vinile" aria-hidden />
      <span>{testo}</span>
    </div>
  )
}
