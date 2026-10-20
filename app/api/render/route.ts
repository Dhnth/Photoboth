/**
 * POST /api/render
 *
 * Merender satu strip final di sisi server memakai sharp, pada resolusi penuh
 * template. Dipakai untuk integrasi otomatis / server-side; unduhan interaktif
 * di /studio memakai komposit Canvas di klien (lib/composite.ts).
 *
 * Body JSON:
 *   {
 *     templateId: string,
 *     photos: string[],        // data URL PNG/JPEG/WebP per slot, urut dari atas
 *     frameColor?: string      // hex, default #ffffff
 *   }
 *
 * Respons: image/png.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const maxDuration = 30;

interface RenderRequestBody {
  templateId?: string;
  photos?: string[];
  frameColor?: string;
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TemplateMeta {
  id: string;
  file: string;
  width: number;
  height: number;
  slots: Slot[];
}

interface SlotsFile {
  templates: TemplateMeta[];
}

const READY_DIR = path.join(process.cwd(), "public", "ready");
const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_INPUT_PIXELS = 20_000_000;

/** Cache metadata per instance serverless (hemat I/O pada request berulang). */
let slotsCache: SlotsFile | null = null;

async function readSlots(): Promise<SlotsFile> {
  if (slotsCache) return slotsCache;
  const raw = await fs.readFile(path.join(READY_DIR, "slots.json"), "utf8");
  slotsCache = JSON.parse(raw) as SlotsFile;
  return slotsCache;
}

/** Decode data URL dengan validasi tipe & ukuran agar sharp tidak dipakai sembarangan. */
function decodeDataUrl(dataUrl: string): Buffer {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new Error("Foto harus berupa data URL PNG, JPEG, atau WebP.");
  }

  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.byteLength === 0) throw new Error("Data foto kosong.");
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    throw new Error("Ukuran satu foto melebihi 6 MB.");
  }
  return buffer;
}

export async function POST(request: Request): Promise<Response> {
  let body: RenderRequestBody;
  try {
    body = (await request.json()) as RenderRequestBody;
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON." }, { status: 400 });
  }

  const { templateId, photos } = body;
  if (!templateId || typeof templateId !== "string") {
    return NextResponse.json(
      { error: "templateId wajib diisi." },
      { status: 400 },
    );
  }
  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json(
      { error: "photos harus berupa array data URL yang tidak kosong." },
      { status: 400 },
    );
  }
  if (!photos.every((photo) => typeof photo === "string")) {
    return NextResponse.json(
      { error: "Setiap item photos harus berupa string data URL." },
      { status: 400 },
    );
  }

  const frameColor =
    body.frameColor && HEX_PATTERN.test(body.frameColor)
      ? body.frameColor
      : "#ffffff";

  let slots: SlotsFile;
  try {
    slots = await readSlots();
  } catch {
    return NextResponse.json(
      { error: "Metadata template tidak tersedia. Jalankan npm run process-templates." },
      { status: 500 },
    );
  }

  const template = slots.templates.find((item) => item.id === templateId);
  if (!template) {
    return NextResponse.json(
      { error: `Template "${templateId}" tidak ditemukan.` },
      { status: 404 },
    );
  }

  if (photos.length > template.slots.length) {
    return NextResponse.json(
      {
        error: `Template ini hanya punya ${template.slots.length} slot, tetapi ${photos.length} foto dikirim.`,
      },
      { status: 400 },
    );
  }

  try {
    const layerPromises = template.slots.map(async (slot, index) => {
      const dataUrl = photos[index];
      if (!dataUrl) return null;

      const input = await sharp(decodeDataUrl(dataUrl), {
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize(slot.w, slot.h, { fit: "cover", position: "center" })
        .png()
        .toBuffer();

      return { input, left: slot.x, top: slot.y };
    });

    const resolved = await Promise.all(layerPromises);
    const photoLayers = resolved.flatMap((layer) => (layer ? [layer] : []));

    const templateBuffer = await fs.readFile(path.join(READY_DIR, template.file));

    const png = await sharp({
      create: {
        width: template.width,
        height: template.height,
        channels: 4,
        background: frameColor,
      },
    })
      .composite([
        ...photoLayers,
        { input: templateBuffer, left: 0, top: 0 },
      ])
      .png()
      .toBuffer();

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Jangan bocorkan detail internal ke client; log untuk operator.
    console.error("POST /api/render gagal:", error);
    const message =
      error instanceof Error && error.message.startsWith("Foto")
        ? error.message
        : "Gagal merender strip. Periksa input lalu coba lagi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
