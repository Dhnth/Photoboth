"use client";

/**
 * Sidebar/drawer pemilih frame untuk mobile.
 *
 * Di layar kecil, grid 3 kolom yang panjang dipindah ke panel samping agar
 * halaman utama tetap ringkas dan preview/unduhan mudah dijangkau. Daftar
 * frame di dalam drawer tetap bisa di-scroll.
 */
import { useEffect, useRef } from "react";
import { TemplateSelector } from "@/components/TemplateSelector";

export interface TemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  onSelect: (templateId: string) => void;
  loadingId?: string | null;
  error?: string;
}

export function TemplateDrawer({
  open,
  onClose,
  selectedId,
  onSelect,
  loadingId = null,
  error = "",
}: TemplateDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="template-drawer"
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-drawer-title"
    >
      <button
        type="button"
        aria-label="Tutup pemilih frame"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/55 backdrop-blur-sm"
      />

      <div className="animate-drawer-in absolute inset-y-0 right-0 flex w-[min(90vw,380px)] flex-col gap-3 border-l-2 border-on-surface bg-surface p-4 hard-shadow">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="template-drawer-title" className="text-lg font-extrabold">
              Pilih Frame
            </h2>
            <p className="text-xs font-semibold text-on-surface-muted">
              Geser daftar untuk melihat semua frame.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-on-surface bg-surface-lowest text-2xl leading-none hard-shadow-sm active:translate-y-0.5 active:shadow-none"
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>

        <div className="min-h-0 flex-1">
          <TemplateSelector
            embedded
            selectedId={selectedId}
            onSelect={onSelect}
            loadingId={loadingId}
            error={error}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border-2 border-on-surface bg-primary text-sm font-bold text-white hard-shadow-sm active:translate-y-0.5 active:shadow-none"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

export default TemplateDrawer;
