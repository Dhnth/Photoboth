/**
 * Generator template dummy (fallback langkah 1.7).
 *
 * Dipakai HANYA jika /public/template/ kosong, supaya pipeline Fase 1 tetap
 * bisa diverifikasi. Template ini bukan karya desain final — user wajib
 * menggantinya dengan template asli.
 *
 * Kanvas 600x1800, background #fffdf9, 4 kotak hijau murni #00ff00
 * berukuran 540x380 pada x=30 dan y=80/500/920/1340, border 4px #1c192c.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const DUMMY_FILE = "demo-4cut.png";
export const DUMMY_WIDTH = 600;
export const DUMMY_HEIGHT = 1800;
export const DUMMY_SLOTS = [80, 500, 920, 1340];

export async function createDummyTemplate(directory: string): Promise<string> {
  const filePath = path.join(directory, DUMMY_FILE);

  const rectangles = DUMMY_SLOTS.map(
    (y) => `<rect x="30" y="${y}" width="540" height="380" fill="#00ff00"/>`,
  ).join("");

  const svg = `<svg width="${DUMMY_WIDTH}" height="${DUMMY_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${DUMMY_WIDTH}" height="${DUMMY_HEIGHT}" fill="#fffdf9"/>
  ${rectangles}
  <rect x="2" y="2" width="${DUMMY_WIDTH - 4}" height="${DUMMY_HEIGHT - 4}" fill="none" stroke="#1c192c" stroke-width="4"/>
</svg>`;

  await fs.mkdir(directory, { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(filePath);

  return filePath;
}
