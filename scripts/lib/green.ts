/**
 * Utilitas bersama untuk pipeline green screen.
 * Kriteria GREEN (spesifikasi Fase 1):
 *   hue ∈ [80, 160] derajat, saturation > 0.20, value > 0.20
 */

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  area: number;
}

export const GREEN_HUE_MIN = 80;
export const GREEN_HUE_MAX = 160;
export const GREEN_SATURATION_MIN = 0.2;
export const GREEN_VALUE_MIN = 0.2;

/**
 * Ambang tambahan setelah bounding box dirapikan.
 * Tujuannya membuang elemen dekoratif hijau (daun, stiker, rumput laut)
 * yang lolos filter luas minimum 500px.
 */
export const MIN_SLOT_FILL = 0.6;
/** Kepadatan minimum sebuah baris/kolom agar dianggap bagian slot padat. */
export const DENSE_RATIO = 0.35;

/** Konversi RGB (0-255) ke HSV dengan hue dalam derajat (0-360). */
export function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

/** Cek apakah sebuah pixel termasuk area green screen. */
export function isGreenPixel(r: number, g: number, b: number): boolean {
  const { h, s, v } = rgbToHsv(r, g, b);
  return (
    h >= GREEN_HUE_MIN &&
    h <= GREEN_HUE_MAX &&
    s > GREEN_SATURATION_MIN &&
    v > GREEN_VALUE_MIN
  );
}
