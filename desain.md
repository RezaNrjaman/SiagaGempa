# Desain SiagaGempa: Panduan Visual dan UX Dashboard

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | 17 Oktober 2026 |
| Sumber | `prd.md` v1.0 (bagian 9, 10, 11, 12) |
| Cakupan | Token, layout, komponen, wireframe per halaman, status, aksesibilitas |
| Batas | Dokumen ini **tidak menambah fitur**. Semua elemen di sini menurunkan kebutuhan PRD |

---

## 1. Prinsip Desain

Empat prinsip dari PRD §10.1 yang mengikat semua keputusan di bawah:

1. **Setiap warna punya fungsi.** Biru = merek dan data. Kuning / merah / hijau = status saja. Tidak ada warna dekoratif.
2. **Kaca hanya untuk permukaan konten.** Latar statis dan tenang; kontras teks harus tetap terjaga di atas kaca dan di atas latar.
3. **Tanpa dekorasi kosong.** Tidak ada blob gradien, partikel, emoji, ikon pemanis, teks contoh, atau animasi tanpa makna.
4. **Satu tema (gelap).** Tidak ada mode terang.

**Aturan turunan:** setiap KPI, grafik, dan tabel wajib memiliki **judul + keterangan definisi singkat** dan sumber data (PRD §9.2). Tidak ada tooltip tersembunyi sebagai satu-satunya tempat definisi.

---

## 2. Design Token

Semua nilai ini hidup di `src/styles/tokens.css` (dan `@theme` Tailwind v4). `src/config.js` hanya memuat label dan pemetaan, bukan nilai warna.

### 2.1 Warna

| Token | Nilai | Fungsi | Pemakaian terlarang |
|---|---|---|---|
| `--brand-950` | `#061A3A` | Dasar latar, ujung bawah gradien, skala heatmap terluar | Status |
| `--brand-900` | `#0A2A5E` | Ujung atas gradien, header | Status |
| `--brand-700` | `#0F4C9C` | Tombol utama, **seri data 1** | Status |
| `--brand-500` | `#1E78D2` | Fokus, tautan, **seri data 2** | Status |
| `--brand-300` | `#7DB7F0` | Titik M < 5, skala heatmap terdalam, indikator fokus | Status kuning/merah/hijau |
| `--text-1` | `#F2F7FF` | Teks utama (judul, angka besar) | — |
| `--text-2` | `#A9BCD9` | Teks sekunder, keterangan `caption`, sumbu grafik, baseline | — |
| `--ok` | `#34C38F` | Hijau, Aman, Rendah | Data/seri |
| `--warn` | `#F5B82E` | Kuning, Sedang | Data/seri |
| `--danger` | `#F0524F` | Merah, Berpotensi, Tinggi | Data/seri |
| `--grid` | `rgb(255 255 255 / 0.10)` | Garis bantu grafik, pemisah | — |

**Skala heatmap peta:** gradasi biru saja, `--brand-950` (rendah) → `--brand-300` (tinggi). Tidak boleh memakai `--warn`/`--danger`.

### 2.2 Pemetaan tone status (`config.js` → `TONE`)

`StatusBadge` selalu menerima **label**, lalu mengambil tone dari tabel ini. Warna tidak pernah menjadi satu-satunya pembawa makna.

| Label | Tone | Token |
|---|---|---|
| `Hijau`, `Aman`, `Rendah` | ok | `--ok` |
| `Kuning`, `Sedang`, `Siaga` | warn | `--warn` |
| `Merah`, `Berpotensi`, `Tinggi` | danger | `--danger` |
| Netral / tanpa status | netral | `--text-2` |

Label berasal langsung dari aturan SQL (PRD §8.1): `alert_level` ∈ {Hijau, Kuning, Merah}, `tsunami_status` ∈ {Aman, Berpotensi}, `category` ∈ {Rendah, Sedang, Tinggi}, `is_alert` → badge "Siaga".

### 2.3 Permukaan kaca

```css
:root {
  --glass-bg: rgb(255 255 255 / 0.08);
  --glass-bg-hover: rgb(255 255 255 / 0.12);
  --glass-border: rgb(255 255 255 / 0.18);
  --glass-blur: 16px;
  --glass-shadow: 0 8px 32px rgb(0 0 0 / 0.28);
}
```

