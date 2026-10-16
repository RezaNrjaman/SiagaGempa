// Uji Deno untuk normalisasi & penggabungan feed BMKG (PRD §16.1).
// Jalankan: deno test supabase/functions/ingest-bmkg/ --allow-none
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  collectItems,
  mergeByKey,
  normalize,
  TSUNAMI_RE,
  NOT_TSUNAMI_RE,
} from './lib.ts'

Deno.test('normalize memetakan field BMKG ke kolom DB', () => {
  const row = normalize({
    DateTime: '2025-10-16T10:30:00Z',
    Coordinates: '-6.10,106.50',
    Kedalaman: '10 km',
    Magnitude: '5.2',
    Wilayah: 'Pusat Menteng, Jakarta',
    Dirasakan: 'III Jakarta',
    Potensi: 'Tidak berpotensi tsunami',
  })
  assertEquals(row, {
    event_time: '2025-10-16T10:30:00Z',
    lat: -6.1,
    lon: 106.5,
    depth_km: 10,
    magnitude: 5.2,
    location_text: 'Pusat Menteng, Jakarta',
    felt_info: 'III Jakarta',
    tsunami_potential: false,
    source: 'bmkg_live',
  })
})

Deno.test('Potensi yang cocok /tidak berpotensi/ bernilai false', () => {
  assertEquals(
    TSUNAMI_RE.test('berpotensi tsunami') && !/tidak\s+berpotensi/i.test('Tidak berpotensi tsunami'),
    true,
  )
  assertEquals(
    TSUNAMI_RE.test('Berpotensi tsunami') && !NOT_TSUNAMI_RE.test('Berpotensi tsunami'),
    true,
  )
  assertEquals(normalize({ Magnitude: '5', Kedalaman: '5', Coordinates: '0,0', DateTime: '2025-01-01T00:00:00Z', Potensi: 'Berpotensi tsunami' })?.tsunami_potential, true)
  assertEquals(normalize({ Magnitude: '5', Kedalaman: '5', Coordinates: '0,0', DateTime: '2025-01-01T00:00:00Z', Potensi: 'Tidak berpotensi tsunami' })?.tsunami_potential, false)
})

Deno.test('baris dengan Magnitude/Kedalaman/Coordinates rusak dibuang', () => {
  assertEquals(normalize({ Coordinates: '0,0', Kedalaman: '5', Magnitude: undefined, DateTime: new Date().toISOString() }), null)
  assertEquals(normalize({ Coordinates: '0,0', Kedalaman: 'xx', Magnitude: '5', DateTime: new Date().toISOString() }), null)
  assertEquals(normalize({ Coordinates: '0', Kedalaman: '5', Magnitude: '5', DateTime: new Date().toISOString() }), null)
  assertEquals(normalize(null), null)
})

Deno.test('field opsional hilang tetap terkirim dengan nilai bawaan', () => {
  const row = normalize({ Magnitude: '5', Kedalaman: '5', Coordinates: '0,0', DateTime: '2025-01-01T00:00:00Z' })
  assertEquals(row?.felt_info, null)
  assertEquals(row?.location_text, null)
  assertEquals(row?.tsunami_potential, false)
})

Deno.test('mergeByKey memadukan duplikat dan felt_info non-null menang', () => {
  const merged = mergeByKey([
    { event_time: 't', lat: 0, lon: 0, felt_info: null, tsunami_potential: false },
    { event_time: 't', lat: 0, lon: 0, felt_info: 'IV', tsunami_potential: true },
    { event_time: 'u', lat: 1, lon: 0, felt_info: 'II', tsunami_potential: false },
  ])
  assertEquals(merged.length, 2)
  assertEquals(merged[0].felt_info, 'IV')
  assertEquals(merged[0].tsunami_potential, true)
})

Deno.test('collectItems menangani autogempa (objek tunggal) dan feed larik', () => {
  assertEquals(collectItems({ Infogempa: { gempa: { Magnitude: '5' } } }).length, 1)
  assertEquals(collectItems({ Infogempa: { gempaterkini: [1, 2, 3] } }).length, 3)
  assertEquals(collectItems({ Infogempa: { gempadirasakan: [1] } }).length, 1)
  assertEquals(collectItems({}).length, 0)
})

Deno.test('DateTime tidak valid dibuang', () => {
  assertEquals(
    normalize({ Magnitude: '5', Kedalaman: '5', Coordinates: '0,0', DateTime: 'bukan tanggal' }),
    null,
  )
})
