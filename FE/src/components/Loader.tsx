export default function Loader({ testo = 'Metto su il disco…' }: { testo?: string }) {
  return (
    <div className="loader" role="status">
      <div className="loader__vinile" aria-hidden />
      <span>{testo}</span>
    </div>
  )
}