Aturan pemakaian (PRD §10.3):
- `GlassPanel` adalah **satu-satunya** pembawa kelas `.glass`.
- Maksimum **dua lapis** kaca bertumpuk.
- **Tidak ada** `backdrop-filter` pada baris tabel atau elemen berulang.
- Latar aplikasi = gradien CSS statis `--brand-900` → `--brand-950`, vertikal, tanpa gambar.
- Mobile (`≤ 768 px`): `--glass-blur: 10px`.
- Fallback: `@supports not (backdrop-filter: ...)` → `rgb(10 42 94 / 0.92)`. `prefers-reduced-transparency` hanya peningkatan progresif.

### 2.4 Tipografi

| Aspek | Aturan |
|---|---|
| Keluarga | Inter variable, self-hosted (`@fontsource-variable/inter`) |
| Angka | `font-variant-numeric: tabular-nums` untuk semua KPI, tabel, dan sumbu |
| Skala | 12 / 14 / 16 / 20 / 24 / 32 px |
| Bobot | 400 (teks), 500 (label/tabel), 600 (judul, angka KPI) |
| Tinggi baris | 1.5 untuk teks, 1.2 untuk judul, 1.1 untuk angka KPI |

Pemetaan peran teks:

| Peran | Ukuran | Bobot | Token warna |
|---|---|---|---|
| Judul panel / `ChartCard.title` | 16 px | 600 | `--text-1` |
| Angka KPI | 32 px | 600 | `--text-1` (aksen tone bila `KpiCard.tone`) |
| Label KPI | 12 px | 500 | `--text-2` |
| `caption` definisi | 12 px | 400 | `--text-2` |
| Isi tabel | 14 px | 400/500 | `--text-1` / `--text-2` |
| Sumbu & label grafik | 12 px | 400 | `--text-2` |

### 2.5 Spasi, bentuk, grid

| Aspek | Aturan |
|---|---|
| Spasi | kelipatan 4 px |
| Jarak antar panel | 16 px (mobile), 24 px (desktop) |
| Padding dalam panel | 16 px (mobile), 24 px (desktop) |
| Radius | 12 px (elemen kecil: chip, tombol, badge), 16 px (panel) |
| Grid | 12 kolom, lebar maksimum isi **1440 px**, terpusat |
| Breakpoint | 360 (mobile), 768 (tablet), 1280 (desktop) |
| Bayangan | hanya `--glass-shadow` pada panel; tanpa bayangan lain |

### 2.6 Gerak

- Transisi **150 ms** untuk hover dan fokus (warna, `--glass-bg` → `--glass-bg-hover`).
- Tanpa animasi masuk/keluar dekoratif. Skeleton loading boleh berdenyut halus.
- Hormati `prefers-reduced-motion: reduce` → matikan transisi dan denyut.

### 2.7 Ikon

`lucide-react`, impor per ikon, ukuran **16 atau 20 px**, stroke **1.75**. Hanya dipakai bila memberi informasi (mis. ikon `LogOut`, `RefreshCw` untuk "Coba lagi", `MapPin`). Tidak ada ikon pemanis di judul panel.

---

## 3. Kerangka Layout (AppShell)

`AppShell` adalah pembungkus semua halaman terautentikasi (PRD §9.2). Login, Forbidden, dan NotFound berdiri sendiri.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky, kaca)                                                      │
│  ┌──────────────┐                      ┌─────────────────────────────────┐ │
│  │ ◈ SiagaGempa │                      │ [Role: Operational] admin1  ⎋   │ │
│  └──────────────┘                      └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
   ┌──────────────────────────  max 1440px  ──────────────────────────────┐
   │                                                                        │
   │   KONTEN HALAMAN  (grid 12 kolom, gap 16/24px)                         │
   │                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│  FOOTER                                                                     │
