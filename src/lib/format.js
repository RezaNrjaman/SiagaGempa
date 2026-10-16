const WIB = 'Asia/Jakarta'

export function formatWIB(iso) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: WIB,
  }).format(new Date(iso))
}

export function formatTimeWIB(iso) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WIB,
  }).format(new Date(iso))
}

export function formatDateWIB(iso) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: WIB,
  }).format(new Date(iso))
}

export function formatRelative(iso) {
  if (!iso) return '-'
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMinutes < 1) return 'baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  const hours = Math.round(diffMinutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.round(hours / 24)
  return `${days} hari lalu`
}

export function formatNumber(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatMagnitude(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return Number(value).toFixed(1)
}

export function formatPercent(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, digits)}%`
}

/* 'YYYY-MM' -> 'Desember 2025' */
export function formatMonth(month) {
  if (!month) return '-'
  const [year, mon] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, mon - 1, 1)))
}

/* 'YYYY-MM' -> 'Des 2025' untuk sumbu grafik. */
export function formatMonthShort(month) {
  if (!month) return '-'
  const [year, mon] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, mon - 1, 1)))
}

/* Daftar 'YYYY-MM' dari start sampai end inklusif. */
export function monthRange(start, end) {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const result = []
  let year = sy
  let month = sm
  while (year < ey || (year === ey && month <= em)) {
    result.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return result
}
