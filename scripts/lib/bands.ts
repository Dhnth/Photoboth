/**
 * Detektor slot berbasis proyeksi (row/column band).
 *
 * Kenapa bukan connected-component saja?
 * - Slot sering menempel ke elemen dekoratif (daun, stiker, karakter) sehingga
 *   satu komponen bisa mencakup beberapa slot sekaligus.
 * - Slot juga bisa tertutup stiker, jadi bounding box komponen terpotong.
 *
 * Pendekatan proyeksi:
 * 1. Tentukan "kandidat pixel" (hijau, atau bidang polos putih/hitam).
 * 2. Hitung kepadatan kandidat per baris. Baris dengan kepadatan >= ambang
 *    membentuk BAND (satu slot kira-kira setinggi satu band).
 * 3. Untuk setiap band, hitung kepadatan per kolom dan ambil rentang kolom
 *    terpanjang yang padat.
 * 4. Filter berdasarkan ukuran, rasio, dan kepadatan agar dekorasi terbuang.
 *
 * Detektor ini tidak peduli apakah slot menempel ke background atau tertutup
 * ornamen, selama mayoritas baris slot masih memperlihatkan warna slot.
 */
import {
  type Box,
  type RawImage,
  DENSE_RATIO,
  MIN_SLOT_FILL,
  isGreenPixel,
} from "./green";
import { isFlatPixel } from "./flat";

export type SlotMode = "green" | "flat-light" | "flat-dark";

export interface BandSlot extends Box {
  /** Kepadatan kandidat di dalam box final (0-1). */
  fill: number;
}

/** Ambang kepadatan baris untuk memulai/mengakhiri band. */
const BAND_THRESHOLD = 0.4;
/** Jarak baris kosong yang ditoleransi di tengah band (mis. garis ornamen). */
const BAND_GAP_TOLERANCE = 2;
/** Tinggi minimum satu band. */
const MIN_BAND_HEIGHT = 60;
/** Lebar minimum slot. */
const MIN_BAND_WIDTH = 120;
/** Rasio lebar/tinggi slot foto (mendatar). */
const MIN_ASPECT = 1.05;
const MAX_ASPECT = 3.2;

function makeMatcher(image: RawImage, mode: SlotMode): (index: number) => boolean {
  const { data, channels } = image;

  if (mode === "green") {
    return (index) => {
      const offset = index * channels;
      return isGreenPixel(data[offset], data[offset + 1], data[offset + 2]);
    };
  }

  const light = mode === "flat-light";
  return (index) => {
    const offset = index * channels;
    return isFlatPixel(data[offset], data[offset + 1], data[offset + 2], light);
  };
}

/** Cari rentang [start, end) terpanjang dengan nilai >= threshold. */
function longestRun(
  values: number[],
  threshold: number,
  gapTolerance: number,
): { start: number; end: number } {
  let best = { start: 0, end: 0 };
  let start = -1;
  let lastDense = -1;

  for (let i = 0; i < values.length; i += 1) {
    if (values[i] >= threshold) {
      if (start === -1) start = i;
      lastDense = i;
    } else if (start !== -1 && i - lastDense > gapTolerance) {
      if (lastDense - start + 1 > best.end - best.start) {
        best = { start, end: lastDense + 1 };
      }
      start = -1;
      lastDense = -1;
    }
  }

  if (start !== -1 && lastDense - start + 1 > best.end - best.start) {
    best = { start, end: lastDense + 1 };
  }

  return best;
}

/** Semua band baris yang memenuhi ambang. */
function findBands(rowDensity: number[]): Array<{ start: number; end: number }> {
  const bands: Array<{ start: number; end: number }> = [];
  let start = -1;
  let lastDense = -1;

  const close = (): void => {
    if (start !== -1 && lastDense - start + 1 >= MIN_BAND_HEIGHT) {
      bands.push({ start, end: lastDense + 1 });
    }
    start = -1;
    lastDense = -1;
  };

  for (let y = 0; y < rowDensity.length; y += 1) {
    if (rowDensity[y] >= BAND_THRESHOLD) {
      if (start === -1) start = y;
      lastDense = y;
    } else if (start !== -1 && y - lastDense > BAND_GAP_TOLERANCE) {
      close();
    }
  }
  close();

  return bands;
}

export function detectBandSlots(image: RawImage, mode: SlotMode): BandSlot[] {
  const { width, height } = image;
  const totalPixels = width * height;
  const matches = makeMatcher(image, mode);

  // Cache hasil klasifikasi: dipakai berulang untuk profil baris dan kolom.
  const mask = new Uint8Array(totalPixels);
  for (let index = 0; index < totalPixels; index += 1) {
    if (matches(index)) mask[index] = 1;
  }

  const rowDensity = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      if (mask[rowOffset + x] === 1) count += 1;
    }
    rowDensity[y] = count / width;
  }

  const slots: BandSlot[] = [];

  for (const band of findBands(rowDensity)) {
    const bandHeight = band.end - band.start;
    if (bandHeight < MIN_BAND_HEIGHT) continue;

    const columnDensity = new Array<number>(width).fill(0);
    for (let x = 0; x < width; x += 1) {
      let count = 0;
      for (let y = band.start; y < band.end; y += 1) {
        if (mask[y * width + x] === 1) count += 1;
      }
      columnDensity[x] = count / bandHeight;
    }

    // Kolom memakai ambang lebih longgar karena ornamen bisa menutup tepi.
    const columnRun = longestRun(columnDensity, DENSE_RATIO, 1);
    const slotWidth = columnRun.end - columnRun.start;
    if (slotWidth < MIN_BAND_WIDTH) continue;

    const aspect = slotWidth / bandHeight;
    if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) continue;

    // Hitung kepadatan akhir di dalam box.
    let count = 0;
    for (let y = band.start; y < band.end; y += 1) {
      for (let x = columnRun.start; x < columnRun.end; x += 1) {
        if (mask[y * width + x] === 1) count += 1;
      }
    }
    const fill = count / (slotWidth * bandHeight);
    if (fill < MIN_SLOT_FILL) continue;

    slots.push({
      x: columnRun.start,
      y: band.start,
      w: slotWidth,
      h: bandHeight,
      area: count,
      fill,
    });
  }

  return slots;
}

/**
 * Rapikan tinggi band ke grid slot bila beberapa band punya tinggi seragam.
 *
 * Ornamen yang menutup bagian bawah slot membuat band lebih pendek dari
 * seharusnya. Bila mayoritas band punya tinggi H, band yang lebih pendek
 * diperpanjang ke H (selama tidak menabrak band berikutnya), sehingga semua
 * slot konsisten.
 */
export function normalizeBandHeights(
  slots: BandSlot[],
  imageHeight: number,
): BandSlot[] {
  if (slots.length < 2) return slots;

  const heights = slots.map((slot) => slot.h).sort((a, b) => a - b);
  const median = heights[Math.floor(heights.length / 2)];
  const target = median;

  return slots.map((slot, index) => {
    if (slot.h >= target) return slot;

    const next = slots[index + 1];
    const maxBottom = next ? next.y - 4 : imageHeight;
    const bottom = Math.min(slot.y + target, maxBottom);
    const h = bottom - slot.y;
    if (h <= slot.h) return slot;

    return { ...slot, h };
  });
}