│  Sumber data: BMKG (live) · USGS (historis 2010-2025)                       │
│  Kredit foto login: <atribusi>                                              │
│  "Proyek akademik, bukan produk resmi BMKG."                                │
└───────────────────────────────────────────────────────────────────────────┘
```

Catatan:
- Header dan Footer **tidak** menyediakan navigasi antar dashboard (PRD §2).
- Nama wordmark memakai SVG, bukan raster.
- Batas lapis kaca: header (1) + panel konten (2). Tidak lebih.

---

## 4. Komponen

Setiap komponen = satu berkas, nama berkas = nama komponen, impor absolut `@/`. Props sesuai PRD §10.5.

### 4.1 `GlassPanel`

| Prop | Nilai |
|---|---|
| `as` | tag elemen (default `section`) |
| `className`, `children` | — |

Anatomi: `.glass` + radius 16 px + padding 16/24 px. **Satu-satunya** elemen ber-`.glass`.

### 4.2 `KpiCard`

| Prop | Keterangan |
|---|---|
| `label` | judul KPI (12 px, `--text-2`) |
| `value` | angka utama (32 px, tabular-nums) |
| `unit` | satuan opsional (mis. `M`, `%`) |
| `caption` | definisi singkat + sumber (12 px, `--text-2`) |
| `tone` | aksen status (opsional) |
| `query` | memicu `QueryState` (loading/error/kosong) |

```
┌────────────────────────────┐
│ LABEL KPI                  │  ← 12px --text-2
│ 6.2  M                     │  ← 32px --text-1 + unit 14px --text-2
│ rata-rata 24 jam · BMKG    │  ← 12px --text-2 (caption)
└────────────────────────────┘
```
Tinggi kartu seragam dalam satu baris KPI agar grid stabil.

### 4.3 `ChartCard`

Pembungkus grafik/peta. `title`, `caption`, `query`, `children`.
Struktur: judul (16/600) → `caption` definisi → area grafik → (opsional) legenda. `aria-label` grafik diisi dari `caption` (PRD §10.6).

### 4.4 `SeriesChart`

Satu-satunya komponen grafik. `data, xKey, series[{key,label,type,color,axis,stackId,dashed}]`.

Aturan (PRD §10.6):
- `type`: `bar` atau `line`.
- Maksimum **3 seri** per grafik.
- Seri 1 = `--brand-700`, seri 2 = `--brand-500`, baseline = `--text-2` **putus-putus**.
- Sumbu/label `--text-2`, garis bantu `--grid`.
- Tooltip bergaya kaca (maks. satu lapis tambahan), angka tabular-nums.
- Dua sumbu hanya lewat prop `axis` (mis. batang kiri + garis kanan).
- Bertumpuk lewat `stackId`.

### 4.5 `DataTable`

`columns[{key,label,render,align}], rows, onRowClick, selectedId, query`.

- Header **sticky**, latar `--brand-900` solid (bukan kaca ber-blur, karena baris berulang).
- Baris terpilih (`selectedId`) diberi latar `rgb(255 255 255 / 0.06)` **dan** penanda non-warna (mis. garis kiri `--brand-300`).
- Mobile: area scroll horizontal; kolom prioritas tetap terlihat (waktu/peringkat + angka inti).
- Angka rata kanan (`align: right`), teks rata kiri.
- Setiap tabel punya `caption` definisi + sumber.

### 4.6 `QuakeMap`

`mode ('points'/'grid'), data, selectedId`.

- Renderer **canvas**, tanpa tile. Latar = batas 38 provinsi (GeoJSON, garis `--grid`, tanpa isian atau isian sangat redup).
- `mode="points"`: radius titik proporsional magnitudo; warna per kelas (M < 5 `--brand-300`, 5–5.9 `--warn`, ≥ 6 `--danger`); titik terpilih diberi cincin `--brand-300`.
- `mode="grid"`: sel 0.5° diwarnai skala biru berurutan + **legenda skala** (nilai min–maks) di sudut panel.
- Tanpa kontrol zoom yang ramai; hanya zoom/geser dasar. Tidak ada marker berkluster.
- Legenda kelas magnitudo/kepadatan ditulis sebagai teks, tidak mengandalkan warna saja.

### 4.7 `FilterBar`

`value, onChange, fields[]`. Dikendalikan dari URL (`useSearchParams`).

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Bulan [ 2025-12 ▾ ]  Provinsi [ Nasional ▾ ]                              │
│ Magnitudo  (4.0-4.9)(5.0-5.9)(6.0-6.9)(7.0+)   ← chip multi-pilih          │
│ Kedalaman  (Dangkal)(Menengah)(Dalam)          ← chip multi-pilih          │
└───────────────────────────────────────────────────────────────────────────┘
```
- Chip terpilih: latar `--brand-700`, teks `--text-1`, border `--glass-border`.
- Chip tak terpilih: latar transparan, teks `--text-2`.
- Status terpilih juga disampaikan lewat tanda centang, bukan warna saja.
- Default semua kelas magnitudo/kedalaman aktif (dikirim dari `config.js`).
- Perubahan filter menulis ke URL dan memperbarui seluruh komponen (TAC-07).

### 4.8 `StatusBadge`

`label`. Warna dari `TONE[label]`, **selalu** menampilkan teks. Bentuk: pil radius 12 px, padding 4/8 px, ukuran 12–14 px.

