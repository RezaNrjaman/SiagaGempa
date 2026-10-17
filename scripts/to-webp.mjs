/*
 * Konversi foto visual halaman login ke WebP (PRD §12).
 *
 * Catatan penting: berkas JPG sumber hanya 612 px lebar, sehingga varian
 * yang lebih besar TIDAK bisa dibuat tanpa memperbesar (upscaling) gambar.
 * Script ini karena itu hanya menuliskan lebar <= lebar sumber dan
 * melewatkan sisanya, supaya tidak ada varian palsu di <img srcset>.
 *
 * Keluaran ditulis ke public/assets/ karena halaman login memuat gambar
 * lewat URL absolut /assets/... (bukan impor bundel Vite).
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const SRC = process.env.LOGIN_VISUAL_SRC
  ? path.resolve(process.env.LOGIN_VISUAL_SRC)
  : path.resolve('public/assets/login-visual-original.jpg')
const OUT_DIR = path.resolve('public/assets')
const WIDTHS = [640, 1280]
const QUALITY = 80

if (!fs.existsSync(SRC)) {
  console.error(
    `Sumber tidak ditemukan: ${SRC}\n` +
      'Letakkan JPEG asli di public/assets/login-visual-original.jpg atau set LOGIN_VISUAL_SRC.',
  )
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const sourceWidth = (await sharp(SRC).metadata()).width
console.log(`Sumber: ${path.basename(SRC)} — ${sourceWidth} px lebar.`)

let written = 0

for (const width of WIDTHS) {
  if (width > sourceWidth) {
    console.log(`Melewati ${width}px: melebihi lebar sumber (${sourceWidth}px), akan di-upscale.`)
    continue
  }
  const out = path.join(OUT_DIR, `login-visual-${width}.webp`)
  await sharp(SRC)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out)
  const stat = fs.statSync(out)
  written += 1
  console.log(`${path.basename(out)}: ${stat.size} bytes (${Math.round(stat.size / 1024)} KB)`)
}

// Bersihkan varian lama yang tidak lagi dipakai.
for (const file of fs.readdirSync(OUT_DIR)) {
  if (!/^login-visual-\d+\.webp$/.test(file)) continue
  const width = Number(file.match(/-(\d+)\.webp$/)[1])
  if (width > sourceWidth) {
    fs.unlinkSync(path.join(OUT_DIR, file))
    console.log(`Menghapus varian usang: ${file}`)
  }
}

if (written === 0) console.error('Tidak ada varian yang ditulis.')
else console.log(`Selesai: ${written} varian WebP di public/assets/.`)