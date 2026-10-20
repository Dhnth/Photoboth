"use client";

/**
 * Bar unduh: PNG, PDF (jsPDF, A6), dan Share (Web Share API).
 * Semua aksi mengomposit ulang strip dari foto + warna frame terkini, lalu
 * menyimpan salinan JPEG ringan ke galeri localStorage.
 */
import { useCallback, useState } from "react";
import { composeStrip } from "@/lib/composite";
import { templateName } from "@/lib/constants";
import { saveCanvasToGallery } from "@/lib/gallery";
import { PillButton } from "@/components/ui/PillButton";

export interface DownloadBarProps {
  templateId: string;
  photos: Array<HTMLCanvasElement | null>;
  frameColor: string;
  disabled?: boolean;
}

function timestamp(): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function buildBaseName(templateId: string): string {
  return `rplbox-${templateName(templateId)
    .toLowerCase()
    .replace(/\s+/g, "-")}-${timestamp()}`;
}

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Simpan salinan ke galeri; kembalikan catatan untuk ditampilkan ke user. */
function persistCanvas(canvas: HTMLCanvasElement, templateId: string): string {
  try {
    const result = saveCanvasToGallery(canvas, templateId);
    if (!result.saved) {
      return " Hasil tidak tersimpan ke galeri karena penyimpanan browser penuh.";
    }
    if (result.dropped > 0) {
      return ` Galeri penuh—${result.dropped} hasil lama dihapus agar hasil baru muat.`;
    }
    return "";
  } catch {
    return " Hasil tidak tersimpan ke galeri.";
  }
}

export function DownloadBar({
  templateId,
  photos,
  frameColor,
  disabled = false,
}: DownloadBarProps) {
  const [busy, setBusy] = useState<"png" | "pdf" | "share" | null>(null);
  const [message, setMessage] = useState("");

  const handlePng = useCallback(async () => {
    if (disabled) return;
    setBusy("png");
    setMessage("");
    const baseName = buildBaseName(templateId);
    try {
      const canvas = await composeStrip(photos, templateId, { frameColor });
      const dataUrl = canvas.toDataURL("image/png");
      triggerDownload(dataUrl, `${baseName}.png`);
      setMessage(`PNG berhasil diunduh.${persistCanvas(canvas, templateId)}`);
    } catch (error) {
      setMessage(`Gagal membuat PNG: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  }, [disabled, photos, templateId, frameColor]);

  const handlePdf = useCallback(async () => {
    if (disabled) return;
    setBusy("pdf");
    setMessage("");
    const baseName = buildBaseName(templateId);
    try {
      const canvas = await composeStrip(photos, templateId, { frameColor });
      const { jsPDF } = await import("jspdf");

      // JPEG untuk PDF agar ukuran file wajar (PNG lossless bisa >10 MB).
      const jpegUrl = canvas.toDataURL("image/jpeg", 0.92);

      // A6 portrait; gambar di-fit ke tinggi halaman tanpa terpotong.
      const pdf = new jsPDF({ unit: "mm", format: "a6", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const availableW = pageWidth - margin * 2;
      const availableH = pageHeight - margin * 2;
      const ratio = canvas.width / canvas.height;

      let drawHeight = availableH;
      let drawWidth = drawHeight * ratio;
      if (drawWidth > availableW) {
        drawWidth = availableW;
        drawHeight = drawWidth / ratio;
      }

      pdf.addImage(
        jpegUrl,
        "JPEG",
        (pageWidth - drawWidth) / 2,
        (pageHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      pdf.save(`${baseName}.pdf`);
      setMessage(`PDF berhasil diunduh.${persistCanvas(canvas, templateId)}`);
    } catch (error) {
      setMessage(`Gagal membuat PDF: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  }, [disabled, photos, templateId, frameColor]);

  const handleShare = useCallback(async () => {
    if (disabled) return;
    setBusy("share");
    setMessage("");
    const baseName = buildBaseName(templateId);
    try {
      const canvas = await composeStrip(photos, templateId, { frameColor });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (
        blob &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
      ) {
        const file = new File([blob], `${baseName}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "RPLBox",
            text: "Hasil photobooth RPLBox",
          });
          setMessage(
            `Berhasil dibagikan.${persistCanvas(canvas, templateId)}`,
          );
          return;
        }
      }

      // Fallback yang jujur: jangan menyalin URL studio yang tidak berisi hasil.
      setMessage(
        "Browser ini belum mendukung share file. Silakan unduh PNG untuk membagikan hasilnya.",
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setMessage("");
      } else {
        setMessage(`Gagal membagikan: ${(error as Error).message}`);
      }
    } finally {
      setBusy(null);
    }
  }, [disabled, photos, templateId, frameColor]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <PillButton
          variant="primary"
          icon="download"
          onClick={handlePng}
          disabled={disabled || busy !== null}
        >
          {busy === "png" ? "Memproses…" : "Download PNG"}
        </PillButton>
        <PillButton
          variant="tertiary"
          icon="picture_as_pdf"
          onClick={handlePdf}
          disabled={disabled || busy !== null}
        >
          {busy === "pdf" ? "Memproses…" : "Download PDF"}
        </PillButton>
        <PillButton
          variant="ghost"
          icon="share"
          onClick={handleShare}
          disabled={disabled || busy !== null}
        >
          {busy === "share" ? "Menyiapkan…" : "Share"}
        </PillButton>
      </div>
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="text-xs font-semibold text-on-surface-muted"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default DownloadBar;