```
● Merah   (--danger, teks + titik)
● Siaga   (--warn)
● Rendah  (--ok)
```

### 4.9 `QueryState`

`query, empty, children`. Menangani empat status (PRD §9.6):

| Status | Tampilan |
|---|---|
| Memuat | Skeleton kaca (blok abu bergerak halus) sesuai bentuk konten |
| Error | Pesan singkat + tombol "Coba lagi" (ikon `RefreshCw`) |
| Kosong | Pesan spesifik dari prop `empty` (lihat §7) |
| Sukses | `children` |

Menggantung di dalam `KpiCard`, `ChartCard`, `DataTable`. Tidak ada spinner layar penuh.

---

## 5. Wireframe Halaman

### 5.1 `/login` (AUTH-01)

Layout terbelah pada desktop, menumpuk pada mobile.

```
┌───────────────────────────────┬───────────────────────────┐
│                               │                           │
│   FOTO WEBP (webp srcset)     │   ◈ SiagaGempa            │
│   login-visual-640/1280.webp  │                           │
│   (satu foto bebas lisensi)   │   Username [__________]   │
│                               │   Password [__________]   │
│                               │   [    Masuk    ]         │
│                               │                           │
│                               │   ⚠ "Username atau        │
│                               │     password salah."      │
│                               │                           │
│                               │   "Proyek akademik,       │
│                               │    bukan produk resmi     │
│                               │    BMKG."                 │
│   Kredit foto (footer kiri)   │                           │
└───────────────────────────────┴───────────────────────────┘
```
- Satu pesan generik untuk semua kegagalan kredensial (AUTH-03).
- Foto: `srcset` 640/1280, atribut `width`, `height`, `decoding="async"`, atribusi lisensi dicatat.
- Tidak ada tautan daftar/lupa password (di luar lingkup).

### 5.2 `/operational` (OPS-01 … OPS-08)

```
Baris 1  [ Badge status siaga: ● Kuning ]        [ Diperbarui 14:20 WIB ]
─────────────────────────────────────────────────────────────────────────
Baris 2  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ Terbaru  │ │ 24 jam   │ │ M maks   │ │ Tsunami  │   ← 4 KpiCard
         │ M 5.2    │ │ 12       │ │ 5.8      │ │ Aman     │
         └──────────┘ └──────────┘ └──────────┘ └──────────┘
─────────────────────────────────────────────────────────────────────────
Baris 3  ┌───────────────────────────┬──────────────────────────────┐
         │  PETA TITIK (15 gempa)    │  TABEL 15 GEMPA              │
         │  QuakeMap mode="points"   │  waktuWIB·M·kedalaman·lokasi │
         │  radius ∝ magnitudo       │  ·provinsi·dirasakan·tsunami │
         │                           │  (klik baris → sorot titik)  │
         └───────────────────────────┴──────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Catatan permanen: "Feed BMKG berisi gempa M ≥ 5 atau yang dirasakan."
```
- OPS-02: badge di bagian atas, teks + warna (bukan warna saja).
- OPS-05: klik baris ↔ sorot titik dua arah lewat state `selectedId`.
- OPS-06: label "Diperbarui HH:mm WIB" + refetch tiap 5 menit saat tab aktif.
- OPS-08 (kosong): "Belum ada gempa tercatat dalam 24 jam terakhir." + level Hijau.

### 5.3 `/tactical` (TAC-01 … TAC-08)

```
Baris 1  [ FilterBar: Bulan · Provinsi · chip Magnitudo · chip Kedalaman ]
─────────────────────────────────────────────────────────────────────────
Baris 2  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ Bulan ini│ │ vs base  │ │ Provinsi │ │ Wil. siag│   ← 4 KpiCard
         │ 48       │ │ +18%     │ │ Teratas  │ │ 2        │
         └──────────┘ └──────────┘ └──────────┘ └──────────┘
─────────────────────────────────────────────────────────────────────────
Baris 3  ┌───────────────────────────────────────────────────────────┐
         │  SERI 12 BULAN: batang jumlah + garis putus baseline      │
         └───────────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Baris 4  ┌──────────────────────────────┬────────────────────────────┐
         │  TABEL RANKING PROVINSI       │  PANEL "WILAYAH SIAGA"     │
         │  prov·jumlah·baseline·z·badge │  • Aceh — 14 vs rata 6.2   │
         └──────────────────────────────┴────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Baris 5  ┌──────────────────────┬──────────────────────┐
         │  HISTOGRAM MAGNITUDO │  HISTOGRAM KEDALAMAN │
         └──────────────────────┴──────────────────────┘
─────────────────────────────────────────────────────────────────────────
Catatan permanen: "Data historis USGS 2010-2025. Baseline = rata-rata bulan
yang sama pada tahun-tahun sebelumnya."
```
- TAC-01: default bulan **2025-12**, provinsi **Nasional**; semua filter di URL: `?bulan=2025-12&prov=Aceh&mag=...&dalam=...`.
- TAC-05: alasan wilayah siaga berupa kalimat, mis. "Jumlah 14 vs rata-rata 6.2".
- TAC-06: kedua histogram ikut filter bulan, provinsi, magnitudo, dan kedalaman.

