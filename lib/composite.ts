/**
 * Komposit strip foto final.
 *
 * Urutan menggambar (penting untuk efek green screen):
 *  1. Kanvas diisi warna frame → menjadi latar untuk area cut-out.
 *  2. Untuk setiap slot: isi backdrop warna frame, lalu gambar foto user
 *     dengan cover-fit (center crop). Bagian transparan hasil chroma key
 *     otomatis memperlihatkan warna frame di belakangnya.
 *  3. Template PNG digambar di atasnya. Area slot pada template sudah
 *     transparan (hasil Fase 1), jadi foto tetap terlihat dan bingkai
 *     template menutupi tepi foto secara rapi.
 */
import {
  DEFAULT_FRAME_COLOR,
  SLOTS_PER_STRIP,
  TEMPLATES,
  type Template,
} from "./constants";

export interface ComposeOptions {
  frameColor?: string;
  /** Isi slot yang belum ada fotonya dengan placeholder abu-abu. */
  placeholders?: boolean;
  /** Skala render relatif terhadap ukuran template. Default 2 (tajam). */
  scale?: number;
}

const templateImageCache = new Map<string, Promise<HTMLImageElement>>();

/** Muat (dan cache) gambar template dari /ready. */
export function loadTemplateImage(template: Template): Promise<HTMLImageElement> {
  const cached = templateImageCache.get(template.id);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat template ${template.file}`));
    img.src = `/ready/${template.file}`;
  });

  templateImageCache.set(template.id, promise);
  // Jangan cache kegagalan: user harus bisa mencoba lagi tanpa reload.
  promise.catch(() => {
    if (templateImageCache.get(template.id) === promise) {
      templateImageCache.delete(template.id);
    }
  });

  return promise;
}

export function findTemplate(templateId: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === templateId);
}

/**
 * Gambar `source` ke dalam kotak tujuan dengan mode cover (center crop).
 * Objek digambar penuh tanpa distorsi, sisi berlebih dipotong.
 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  if (sourceWidth <= 0 || sourceHeight <= 0) return;

  const scale = Math.max(dw / sourceWidth, dh / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = dx + (dw - drawWidth) / 2;
  const offsetY = dy + (dh - drawHeight) / 2;

  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
}

/** Faktor skala baku agar hasil render tetap tajam di layar retina. */
const RENDER_SCALE = 2;

export async function composeStrip(
  photos: Array<HTMLCanvasElement | null>,
  templateId: string,
  options: ComposeOptions = {},
): Promise<HTMLCanvasElement> {
  const template = findTemplate(templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" tidak ditemukan`);
  }

  const frameHex = options.frameColor ?? DEFAULT_FRAME_COLOR.hex;
  const renderScale = Math.max(1, options.scale ?? RENDER_SCALE);
  const templateImage = await loadTemplateImage(template);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(template.width * renderScale);
  canvas.height = Math.round(template.height * renderScale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(renderScale, renderScale);

  // 1. Latar frame.
  ctx.fillStyle = frameHex;
  ctx.fillRect(0, 0, template.width, template.height);

  // 2. Foto user per slot.
  const placeholders = options.placeholders ?? false;
  template.slots.forEach((slot, index) => {
    const photo = photos[index];

    if (!photo) {
      if (placeholders) {
        // Slot kosong → placeholder abu-abu netral.
        ctx.fillStyle = "#d9d5e4";
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        ctx.save();
        ctx.strokeStyle = "rgba(28, 25, 44, 0.35)";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.strokeRect(slot.x + 6, slot.y + 6, slot.w - 12, slot.h - 12);
        ctx.restore();
      }
      return;
    }

    ctx.fillStyle = frameHex;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

    // Clip ke kotak slot. drawCover sengaja menggambar lebih besar dari slot
    // (center crop); tanpa clip, bagian foto bisa bocor ke area transparan
    // template lain dan terlihat seperti menimpa slot di sebelahnya.
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();
    drawCover(ctx, photo, photo.width, photo.height, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
  });

  // 3. Template di atas foto.
  ctx.drawImage(templateImage, 0, 0, template.width, template.height);

  return canvas;
}

/** Simbol bantu untuk komponen: berapa foto yang dibutuhkan. */
export const REQUIRED_PHOTOS = SLOTS_PER_STRIP;
