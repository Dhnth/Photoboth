import path from "node:path";
import sharp from "sharp";
import { type RawImage } from "./lib/green";
import { type SlotMode, detectBandSlots, normalizeBandHeights } from "./lib/bands";

export interface DetectedSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  area: number;
  /** Indeks urutan setelah sorting (y lalu x). */
  index: number;
}

export interface DetectionResult {
  file: string;
  width: number;
  height: number;
  slots: DetectedSlot[];
  /** Strategi yang berhasil dipakai. */
  strategy: "green" | "flat-light" | "flat-dark";
}

/** Baca PNG sebagai raw RGBA supaya index pixel konsisten 4 byte. */
export async function readRawRgba(filePath: string): Promise<RawImage> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

/**
 * Deteksi slot dengan strategi berlapis:
 * 1. Green screen (jalur utama sesuai spesifikasi).
 * 2. Bila 0 slot, coba bidang putih polos.
 * 3. Bila masih 0, coba bidang hitam polos.
 *
 * Template yang memakai green screen tidak terpengaruh fallback karena
 * fallback hanya aktif saat jalur utama menghasilkan nol slot.
 */
export async function detectTemplateSlots(
  filePath: string,
): Promise<DetectionResult> {
  const raw = await readRawRgba(filePath);

  const modes: SlotMode[] = ["green", "flat-light", "flat-dark"];
  let strategy: SlotMode = "green";
  let slots = detectBandSlots(raw, "green");

  if (slots.length === 0) {
    for (const mode of modes.slice(1)) {
      slots = detectBandSlots(raw, mode);
      if (slots.length > 0) {
        strategy = mode;
        break;
      }
    }
  }

  slots = normalizeBandHeights(slots, raw.height);

  // Urutan pengambilan foto: atas → bawah, lalu kiri → kanan.
  slots.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

  return {
    file: path.basename(filePath),
    width: raw.width,
    height: raw.height,
    strategy,
    slots: slots.map((slot, index) => ({
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      area: slot.area,
      index,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* CLI: npx ts-node scripts/detect-green-screen.ts [file.png ...]      */
/* ------------------------------------------------------------------ */
async function main(): Promise<void> {
  const { listTemplateFiles, TEMPLATE_DIR } = await import("./clean-template");
  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args.map((arg) => path.resolve(arg))
      : (await listTemplateFiles()).map((file) => path.join(TEMPLATE_DIR, file));

  if (files.length === 0) {
    console.log("Tidak ada file PNG di /public/template/.");
    return;
  }

  for (const file of files) {
    const result = await detectTemplateSlots(file);
    console.log(
      `\n${result.file} (${result.width}x${result.height}) — ${result.slots.length} slot [${result.strategy}]`,
    );
    for (const slot of result.slots) {
      console.log(
        `  slot ${slot.index + 1}: x=${slot.x} y=${slot.y} w=${slot.w} h=${slot.h} (luas ${slot.area}px)`,
      );
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Deteksi gagal:", error);
    process.exitCode = 1;
  });
}
