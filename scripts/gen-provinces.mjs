/**
 * gen:provinces (PRD §6.3): menormalkan src/data/provinces.json (38 fitur
 * pasca-2022) menjadi supabase/seed/provinces.sql. Geometri di-cast ST_Multi
 * agar cocok dengan kolom geometry(MultiPolygon, 4326).
 * Jalankan: npm run gen:provinces
 */
import fs from 'node:fs'
import path from 'node:path'

const src = path.resolve('src/data/provinces.json')
const out = path.resolve('supabase/seed/provinces.sql')

const geojson = JSON.parse(fs.readFileSync(src, 'utf8'))

const values = geojson.features.map((feature) => {
  const name = feature.properties.name.replace(/'/g, "''")
  const geometry = JSON.stringify(feature.geometry).replace(/'/g, "''")
  return `('${name}', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('${geometry}'), 4326)))`
})

const sql = `-- ===========================================================================
-- SiagaGempa - Seed 38 provinsi (PRD §6.3 / §7.1)
-- Dihasilkan otomatis oleh scripts/gen-provinces.mjs dari src/data/provinces.json.
-- Jalankan di SQL Editor; verifikasi select count(*) from provinces = 38.
-- ===========================================================================
insert into provinces (name, geom) values
${values.join(',\n')}
on conflict (name) do update set geom = excluded.geom;
`

fs.writeFileSync(out, sql)
console.log(`Ditulis: ${out} (${geojson.features.length} provinsi)`)
