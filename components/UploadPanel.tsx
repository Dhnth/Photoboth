"use client";

/**
 * Panel upload foto — pengganti viewport kamera saat mode "Upload" aktif.
 *
 * Tiga cara memasukkan foto:
 *  1. Dropzone besar: klik untuk pilih banyak file, atau tarik & lepas.
 *  2. Kartu per slot: klik slot tertentu untuk mengganti foto slot itu saja.
 *  3. Tempel (Ctrl+V) screenshot/gambar dari clipboard.
 *
 * Semua file divalidasi dan diproses di StudioClient; panel ini hanya
 * mengurus tampilan, drag state, dan progress.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { makePhotoThumbnail } from "@/lib/photo";

export interface UploadProgress {
  done: number;
  total: number;
}

export interface UploadPanelProps {
  /** Slot berikutnya yang akan diisi (0-based), atau null jika penuh. */
  nextSlot: number | null;
  totalShots: number;
  retaking?: boolean;
  photos: Array<HTMLCanvasElement | null>;
  /** Rasio thumbnail slot, mengikuti slot template aktif. */
  aspectRatio?: number;
  busy?: boolean;
  progress?: UploadProgress | null;
  /** Buka file picker. Tanpa argumen = isi slot kosong berikutnya. */
  onPickFiles: (slot?: number) => void;
  /** Terima file dari drag & drop / paste. */
  onDropFiles: (files: File[], slot?: number) => void;
}

