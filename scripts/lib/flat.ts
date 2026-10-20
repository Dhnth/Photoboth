/**
 * Klasifikasi "bidang polos" untuk template yang tidak memakai green screen.
 *
 * Sebagian template memakai bidang putih atau hitam polos sebagai penanda
 * slot. Pixel dianggap polos bila saturasi rendah dan nilainya ekstrem
 * (sangat terang atau sangat gelap). Ambang saturasi 0.12 dipilih agar
 * bayangan tipis dan tekstur kertas tetap terbaca sebagai polos, sementara
 * ornamen berwarna tidak ikut terhapus.
 */

/** Pixel dianggap "polos" jika saturasi rendah dan terang/gelap ekstrem. */
export function isFlatPixel(
  r: number,
  g: number,
  b: number,
  light: boolean,
): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Saturasi kasar (delta / max) harus rendah agar warna dekoratif tidak ikut.
  const saturation = max === 0 ? 0 : delta / max;
  if (saturation > 0.12) return false;

  return light ? min >= 232 : max <= 40;
}
