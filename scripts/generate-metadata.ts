import fs from "node:fs/promises";
import path from "node:path";
import {
  type DetectionResult,
  detectTemplateSlots,
} from "./detect-green-screen";
import { listTemplateFiles, READY_DIR, TEMPLATE_DIR } from "./clean-template";

export interface SlotMetadata {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TemplateMetadata {
  id: string;
  file: string;
  width: number;
  height: number;
  slots: SlotMetadata[];
}

export interface SlotsFile {
  templates: TemplateMetadata[];
}

export const SLOTS_FILE = path.join(READY_DIR, "slots.json");

/** "demo-4cut.png" → "demo-4cut" */
export function templateId(fileName: string): string {
  return path.basename(fileName, path.extname(fileName));
}

export function toTemplateMetadata(result: DetectionResult): TemplateMetadata {
  return {
    id: templateId(result.file),
    file: result.file,
    width: result.width,
    height: result.height,
    // x/y/w/h bulat; area internal tidak perlu ikut ke JSON.
    slots: result.slots.map(({ x, y, w, h }) => ({ x, y, w, h })),
  };
}

export async function detectAllTemplates(): Promise<DetectionResult[]> {
  const files = await listTemplateFiles();
  if (files.length === 0) return [];

  const results: DetectionResult[] = [];
  for (const file of files) {
    results.push(await detectTemplateSlots(path.join(TEMPLATE_DIR, file)));
  }
  return results;
}

/**
 * Jalankan deteksi lalu tulis /public/ready/slots.json.
 *
 * `precomputed` dipakai oleh run-all agar hasil deteksi langkah 1.2 tidak
 * dihitung ulang di langkah 1.4. Tanpa argumen, fungsi ini mendeteksi sendiri
 * sehingga tetap bisa dipakai sebagai CLI/step mandiri.
 */
export async function generateMetadata(
  precomputed?: DetectionResult[],
): Promise<SlotsFile> {
  const results = precomputed ?? (await detectAllTemplates());
  const payload: SlotsFile = {
    templates: results.map(toTemplateMetadata),
  };

  await fs.mkdir(READY_DIR, { recursive: true });
  await fs.writeFile(SLOTS_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return payload;
}
