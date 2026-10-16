/*
 * Konversi foto visual halaman login ke WebP dua ukuran (PRD §12).
 * Sumber: berkas asli di luar repo, hasil di src/assets/.
 * Kualitas 78-82, tiap berkas maksimal 80 KB.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('src/assets/login-visual-original.jpg')
const OUT_DIR = path.resolve('src/assets')
const SIZES = [640, 1280]
const QUALITY = 80

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const width of SIZES) {
  const out = path.join(OUT_DIR, `login-visual-${width}.webp`)
  await sharp(SRC)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out)
  const stat = fs.statSync(out)
  console.log(`${path.basename(out)}: ${stat.size} bytes (${Math.round(stat.size / 1024)} KB)`)
}

console.log('Selesai konversi WebP.')
