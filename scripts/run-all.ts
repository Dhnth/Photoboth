/**
 * Pipeline Fase 1: deteksi → bersihkan template → generate slots.json →
 * thumbnail WebP ringan.
 * Jalankan dengan: npm run process-templates
 */
import fs from "node:fs/promises";
import path from "node:path";
import { detectAllTemplates, generateMetadata } from "./generate-metadata";
import {
  cleanTemplate,
  listTemplateFiles,
  READY_DIR,
  TEMPLATE_DIR,
} from "./clean-template";
import { createDummyTemplate, DUMMY_FILE } from "./create-dummy";
import { generateThumbnails } from "./generate-thumbnails";

async function main(): Promise<void> {
  let files = await listTemplateFiles();
  let usedDummy = false;

  // Fallback 1.7: kalau folder template kosong, buat dummy agar pipeline teruji.
  if (files.length === 0) {
    console.warn("⚠️  /public/template/ kosong — membuat template dummy untuk verifikasi.");
    await createDummyTemplate(TEMPLATE_DIR);
    usedDummy = true;
    files = await listTemplateFiles();
  }

  console.log("=".repeat(64));
  console.log("RPLBOX — PROSES TEMPLATE (FASE 1)");
  console.log("=".repeat(64));
  console.log(`Ditemukan ${files.length} template di ${TEMPLATE_DIR}\n`);

  await fs.mkdir(READY_DIR, { recursive: true });

  // 1.2 Deteksi slot green screen
  console.log("▸ [1/4] Deteksi green screen…");
  const detections = await detectAllTemplates();
  for (const result of detections) {
    console.log(
      `  ${result.file} (${result.width}x${result.height}) → ${result.slots.length} slot [${result.strategy}]`,
    );
    for (const slot of result.slots) {
      console.log(
        `      slot ${slot.index + 1}: x=${slot.x} y=${slot.y} w=${slot.w} h=${slot.h}`,
      );
    }
  }

  // 1.3 Bersihkan template
  console.log("\n▸ [2/4] Bersihkan template (area slot → transparan)…");
  for (const result of detections) {
    const source = path.join(TEMPLATE_DIR, result.file);
    const destination = path.join(READY_DIR, result.file);
    const cleaned = await cleanTemplate(source, destination, {
      mode: result.strategy,
      slots: result.slots,
    });
    console.log(
      `  ${result.file} → ready/${result.file} (${cleaned.removedPixels.toLocaleString("id-ID")} pixel dihapus, mode ${result.strategy})`,
    );
  }

  // 1.4 Generate metadata
  console.log("\n▸ [3/4] Generate slots.json…");
  const metadata = await generateMetadata(detections);
  console.log(`  ${metadata.templates.length} template ditulis ke ready/slots.json`);

  // 1.5 Thumbnail ringan untuk pemilih frame
  console.log("\n▸ [4/4] Generate thumbnail WebP…");
  const thumbnailCount = await generateThumbnails();
  console.log(`  ${thumbnailCount} thumbnail ditulis ke ready/thumbs/`);

  console.log("\n" + "=".repeat(64));
  console.log("✅ SELESAI");
  console.log("=".repeat(64));
  console.log("Template diproses:");
  for (const template of metadata.templates) {
    console.log(`  • ${template.id}: ${template.slots.length} slot`);
  }
  console.log(`\nFile bersih : ${READY_DIR}`);
  console.log(`Metadata    : ${path.join(READY_DIR, "slots.json")}`);
  console.log(`Thumbnail   : ${path.join(READY_DIR, "thumbs")}`);

  if (usedDummy) {
    console.log(
      `\n⚠️  CATATAN: template yang diproses adalah DUMMY (${DUMMY_FILE}).\n` +
        "   Ganti dengan template PNG asli di /public/template/ lalu jalankan\n" +
        "   `npm run process-templates` lagi.",
    );
  }
}

main().catch((error) => {
  console.error("Pipeline gagal:", error);
  process.exitCode = 1;
});
