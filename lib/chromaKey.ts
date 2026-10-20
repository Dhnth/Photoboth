/**
 * Chroma key (green screen remover) berbasis Canvas ImageData.
 *
 * Langkah:
 *  1. Klasifikasi: konversi tiap pixel RGB → HSV. Pixel dengan hue di rentang
 *     hijau dan saturasi/value cukup dianggap background dan dibuat transparan
 *     (alpha 0).
 *  2. Feathering: pixel yang terlihat tapi bertetangga dengan area transparan
 *     diturunkan alpha-nya bertahap (radius 1–2 px) supaya tepi cut-out tidak
 *     bergerigi.
 *  3. Spill reduction: warna "hijau pantulan" di tepi cut-out ditekan dengan
 *     menurunkan channel G, sehingga tidak ada garis hijau di sekeliling orang.
 *
 * Fungsi ini TIDAK mengubah ImageData input — hasil dikembalikan sebagai
 * ImageData baru.
 */

export interface ChromaKeyOptions {
  /** 0–1. Makin besar makin longgar toleransi hue/saturasi/value. */
  tolerance?: number;
  /** Radius feathering (dibulatkan ke 1–2 px). */
  feather?: number;
  /** 0–1. Proporsi penekanan channel G pada tepi. */
  spillReduction?: number;
}

/** Rentang dasar hijau (kriteria chroma key Fase 2). */
const HUE_MIN = 80;
const HUE_MAX = 160;
const SATURATION_MIN = 0.15;
const VALUE_MIN = 0.15;

function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
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

export function chromaKey(
  imageData: ImageData,
  options: ChromaKeyOptions = {},
): ImageData {
  const tolerance = options.tolerance ?? 0.08;
  const feather = Math.max(0, Math.min(2, Math.round(options.feather ?? 1)));
  const spillReduction = Math.max(0, Math.min(1, options.spillReduction ?? 0.3));

  const width = imageData.width;
  const height = imageData.height;
  const total = width * height;

  // Salin supaya input tidak termutasi.
  const out = new Uint8ClampedArray(imageData.data);
  const transparent = new Uint8Array(total);

  // Rentang efektif setelah toleransi diterapkan.
  const hueMin = Math.max(0, HUE_MIN - tolerance * 60);
  const hueMax = Math.min(360, HUE_MAX + tolerance * 60);
  const satMin = Math.max(0, SATURATION_MIN - tolerance * 0.3);
  const valMin = Math.max(0, VALUE_MIN - tolerance * 0.3);

  // Pass 1 — klasifikasi background hijau.
  for (let i = 0; i < total; i += 1) {
    const o = i * 4;
    const { h, s, v } = rgbToHsv(out[o], out[o + 1], out[o + 2]);
    if (h >= hueMin && h <= hueMax && s > satMin && v > valMin) {
      transparent[i] = 1;
      out[o + 3] = 0;
    }
  }

  if (feather === 0 && spillReduction === 0) {
    return new ImageData(out, width, height);
  }

  // Pass 2 & 3 — feather + spill reduction untuk pixel yang terlihat.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (transparent[i] === 1) continue;

      // Jarak Chebyshev terdekat ke pixel transparan dalam radius feather.
      let nearest = -1;
      for (let dy = -feather; dy <= feather && nearest !== 1; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -feather; dx <= feather; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          if (transparent[yy * width + xx] === 1) {
            const d = Math.max(Math.abs(dx), Math.abs(dy));
            if (nearest === -1 || d < nearest) nearest = d;
            if (nearest === 1) break;
          }
        }
      }

      if (nearest === -1) continue;

      const o = i * 4;
      const alphaFactor = nearest / (feather + 1);

      // Feathering: makin dekat ke background, makin transparan.
      out[o + 3] = Math.round(255 * alphaFactor);

      // Spill reduction: tekan channel G di tepi, jangan sampai lebih tinggi
      // dari channel merah/biru supaya tidak ada pendar hijau.
      if (spillReduction > 0) {
        const g0 = out[o + 1];
        const limit = Math.max(out[o], out[o + 2]);
        const strength = spillReduction * (1 - alphaFactor);
        const reduced = g0 - (g0 - limit) * strength;
        out[o + 1] = Math.max(0, Math.min(255, Math.round(reduced - g0 * strength * 0.25)));
      }
    }
  }

  return new ImageData(out, width, height);
}
