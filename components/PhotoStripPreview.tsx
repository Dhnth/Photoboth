"use client";

/**
 * Preview strip vertikal 4-cut.
 *
 * - Menampilkan hasil komposit nyata (template + foto + warna frame) sebagai
 *   gambar, dan di-regenerate otomatis saat ada perubahan.
 * - Slot kosong tampil sebagai placeholder abu-abu.
 * - Tiap foto punya dua aksi: ambil ulang lewat kamera atau upload file.
 * - File bisa ditarik & dilepas langsung ke slot tertentu (desktop).
 * - User bisa ganti warna frame (6 swatch); preview live update.
 * - Kalau komposit gagal (mis. template gagal diunduh), tampil pesan + tombol
 *   coba lagi—bukan spinner tanpa akhir.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import Image from "next/image";
import {
  FRAME_COLORS,
  SLOTS_PER_STRIP,
  TEMPLATES,
  templateName,
} from "@/lib/constants";
import { composeStrip } from "@/lib/composite";
import { makePhotoThumbnail } from "@/lib/photo";
import { DownloadBar } from "@/components/DownloadBar";

export interface PhotoStripPreviewProps {
  photos: Array<HTMLCanvasElement | null>;
  templateId: string;
  frameColor: string;
  onFrameColorChange: (hex: string) => void;
  /** Minta ambil ulang foto pada index tertentu (0-based). */
  onRetake: (index: number) => void;
  /** Buka file picker untuk slot tertentu (0-based). */
  onUpload: (index: number) => void;
  /** Terima file yang ditarik & dilepas ke slot tertentu. */
  onDropFiles?: (files: File[], index: number) => void;
  /** Nonaktifkan aksi upload saat file sedang diproses. */
  uploadBusy?: boolean;
}

