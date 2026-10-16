/* Nilai warna untuk konsumen yang butuh hex/string: Recharts, Leaflet, style inline. */
export const PALETTE = {
  brand950: '#061a3a',
  brand900: '#0a2a5e',
  brand700: '#0f4c9c',
  brand500: '#1e78d2',
  brand300: '#7db7f0',
  text1: '#f2f7ff',
  text2: '#a9bcd9',
  ok: '#34c38f',
  warn: '#f5b82e',
  danger: '#f0524f',
  grid: 'rgba(255, 255, 255, 0.10)',
}

/* Kelas magnitudo -> warna (PRD OPS-03). M < 5 biru muda, 5-5.9 kuning, >= 6 merah. */
export function magColor(magnitude) {
  if (magnitude >= 6) return PALETTE.danger
  if (magnitude >= 5) return PALETTE.warn
  return PALETTE.brand300
}

/* Skala heatmap: gradasi biru saja (PRD 10.2), bukan warna status. */
export function heatColor(value, min, max) {
  if (max <= min) return PALETTE.brand300
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return mixColor(PALETTE.brand950, PALETTE.brand300, t)
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
