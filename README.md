# RPLBox — Online 4-Cut Photobooth

Photobooth yang berjalan sepenuhnya di browser. Ambil foto di
depan latar hijau, **chroma key realtime di Canvas** akan menghapus background
secara instan, lalu bingkai dengan salah satu dari 15 template. Hasil akhir bisa
diunduh sebagai **PNG** resolusi penuh atau **PDF** siap cetak (A6).

## Fitur

- **Chroma key opsional** — implementasi sendiri di `lib/chromaKey.ts` (tanpa
  library eksternal): konversi RGB→HSV, deteksi hijau, *feathering*, dan
  *spill reduction*. Default mati agar kamera tetap ringan; aktifkan lewat
  toggle "Hapus background hijau" saat memakai green screen.
- **15 template 4-cut** dengan slot yang terdeteksi otomatis (pipeline
  Fase 1 dengan `sharp`). Di desktop tampil sebagai grid 3 kolom di bawah
  kamera; di mobile dipindah ke drawer samping yang scrollable agar halaman
  tetap ringkas.
- **Ganti per foto** — sudah 4/4 tapi foto ke-2 kurang pas? Klik "Ganti" pada
  foto tersebut dan ambil ulang tanpa mengulang seluruh sesi.
- **Kamera auto-off** — setelah foto ke-4, kamera ditutup dan diganti panel
  informasi untuk menghemat baterai. Kamera menyala lagi saat user memilih
  "Ganti" pada salah satu foto.
- **6 warna frame** (Classic White, Pitch Black, Pastel Lilac, Butter Peach,
  Haru Mint, Barbie Pink) yang mengisi latar hasil cut-out.
- **6 filter** (Normal, Warm, Cool, Mono, Vivid, Fade), diterapkan setelah
  chroma key supaya warna hijau tetap terdeteksi akurat.
- **Timer 3/5/10 detik** dan tombol flip kamera.
- **Pemilih frame hemat bandwidth** — thumbnail WebP ringan (lazy load), file
  template penuh baru diunduh saat frame dipilih, lengkap dengan animasi loading.
- **Unduh PNG & PDF**, plus **Share** file via Web Share API.
- **Galeri** beberapa hasil terakhir di `localStorage` (tanpa backend). Salinan
  galeri disimpan sebagai JPEG ringan dengan batas kuota yang ditangani
  eksplisit—item lama dibuang bila perlu, dan user diberi tahu.
- **Error handling** untuk kamera, pemuatan frame, preview, unduhan, share, dan
  galeri; tersedia juga halaman error/404 yang ramah.

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

> Kamera hanya aktif pada `localhost` atau HTTPS (batasan browser pada
> `getUserMedia`).

### Perintah lain

```bash
npm run build            # build produksi
npm start                # jalankan hasil build
npm run lint             # eslint
npm run process-templates # regenerasi template bersih + slots.json + thumbnail
npm run detect-slots      # debug: lihat deteksi slot per template
```

## Pipeline template (Fase 1)

Skrip memproses gambar di `public/template/*.png` menjadi:

- `public/ready/<nama>.png` — template dengan area slot transparan.
- `public/ready/slots.json` — metadata slot tiap template.
- `public/ready/thumbs/<nama>.webp` — thumbnail ringan untuk pemilih frame.

```bash
npm run process-templates
```

Tahapan (`scripts/run-all.ts`):

1. `scripts/detect-green-screen.ts` — deteksi slot. Untuk template tanpa area
   hijau, dipakai fallback deteksi area datar (`scripts/lib/flat.ts`) sehingga
   slot putih (template 2) dan hitam (template 6) tetap terbaca.
2. `scripts/clean-template.ts` — jadikan area slot transparan (alpha 0) tanpa
   mengubah resolusi.
3. `scripts/generate-metadata.ts` — tulis `slots.json`.
4. `scripts/generate-thumbnails.ts` — buat thumbnail WebP 360 px di
   `public/ready/thumbs` agar halaman tidak mengunduh semua template penuh.

Metode deteksi: klasifikasi pixel hijau (hue 80–160, saturasi > 0.20, value >
0.20) lalu **proyeksi baris/kolom** untuk menemukan batas slot — lebih tahan
terhadap ornamen yang menempel di tepi slot.

## Struktur proyek

```
app/
  page.tsx                 # landing
  studio/page.tsx          # alur ambil foto + preview + unduh
  gallery/page.tsx         # galeri localStorage
  error.tsx                # error boundary route-level
  not-found.tsx            # halaman 404
  icon.svg                 # favicon RPLBox
  globals.css              # design system (Tailwind v4 @theme)
  layout.tsx               # font + Material Symbols + metadata
  api/render/route.ts      # komposit server-side (sharp)
components/
  CameraViewport.tsx       # kamera + chroma key realtime
  CountdownOverlay.tsx     # countdown
  PhotoStripPreview.tsx    # preview strip + kontrol
  TemplateSelector.tsx     # grid template
  TemplateDrawer.tsx       # drawer frame (mobile)
  SessionCompletePanel.tsx # panel setelah 4/4 (kamera mati)
  DownloadBar.tsx          # PNG / PDF / Share
  AppNav.tsx               # navigasi
  ui/PillButton.tsx        # tombol pill
lib/
  chromaKey.ts             # algoritma green screen
  composite.ts             # komposit strip (Canvas)
  constants.ts             # template, warna frame, filter
  gallery.ts               # penyimpanan localStorage (JPEG)
scripts/                   # pipeline Fase 1
public/
  template/                # gambar asli
  ready/                   # template bersih + slots.json + thumbs/
  fonts/                   # Material Symbols subset (self-hosted)
```

## API

`POST /api/render` — komposit strip di server memakai `sharp` (resolusi penuh).
Endpoint ini opsional untuk integrasi; UI studio memakai Canvas di klien.

```json
{
  "templateId": "1",
  "photos": ["data:image/png;base64,..."],
  "frameColor": "#ffffff"
}
```

Respons: `image/png`. Maksimal 4 foto (sesuai jumlah slot template), masing-masing
berupa data URL PNG/JPEG/WebP dan maksimal 6 MB.

## Tips hasil terbaik

- Gunakan **latar hijau polos** (green screen) dengan pencahayaan rata.
- **Hindari memakai baju berwarna hijau** — akan ikut terhapus oleh chroma key.
- Makin kontras subjek dengan latar, makin rapi tepi cut-out.

## Teknologi

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Sharp ·
Canvas API · jsPDF.