export function UploadPanel({
  nextSlot,
  totalShots,
  retaking = false,
  photos,
  aspectRatio = 16 / 9,
  busy = false,
  progress = null,
  onPickFiles,
  onDropFiles,
}: UploadPanelProps) {
  const [dragging, setDragging] = useState(false);
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const dragDepthRef = useRef(0);

  const thumbnails = useMemo(
    () => photos.map((photo) => (photo ? makePhotoThumbnail(photo) : null)),
    [photos],
  );

  const filledCount = photos.filter(Boolean).length;
  const slotAspect = aspectRatio > 0 ? aspectRatio : 16 / 9;

  // Tempel gambar dari clipboard selama panel upload terbuka.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent): void => {
      if (busy) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      onDropFiles(files);
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [busy, onDropFiles]);

  const resetDrag = (): void => {
    dragDepthRef.current = 0;
    setDragging(false);
    setDragSlot(null);
  };

  const handleDrop = (event: DragEvent, slot?: number): void => {
    event.preventDefault();
    event.stopPropagation();
    resetDrag();
    if (busy) return;

    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) onDropFiles(files, slot);
  };

  const handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  };

  const remaining = Math.max(0, totalShots - filledCount);
  const targetLabel =
    nextSlot === null
      ? "Semua slot terisi"
      : retaking
        ? `Mengganti foto ${nextSlot + 1}`
        : `Berikutnya: foto ${nextSlot + 1}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Dropzone utama */}
      <button
        type="button"
        onClick={() => onPickFiles()}
        disabled={busy}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={handleDragLeave}
        onDrop={(event) => handleDrop(event)}
        aria-label="Pilih atau tarik foto untuk diupload"
        className={`group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-150 sm:p-7 ${
          dragging
            ? "-translate-y-0.5 border-primary bg-primary/5 hard-shadow"
            : "border-on-surface/35 bg-surface-lowest hover:border-primary hover:bg-surface-low"
        } disabled:pointer-events-none disabled:opacity-70`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-secondary/10 blur-2xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-flash/20 blur-2xl"
        />

        <span
          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-on-surface transition-transform duration-150 ${
            dragging
              ? "-rotate-6 scale-110 bg-flash"
              : "bg-surface-container group-hover:-rotate-3 group-hover:scale-105"
          } hard-shadow-sm`}
          aria-hidden
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: "2rem" }}
          >
            {dragging ? "file_download" : "add_a_photo"}
          </span>
        </span>

        <span className="relative flex flex-col gap-1">
          <span className="font-display text-lg font-extrabold leading-tight sm:text-xl">
            {dragging ? "Lepaskan untuk upload" : "Tarik foto ke sini"}
          </span>
          <span className="text-sm font-medium leading-relaxed text-on-surface-muted">
            atau ketuk untuk memilih dari galeri HP/komputer
          </span>
        </span>

        <span
          className={`relative inline-flex h-11 items-center gap-2 rounded-full border-2 border-on-surface px-5 text-sm font-bold transition-transform ${
            dragging
              ? "bg-flash text-on-surface"
              : "bg-primary text-white hard-shadow-sm group-active:translate-y-0.5 group-active:shadow-none"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1.25rem" }}
            aria-hidden
          >
            add_a_photo
          </span>
          {busy
            ? `Memproses ${progress?.done ?? 0}/${progress?.total ?? "…"}`
            : "Pilih Foto"}
        </span>

        <span className="relative text-[11px] font-semibold leading-relaxed text-on-surface-muted">
          JPG, PNG, WebP, GIF, AVIF • bisa pilih beberapa sekaligus • maks 20 MB
        </span>
      </button>

      {/* Status & pesan */}
      {busy ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl border-2 border-on-surface bg-flash px-3 py-2 text-xs font-extrabold"
        >
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-on-surface border-t-transparent"
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            Memproses {progress?.done ?? 0} dari {progress?.total ?? "…"} foto…
          </span>
          <span className="shrink-0 rounded-full bg-on-surface/10 px-2 py-0.5 text-[10px]">
            {targetLabel}
          </span>
        </div>
      ) : null}

      {/* Slot per slot */}
      <div className="rounded-2xl border-2 border-on-surface bg-surface-lowest p-3 hard-shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-on-surface-muted">
              Isi per slot
            </p>
            <p className="text-[11px] font-semibold text-on-surface-muted">
              Ketuk slot untuk mengganti foto tertentu.
            </p>
          </div>
          <span
            aria-live="polite"
            className="shrink-0 rounded-full border-2 border-on-surface bg-surface-low px-2.5 py-1 text-[10px] font-extrabold uppercase"
          >
            {filledCount}/{totalShots}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => {
            const thumb = thumbnails[index];
            const isNext = nextSlot === index;
            const isDropTarget = dragSlot === index;

            return (
              <button
                key={index}
                type="button"
                disabled={busy}
                onClick={() => onPickFiles(index)}
                onDragEnter={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragSlot(index);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
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
                  setDragSlot((current) => (current === index ? null : current));
                }}
                onDrop={(event) => handleDrop(event, index)}
                aria-label={
                  photo
                    ? `Ganti foto slot ${index + 1} dengan upload`
                    : `Isi slot ${index + 1} dengan upload`
                }
                className={`group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-100 ${
                  isDropTarget
                    ? "-translate-y-0.5 border-primary bg-primary/10 hard-shadow-sm"
                    : isNext
                      ? "border-primary bg-surface-low"
                      : "border-on-surface bg-surface-lowest hover:-translate-y-0.5 hover:border-primary"
                } disabled:pointer-events-none disabled:opacity-60`}
              >
                <span
                  className="relative block w-full overflow-hidden bg-surface-container"
                  style={{ aspectRatio: slotAspect }}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-on-surface-muted">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "1.5rem" }}
                        aria-hidden
                      >
                        add_a_photo
                      </span>
                      <span className="text-[10px] font-bold">
                        Slot {index + 1}
                      </span>
                    </span>
                  )}

                  <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-on-surface bg-white/90 px-1 text-[9px] font-extrabold">
                    {index + 1}
                  </span>

                  {isNext ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full border-2 border-on-surface bg-flash px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide">
                      {retaking ? "Ganti" : "Berikut"}
                    </span>
                  ) : null}

                  {isDropTarget ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <span
                        className="material-symbols-outlined text-white"
                        style={{ fontSize: "1.75rem" }}
                        aria-hidden
                      >
                        file_download
                      </span>
                    </span>
                  ) : null}
                </span>

                <span
                  className={`flex items-center justify-center gap-1 border-t-2 border-on-surface px-1 py-1.5 text-[10px] font-extrabold transition-colors ${
                    isNext || isDropTarget
                      ? "bg-primary text-white"
                      : "bg-surface-low text-on-surface group-hover:bg-primary group-hover:text-white"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "0.875rem" }}
                    aria-hidden
                  >
                    {photo ? "refresh" : "add_a_photo"}
                  </span>
                  {photo ? "Ganti" : "Isi"}
                </span>
              </button>
            );
          })}
        </div>

        {remaining > 0 ? (
          <p className="mt-3 text-[11px] font-semibold text-on-surface-muted">
            {remaining} slot lagi. Kamu bisa isi satu-satu atau upload beberapa
            foto sekaligus.
          </p>
        ) : (
          <p className="mt-3 text-[11px] font-semibold text-on-surface-muted">
            Semua slot sudah terisi. Upload baru akan menggantikan foto lama.
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="flex items-start gap-2.5 rounded-2xl border-2 border-dashed border-on-surface/30 bg-surface-low p-3">
        <span
          className="material-symbols-outlined shrink-0 text-primary"
          style={{ fontSize: "1.25rem" }}
          aria-hidden
        >
          auto_awesome
        </span>
        <p className="text-[11px] font-semibold leading-relaxed text-on-surface-muted">
          Foto otomatis dipotong tengah mengikuti rasio frame, jadi wajah tetap
          pas. Bisa juga tempel screenshot dengan{" "}
          <kbd className="rounded border border-on-surface/30 bg-surface-lowest px-1 py-0.5 font-mono text-[10px]">
            Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-on-surface/30 bg-surface-lowest px-1 py-0.5 font-mono text-[10px]">
            V
          </kbd>
          .
        </p>
      </div>
    </div>
  );
}

export default UploadPanel;
