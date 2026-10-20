import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isGreenPixel } from "./lib/green";
import { isFlatPixel } from "./lib/flat";
import type { SlotMode } from "./lib/bands";

export const TEMPLATE_DIR = path.join(process.cwd(), "public", "template");
export const READY_DIR = path.join(process.cwd(), "public", "ready");

export interface CleanOptions {
  /** Strategi yang dipakai saat deteksi slot. */
  mode?: SlotMode;
  /** Slot hasil deteksi, dipakai untuk membersihkan template non-green. */
  slots?: Array<{ x: number; y: number; w: number; h: number }>;
}

/** Daftar file PNG template, diurutkan natural (1, 2, ..., 10). */
export async function listTemplateFiles(): Promise<string[]> {
  const entries = await fs.readdir(TEMPLATE_DIR);
  return entries
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/**
 * Hapus area slot dari template dan jadikan transparan.
 *
 * - Mode green: semua pixel hijau di seluruh gambar dihapus. Ini sesuai
 *   spesifikasi Fase 1 karena template green screen memang hanya memakai
 *   hijau untuk slot.
 * - Mode flat-light / flat-dark: hanya pixel polos di DALAM kotak slot yang
 *   dihapus. Tujuannya agar ornamen yang menimpa slot (stiker, karakter)
 *   tetap terlihat di atas foto.
 *
 * Resolusi dan channel asli dipertahankan; output selalu RGBA agar alpha
 * benar-benar tersimpan.
 */
export async function cleanTemplate(
  sourcePath: string,
  destinationPath: string,
  options: CleanOptions = {},
): Promise<{ removedPixels: number; width: number; height: number }> {
  const image = sharp(sourcePath);
  const metadata = await image.metadata();

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mode: SlotMode = options.mode ?? "green";
  const slots = options.slots ?? [];

  /** Apakah pixel (x,y) berada di dalam salah satu slot? */
  const insideSlot = (x: number, y: number): boolean =>
    slots.some(
      (slot) =>
        x >= slot.x &&
        x < slot.x + slot.w &&
        y >= slot.y &&
        y < slot.y + slot.h,
    );

  let removedPixels = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      let shouldRemove = false;
      if (mode === "green") {
        shouldRemove = isGreenPixel(r, g, b);
      } else if (insideSlot(x, y)) {
        shouldRemove = isFlatPixel(r, g, b, mode === "flat-light");
      }

      if (shouldRemove) {
        data[offset + 3] = 0;
        removedPixels += 1;
      }
    }
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png({ compressionLevel: 9 })
    .withMetadata({
      density: metadata.density ?? 72,
      orientation: metadata.orientation,
    })
    .toFile(destinationPath);

  return {
    removedPixels,
    width: info.width,
    height: info.height,
  };
}