### 5.4 `/strategic` (STR-01 … STR-08)

```
Baris 1  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ Total    │ │ Total    │ │ Provinsi │ │ % gempa  │   ← 4 KpiCard
         │ 2010-25  │ │ M ≥ 6    │ │ skor max │ │ dangkal  │
         └──────────┘ └──────────┘ └──────────┘ └──────────┘
─────────────────────────────────────────────────────────────────────────
Baris 2  ┌───────────────────────────────────────────────────────────┐
         │  TREN TAHUNAN: batang jumlah (kiri) + garis M≥6 (kanan)    │
         └───────────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Baris 3  ┌───────────────────────────────────────────────────────────┐
         │  KOMPOSISI KEDALAMAN per tahun (batang bertumpuk)          │
         └───────────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Baris 4  ┌───────────────────────────────────────────────────────────┐
         │  PETA GRID 0.5° (skala biru) + LEGENDA skala               │
         └───────────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Baris 5  ┌──────────────────────────────┬────────────────────────────┐
         │  TABEL SKOR KERAWANAN (38)    │  PANEL "PRIORITAS MITIGASI"│
         │  rank·skor(bar)·kategori·     │  1. Sulawesi Tengah,       │
         │  jumlah·rataM·jumlahM≥6       │     skor 82.4, Frekuensi   │
         └──────────────────────────────┴────────────────────────────┘
─────────────────────────────────────────────────────────────────────────
Baris 6  ┌───────────────────────────────────────────────────────────┐
         │  TABEL 20 GEMPA TERKUAT                                    │
         └───────────────────────────────────────────────────────────┘
         Keterangan rumus skor kerawanan (statis).
```
- STR-05: skor ditampilkan sebagai angka **dan** bilah proporsional (nilai min–maks 0–100), warna bilah tetap biru (bukan tone).
- STR-06: kalimat otomatis "N. Provinsi, skor X, faktor dominan: Y".
- STR-08: rumus `100 × (0.4·F + 0.4·E + 0.2·S)` ditulis sebagai keterangan statis di bawah tabel.

### 5.5 `/forbidden` dan NotFound

Halaman ringkas di atas latar gelap: ikon informasi (16/20 px), judul, satu kalimat, dan satu tombol kembali.

```
┌───────────────────────────────┐
│         ⌧  (ikon informasi)   │
│   Akses ditolak               │
│   Role Anda tidak memiliki    │
│   akses ke halaman ini.       │
│   [ Kembali ke beranda ]      │
└───────────────────────────────┘
```
- `forbidden`: tombol kembali ke beranda role (dari `ROLES`).
- `NotFound` (AUTH-08): "Halaman tidak ditemukan" + tautan kembali.

---

## 6. Aturan Visualisasi Data

| Aspek | Aturan |
|---|---|
| Seri maksimum | 3 per grafik |
| Warna seri | seri 1 `--brand-700`, seri 2 `--brand-500`, seri 3 (bila ada) `--brand-300` |
| Baseline | garis `--text-2` putus-putus, label eksplisit "Baseline" |
| Kedalaman bertumpuk | urutan tetap Dangkal → Menengah → Dalam, gradasi biru muda→tua (bukan warna status) |
| Status di grafik | kuning/merah hanya untuk penanda ambang/status, tidak untuk seri data |
| Angka | tabular-nums; maksimum 1 desimal untuk magnitudo, 1 untuk skor |
| Legenda | selalu ada bila > 1 seri; teks, bukan warna saja |
| Kosong | grafik menampilkan pesan kosong dari `QueryState`, bukan sumbu kosong |

---

## 7. Status Kosong (pesan spesifik)

