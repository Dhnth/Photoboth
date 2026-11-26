/**
 * Utilitas foto untuk jalur upload.
 *
 * Foto dari galeri HP/komputer bisa punya rasio dan orientasi apa saja.
 * Di sini file didekode, dipotong tengah (cover) mengikuti rasio slot frame,
 * lalu diperkecil agar hemat memori—hasilnya canvas yang formatnya sama
 * dengan hasil jepretan kamera, jadi composeStrip tidak perlu diubah.
 */

/** Format yang boleh dipilih di file picker. */
export const UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Batas ukuran file sebelum diproses. */
export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

/** Sisi terpanjang hasil olahan; cukup tajam untuk strip tanpa boros memori. */
const MAX_OUTPUT_EDGE = 1280;

export class PhotoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoUploadError";
  }
}

export function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith("image/") && file.type !== "image/svg+xml";
}

/** Kembalikan pesan ramah, atau null kalau file valid. */
export function validatePhotoFile(file: File): string | null {
  if (!isSupportedImageFile(file)) {
    return `"${file.name}" bukan gambar yang didukung. Gunakan JPG, PNG, WebP, GIF, atau AVIF.`;
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    const maxMb = Math.round(UPLOAD_MAX_BYTES / (1024 * 1024));
    return `"${file.name}" terlalu besar (maksimal ${maxMb} MB).`;
  }
  return null;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

/**
 * Dekode file jadi bitmap. `createImageBitmap` dipakai lebih dulu karena
 * menghormati orientasi EXIF dan tidak memblokir main thread; kalau tidak
 * tersedia (atau gagal), fallback ke elemen <img>.
 */
async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Coba jalur fallback di bawah.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(
          new PhotoUploadError(
            `"${file.name}" tidak bisa dibaca. Coba format JPG atau PNG.`,
          ),
        );
      element.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

/**
 * Ubah file gambar menjadi canvas yang sudah di-crop ke rasio slot.
 * Melempar `PhotoUploadError` dengan pesan yang bisa langsung ditampilkan.
 */
export async function loadPhotoFile(
  file: File,
  aspectRatio: number,
): Promise<HTMLCanvasElement> {
  const problem = validatePhotoFile(file);
  if (problem) throw new PhotoUploadError(problem);

  const decoded = await decodeImageFile(file);

  try {
    const { source, width, height } = decoded;
    if (width <= 0 || height <= 0) {
      throw new PhotoUploadError(`"${file.name}" tidak punya ukuran gambar.`);
    }

    const targetAspect =
      Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
    const sourceAspect = width / height;

    let cropWidth = width;
    let cropHeight = height;
    if (sourceAspect > targetAspect) {
      cropWidth = height * targetAspect;
    } else if (sourceAspect < targetAspect) {
      cropHeight = width / targetAspect;
    }

    const cropX = (width - cropWidth) / 2;
    const cropY = (height - cropHeight) / 2;

    const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(cropWidth, cropHeight));
    const outputWidth = Math.max(1, Math.round(cropWidth * scale));
    const outputHeight = Math.max(1, Math.round(cropHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new PhotoUploadError(
        "Browser gagal menyiapkan kanvas. Coba muat ulang halaman.",
      );
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      source,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    return canvas;
  } finally {
    decoded.cleanup();
  }
}

/**
 * Thumbnail JPEG kecil (latar putih) dari canvas foto.
 * Dipakai preview strip dan panel upload supaya tidak membuat data URL besar
 * berulang kali.
 */
export function makePhotoThumbnail(
  canvas: HTMLCanvasElement,
  width = 240,
): string {
  if (typeof document === "undefined") return "";
  if (canvas.width <= 0 || canvas.height <= 0) return "";

  try {
    const safeWidth = Math.max(1, width);
    const height = Math.max(
      1,
      Math.round((canvas.height / canvas.width) * safeWidth),
    );
    const thumb = document.createElement("canvas");
    thumb.width = safeWidth;
    thumb.height = height;

    const ctx = thumb.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, safeWidth, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, safeWidth, height);

    return thumb.toDataURL("image/jpeg", 0.8);
  } catch {
    return "";
  }
}
