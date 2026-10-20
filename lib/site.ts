const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string | undefined): string | null {
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

/**
 * URL produksi dipakai untuk canonical, sitemap, dan Open Graph.
 * Di Vercel, URL deployment otomatis terdeteksi. Di hosting lain, set
 * NEXT_PUBLIC_SITE_URL ke domain final.
 */
export const SITE_URL =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeSiteUrl(process.env.VERCEL_URL) ??
  FALLBACK_SITE_URL;

export const SITE_NAME = "RPLBox";

export const SITE_TITLE = "RPLBox — Photobooth Online Gratis";

export const SITE_DESCRIPTION =
  "Photobooth online gratis di browser. Ambil 4 foto, pilih dari 15 frame, pakai green screen opsional, lalu unduh strip PNG atau PDF. Tanpa install.";

export const SITE_TAGLINE =
  "Empat pose, satu strip, langsung jadi — photobooth browser dengan 15 frame dan green screen opsional.";

export const SEO_KEYWORDS = [
  "photobooth online",
  "photo booth online",
  "photobooth browser",
  "photobooth gratis",
  "strip foto",
  "photo strip",
  "4 cut photobooth",
  "four cut photo",
  "green screen photobooth",
  "chroma key",
  "frame photobooth",
  "RPLBox",
];

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "RPLBox — photobooth online dengan tiga strip foto empat pose",
};

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
