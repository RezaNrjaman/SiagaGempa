/* Nilai warna untuk konsumen yang butuh hex/string: Recharts, Leaflet, style inline. */
export const PALETTE = {
  brand950: '#141a40',
  brand900: '#1f2960',
  brand700: '#4338ca',
  brand500: '#6366f1',
  brand300: '#a5b4fc',
  text1: '#1e293b',
  text2: '#64748b',
  ok: '#059669',
  warn: '#d97706',
  danger: '#dc2626',
  grid: 'rgba(30, 41, 89, 0.1)',
  surface: '#f4f7ff',
}

/* Kelas magnitudo -> warna (PRD OPS-03). M < 5 biru muda, 5-5.9 kuning, >= 6 merah. */
export function magColor(magnitude) {
  if (magnitude >= 6) return PALETTE.danger
  if (magnitude >= 5) return PALETTE.warn
  return '#818cf8'
}

/* Skala heatmap: gradasi indigo (PRD 10.2), bukan warna status. */
export function heatColor(value, min, max) {
  if (max <= min) return PALETTE.brand300
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return mixColor('#c7d2fe', '#312e81', t)
}

function mixColor(from, to, t) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r} ${g} ${bl})`
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}
