"use client";

/**
 * Panel pengganti kamera setelah 4/4 foto.
 *
 * Kamera di-unmount sepenuhnya saat panel ini tampil, jadi track kamera dan
 * loop chroma key berhenti—lebih hemat baterai dan tidak ada indikator kamera
 * yang menyala saat user mengatur/mengunduh hasil.
 */
import { PillButton } from "@/components/ui/PillButton";

export interface SessionCompletePanelProps {
  onViewResult: () => void;
  onReset: () => void;
  onOpenGallery: () => void;
  galleryBusy?: boolean;
  error?: string;
}

export function SessionCompletePanel({
  onViewResult,
  onReset,
  onOpenGallery,
  galleryBusy = false,
  error = "",
}: SessionCompletePanelProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 rounded-2xl border-2 border-on-surface bg-on-surface p-6 text-center hard-shadow">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-on-surface bg-flash text-on-surface">
        <span
          className="material-symbols-outlined is-filled"
          style={{ fontSize: "1.75rem" }}
          aria-hidden
        >
          celebration
        </span>
      </span>

      <div className="flex max-w-sm flex-col gap-1.5">
        <span className="text-xs font-extrabold uppercase tracking-widest text-flash">
          4/4 foto selesai
        </span>
        <h3 className="text-2xl font-extrabold text-white">Kamera dimatikan</h3>
        <p className="text-sm font-medium text-white/75">
          Supaya lebih hemat baterai. Preview strip sudah siap—atur warna frame
          lalu unduh hasilnya.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
        <PillButton
          variant="primary"
          icon="download"
          onClick={onViewResult}
          className="w-full justify-center sm:w-auto"
        >
          Lihat &amp; Unduh
        </PillButton>
        <PillButton
          variant="ghost"
          icon="photo_library"
          onClick={onOpenGallery}
          disabled={galleryBusy}
          className="w-full justify-center sm:w-auto"
        >
          {galleryBusy ? "Menyimpan…" : "Ke Galeri"}
        </PillButton>
        <PillButton
          variant="ghost"
          icon="restart_alt"
          onClick={onReset}
          className="w-full justify-center sm:w-auto"
        >
          Foto Ulang
        </PillButton>
      </div>

      <p className="text-xs font-semibold text-white/55">
        Mau ganti satu foto? Klik tombol Ganti di preview.
      </p>

      {error ? (
        <p
          role="alert"
          className="max-w-sm rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-flash"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default SessionCompletePanel;
