export const APP_VERSION = '0.1.0'
export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000
export const AUTH_DOMAIN = import.meta.env.VITE_AUTH_DOMAIN || 'siagagempa.app'

/* Role -> halaman beranda dan label (PRD 5.2). */
export const ROLES = {
  operational: { path: '/operational', label: 'Operasional' },
  tactical: { path: '/tactical', label: 'Taktis' },
  strategic: { path: '/strategic', label: 'Strategis' },
}

/* Label status -> tone. Badge selalu menampilkan teks, warna hanya penguat (PRD 10.2). */
export const TONE = {
  Hijau: 'ok',
  Aman: 'ok',
  Rendah: 'ok',
  Kuning: 'warn',
  Sedang: 'warn',
  Siaga: 'warn',
  Merah: 'danger',
  Berpotensi: 'danger',
  Tinggi: 'danger',
}

/* Kelas cache TanStack Query (PRD 11). */
export const CACHE = {
  live: {
    staleTime: 4 * 60_000,
    gcTime: 24 * 60 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
  },
  historical: {
    staleTime: 24 * 3_600_000,
    gcTime: 7 * 24 * 3_600_000,
  },
}

/* Daftar label untuk chip filter. Ambangnya hanya hidup di SQL (PRD 8.1). */
export const MAG_CLASSES = ['4.0-4.9', '5.0-5.9', '6.0-6.9', '7.0+']
export const DEPTH_CLASSES = ['Dangkal', 'Menengah', 'Dalam']

export const DATA_RANGE = { start: '2010-01', end: '2025-12' }
export const DEFAULT_MONTH = '2025-12'
export const NATIONAL = 'Nasional'

export const SOURCE_LABEL = {
  bmkg_live: 'BMKG',
  usgs: 'USGS',
}
