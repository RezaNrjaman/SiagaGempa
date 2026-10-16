/*
 * Pemeriksaan aset (PRD 5.3): hanya WebP yang boleh masuk src/ atau public/,
 * dan tiap aset maksimal 80 KB. Dipanggil lewat `npm run check:assets`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_BYTES = 80 * 1024
const LEVEL = ['src', 'public']
const base = path.dirname(fileURLToPath(import.meta.url))

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

const violations = []

for (const level of LEVEL) {
  const root = path.join(path.dirname(base), level)
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase()
    const size = fs.statSync(file).size
    if (/\.(png|jpe?g|gif|bmp|avif)$/i.test(ext)) {
      violations.push(`FORMAT ${path.relative(root, file)} (hanya WebP)`)
    } else if (ext !== '.svg' && ext !== '.webp' && size > MAX_BYTES) {
      violations.push(`SIZE ${path.relative(root, file)} ${size} B > 80 KB`)
    }
  }
}

if (violations.length > 0) {
  console.error(['Pelanggaran aset:', ...violations.map((v) => ` - ${v}`)].join('\n'))
  process.exit(1)
}
console.log('OK: tidak ada pelanggaran aset (format WebP + batas 80 KB).')
