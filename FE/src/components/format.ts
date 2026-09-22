const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export const formattaEuro = (n: number | null | undefined) => (n == null ? '—' : euro.format(n))

export function margine(vendita: number, acquisto: number | null): number | null {
  if (acquisto == null || vendita <= 0) return null
  return ((vendita - acquisto) / vendita) * 100
}

export function formattaData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}