export function PhotoStripPreview({
  photos,
  templateId,
  frameColor,
  onFrameColorChange,
  onRetake,
  onUpload,
  onDropFiles,
  uploadBusy = false,
}: PhotoStripPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const sequenceRef = useRef(0);

  const template = useMemo(
    () => TEMPLATES.find((item) => item.id === templateId),
    [templateId],
  );

  const thumbnails = useMemo(
    () => photos.map((photo) => (photo ? makePhotoThumbnail(photo) : null)),
    [photos],
  );

  const handleDrop = (event: DragEvent, index: number): void => {
    event.preventDefault();
    event.stopPropagation();
    setDragSlot(null);
    if (uploadBusy || !onDropFiles) return;

    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) onDropFiles(files, index);
  };

  // Regenerasi preview (di-debounce) setiap opsi berubah.
  useEffect(() => {
    if (!template) return;
    const sequence = ++sequenceRef.current;
    const handle = window.setTimeout(async () => {
      try {
        const canvas = await composeStrip(photos, templateId, {
          frameColor,
          placeholders: true,
          scale: 1,
        });
        if (sequenceRef.current !== sequence) return;
        setPreviewUrl(canvas.toDataURL("image/png"));
        setError("");
      } catch {
        if (sequenceRef.current === sequence) {
          setPreviewUrl("");
          setError(
            "Gagal menyiapkan preview. Periksa koneksi lalu coba lagi.",
          );
        }
      }
    }, 120);

    return () => window.clearTimeout(handle);
  }, [template, templateId, photos, frameColor, retryKey]);

  const filledCount = photos.filter(Boolean).length;
  const complete = filledCount >= SLOTS_PER_STRIP;

  return (
    <div id="preview-strip" className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold">Preview Strip</h2>
        <span
          aria-live="polite"
          className="rounded-full border-2 border-on-surface bg-surface-low px-3 py-1 text-[11px] font-bold uppercase"
        >
          {filledCount}/{SLOTS_PER_STRIP} foto
        </span>
      </div>

      <div className="flex justify-center rounded-2xl border-2 border-on-surface bg-surface-container p-4 hard-shadow">
        {error ? (
          <div
            role="alert"
            className="flex min-h-72 w-full max-w-xs flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-on-surface/40 px-6 text-center"
          >
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: "2.5rem" }}
              aria-hidden
            >
              image_not_supported
            </span>
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setRetryKey((key) => key + 1);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-on-surface bg-surface-lowest px-4 text-sm font-bold hard-shadow-sm active:translate-y-0.5 active:shadow-none"
            >
              <span className="material-symbols-outlined" aria-hidden>
                refresh
              </span>
              Coba Lagi
            </button>
          </div>
        ) : previewUrl ? (
          <Image
            src={previewUrl}
            alt={`Preview strip ${template ? templateName(template.id) : ""}`}
            width={template?.width ?? 591}
            height={template?.height ?? 1772}
            unoptimized
            className="h-auto max-h-[68vh] w-auto rounded-lg border-2 border-on-surface"
          />
        ) : (
          <div
            role="status"
            className="flex h-72 w-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-on-surface/40 px-4 text-center text-xs font-semibold text-on-surface-muted"
          >
            <span
              className="h-8 w-8 animate-spin rounded-full border-[3px] border-on-surface border-t-primary"
              aria-hidden
            />
            Menyiapkan frame…
          </div>
        )}
      </div>

      {/* Foto per slot: ambil ulang atau upload */}
      <div className="rounded-2xl border-2 border-on-surface bg-surface-lowest p-4 hard-shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-on-surface-muted">
            Foto
          </p>
          <span className="text-right text-[10px] font-bold normal-case tracking-normal text-on-surface-muted">
            Ikon kamera = ambil ulang
            <br className="sm:hidden" /> · ikon upload = pilih file
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => {
            const thumb = thumbnails[index];
            const isDropTarget = dragSlot === index;

            return (
              <div
                key={index}
                className={`flex flex-col gap-1 transition-transform ${
                  isDropTarget ? "-translate-y-0.5" : ""
                }`}
                onDragEnter={(event) => {
                  if (!onDropFiles || uploadBusy) return;
                  event.preventDefault();
                  setDragSlot(index);
                }}
                onDragOver={(event) => {
                  if (!onDropFiles || uploadBusy) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setDragSlot(index);
                }}
                onDragLeave={(event) => {
                  if (
                    event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    return;
                  }
                  setDragSlot((current) =>
                    current === index ? null : current,
                  );
                }}
                onDrop={(event) => handleDrop(event, index)}
              >
                <div
                  className={`relative overflow-hidden rounded-lg border-2 bg-surface-container transition-colors ${
                    isDropTarget
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-on-surface"
                  }`}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={`Foto ${index + 1}`}
                      className="block h-auto w-full"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={uploadBusy}
                      onClick={() => onUpload(index)}
                      aria-label={`Upload foto untuk slot ${index + 1}`}
                      className="flex aspect-video w-full flex-col items-center justify-center gap-0.5 text-on-surface-muted transition-colors hover:bg-surface-low hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "1.25rem" }}
                        aria-hidden
                      >
                        add_a_photo
                      </span>
                      <span className="text-[9px] font-extrabold uppercase">
                        Upload
                      </span>
                    </button>
                  )}

                  <span className="pointer-events-none absolute left-1 top-1 rounded-full border-2 border-on-surface bg-white/90 px-1.5 text-[9px] font-extrabold">
                    {index + 1}
                  </span>

                  {isDropTarget ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/25">
                      <span
                        className="material-symbols-outlined text-white"
                        style={{ fontSize: "1.5rem" }}
                        aria-hidden
                      >
                        file_download
                      </span>
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={!photo}
                    onClick={() => onRetake(index)}
                    aria-label={`Ambil ulang foto ${index + 1} dengan kamera`}
                    title="Ambil ulang dengan kamera"
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-full border-2 border-on-surface bg-surface-lowest px-1 hard-shadow-sm transition-all active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "0.875rem" }}
                      aria-hidden
                    >
                      photo_camera
                    </span>
                    <span className="text-[10px] font-bold sm:hidden">
                      Ambil
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={uploadBusy}
                    onClick={() => onUpload(index)}
                    aria-label={`Upload foto untuk slot ${index + 1}`}
                    title="Upload foto"
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-full border-2 border-on-surface bg-primary px-1 text-white hard-shadow-sm transition-all active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "0.875rem" }}
                      aria-hidden
                    >
                      photo_library
                    </span>
                    <span className="text-[10px] font-bold sm:hidden">
                      Upload
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {onDropFiles ? (
          <p className="mt-3 hidden text-[10px] font-semibold text-on-surface-muted sm:block">
            Tips: tarik file gambar langsung ke salah satu slot untuk upload
            cepat.
          </p>
        ) : null}
      </div>

      {/* Warna frame */}
      <div className="rounded-2xl border-2 border-on-surface bg-surface-lowest p-4 hard-shadow-sm">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-on-surface-muted">
          Warna Frame
        </p>
        <div className="flex flex-wrap gap-2">
          {FRAME_COLORS.map((color) => {
            const active = color.hex.toLowerCase() === frameColor.toLowerCase();
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onFrameColorChange(color.hex)}
                title={color.name}
                aria-label={`Warna frame ${color.name}`}
                aria-pressed={active}
                className={`h-9 w-9 rounded-full border-2 border-on-surface transition-transform ${
                  active ? "scale-110 hard-shadow-sm" : "hover:scale-105"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </div>

      <DownloadBar
        templateId={templateId}
        photos={photos}
        frameColor={frameColor}
        disabled={!complete}
      />

      {!complete ? (
        <p className="text-xs font-semibold text-on-surface-muted">
          Ambil {SLOTS_PER_STRIP - filledCount} foto lagi untuk mengaktifkan unduhan.
        </p>
      ) : (
        <p className="text-xs font-semibold text-on-surface-muted">
          Kamu juga bisa mengganti satu foto lewat ikon kamera atau upload di
          atas.
        </p>
      )}
    </div>
  );
}

export default PhotoStripPreview;