| Konteks | Pesan |
|---|---|
| Operasional, 24 jam | "Belum ada gempa tercatat dalam 24 jam terakhir." (level Hijau) |
| Operasional, tabel | "Tidak ada gempa pada feed terbaru." |
| Taktis, filter | "Tidak ada gempa untuk filter ini." |
| Strategis, peta grid | "Tidak ada sebaran pada rentang ini." |
| Error umum | "Gagal memuat data." + tombol "Coba lagi" |

---

## 8. Aksesibilitas (PRD §10.7)

- Kontras teks minimum WCAG AA (4.5:1) di atas latar dan di atas kaca. `--text-2` hanya untuk teks ≥ 14 px atau pendamping teks utama.
- Warna **tidak pernah** satu-satunya pembawa makna: badge selalu bertuliskan; baseline punya garis putus-putus + label; chip terpilih punya tanda centang.
- Semua kontrol (chip, select, tombol, baris tabel yang klikabel) dapat dioperasikan dengan keyboard.
- Indikator fokus = `--brand-300`, tebal 2 px, tanpa menghilangkan outline.
- Grafik punya `aria-label` dari `caption`; tabel memakai `th` semantik dan `scope`.
- `prefers-reduced-motion: reduce` mematikan transisi.

---

## 9. Responsif

| Breakpoint | Perilaku |
|---|---|
| **360 px** (mobile) | KPI menumpuk 1 kolom; FilterBar vertikal; peta & tabel menumpuk; tabel scroll horizontal; `--glass-blur: 10px` |
| **768 px** (tablet) | KPI 2×2; peta/tabel boleh tetap menumpuk; histogram 2 kolom |
| **1280 px** (desktop) | KPI 4 kolom; peta + tabel berdampingan 7/5; panel bawah 6/6; lebar isi maks 1440 px |

Aturan konsistensi: tidak ada elemen yang berubah ukuran teks di luar skala 12/14/16/20/24/32; jarak tetap kelipatan 4 px.

---

## 10. Aset Visual

- **Semua raster wajib `.webp`.** JPG/JPEG/PNG/GIF dilarang di `src/` dan `public/`.
- Ikon, wordmark, dan favicon = SVG.
- Satu-satunya foto raster v1 = visual login, dua ukuran `login-visual-640.webp` dan `login-visual-1280.webp`, **≤ 80 KB per berkas**, kualitas WebP 78–82.
- Gambar dari API (mis. `Shakemap` BMKG) tidak pernah ditampilkan.
- `npm run check:assets` mencegah pelanggaran ini saat build.

---

## 11. Anggaran Performa Terkait Desain

| Metrik | Target | Konsekuensi desain |
|---|---|---|
| JS awal (login) | ≤ 150 KB gzip | Login tanpa grafik/peta; Recharts & Leaflet di chunk terpisah |
| JS dashboard termuat | ≤ 350 KB gzip | Grafik/peta hanya dimuat di halaman yang memakainya |
| LCP (4G) | < 2.5 s | Latar gradien CSS, bukan gambar; font `display: swap` |
| Lighthouse Perf & A11y | ≥ 90 | Kontras, label, dan fokus di §8 |
| Pindah filter yang sudah dibuka | 0 panggilan | Skeleton hanya pada pemuatan pertama |

---

## 12. Checklist Desain (Definition of Done Visual)

- [ ] Setiap KPI, grafik, dan tabel punya judul + `caption` definisi dan sumber
- [ ] Warna status hanya untuk status; heatmap hanya gradasi biru
- [ ] Hanya `GlassPanel` yang memakai `.glass`; maksimum dua lapis; tanpa blur pada baris tabel
- [ ] Angka memakai tabular-nums; ukuran teks hanya dari skala 12–32 px
- [ ] Semua badge/penanda status menampilkan teks, bukan warna saja
- [ ] Empat status `QueryState` tampil untuk tiap komponen berdata (pesan kosong spesifik)
- [ ] Filter taktis tersimpan di URL dan memperbarui seluruh komponen
- [ ] Peta tanpa tile, memuat batas provinsi, dan punya legenda
- [ ] Tampilan benar di 360, 768, dan 1280 px
- [ ] Fokus keyboard terlihat (`--brand-300`) dan kontras AA terpenuhi
- [ ] Tidak ada raster non-WebP; foto login ≤ 80 KB dan ber-atribusi
- [ ] Footer memuat sumber BMKG/USGS, kredit foto, dan disclaimer "Proyek akademik, bukan produk resmi BMKG."
