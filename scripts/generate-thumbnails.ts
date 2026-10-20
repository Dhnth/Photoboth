/**
 * Generate thumbnail WebP ringan untuk pemilih frame.
 *
 * Template bersih di /public/ready berukuran besar (±0.5–1.5 MB per file).
 * Memuat semuanya sebagai thumbnail akan memberatkan hosting, jadi pipeline
 * ini membuat versi kecil (lebar 360 px, WebP) di /public/ready/thumbs.
 *
 * Jalankan mandiri: npx ts-node --project tsconfig.scripts.json scripts/generate-thumbnails.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { READY_DIR } from "./clean-template";

export const THUMB_DIR = path.join(READY_DIR, "thumbs");

/** Lebar thumbnail (2x dari lebar tampil ±180 px agar tajam di retina). */
const THUMB_WIDTH = 360;

export async function generateThumbnails(): Promise<number> {
  await fs.mkdir(THUMB_DIR, { recursive: true });

  const entries = await fs.readdir(READY_DIR);
  const files = entries
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "id", { numeric: true }));

  for (const file of files) {
    const source = path.join(READY_DIR, file);
    const destination = path.join(
      THUMB_DIR,
      file.replace(/\.png$/i, ".webp"),
    );

    await sharp(source)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(destination);
  }

  return files.length;
}

if (require.main === module) {
  generateThumbnails()
    .then((count) => {
      console.log(`✅ ${count} thumbnail WebP ditulis ke ${THUMB_DIR}`);
    })
    .catch((error) => {
      console.error("Gagal membuat thumbnail:", error);
      process.exitCode = 1;
    });
}
