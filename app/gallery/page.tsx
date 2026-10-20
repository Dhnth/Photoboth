"use client";

/**
 * Halaman /gallery — grid hasil foto yang disimpan sementara di localStorage.
 * Data hilang bila penyimpanan browser dibersihkan (tidak ada backend).
 *
 * Item galeri disimpan sebagai JPEG ringan; unduhan dari studio tetap PNG.
 */
import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { templateName } from "@/lib/constants";
import {
  galleryFileExtension,
  getGalleryServerSnapshot,
  getGallerySnapshot,
  removeGalleryItem,
  subscribeGallery,
  type GalleryItem,
} from "@/lib/gallery";

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GalleryPage() {
  const items = useSyncExternalStore(
    subscribeGallery,
    getGallerySnapshot,
    getGalleryServerSnapshot,
  );
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleRemove = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const confirmRemove = useCallback(() => {
    if (!deleteTarget) return;

    try {
      removeGalleryItem(deleteTarget);
      setError("");
    } catch {
      setError("Gagal menghapus hasil. Coba muat ulang halaman.");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const deleteItem = items.find((item) => item.id === deleteTarget);

  const handleDownload = useCallback((item: GalleryItem) => {
    const safeName = templateName(item.templateId)
      .toLowerCase()
      .replace(/\s+/g, "-");
    const extension = galleryFileExtension(item.dataUrl);
    triggerDownload(
      item.dataUrl,
      `rplbox-${safeName}-${item.id}.${extension}`,
    );
  }, []);

  return (
    <>
      <AppNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold">Galeri</h1>
            <p className="text-sm font-medium text-on-surface-muted">
              Beberapa hasil terakhir tersimpan di browser ini. Unduh ulang
              kapan saja.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-on-surface bg-primary px-5 text-sm font-bold text-white hard-shadow active:translate-y-0.5 active:shadow-none"
          >
            <span className="material-symbols-outlined is-filled" aria-hidden>
              add_a_photo
            </span>
            Foto Lagi
          </Link>
        </div>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border-2 border-primary bg-surface-low px-4 py-3 text-sm font-semibold text-primary"
          >
            {error}
          </p>
        ) : null}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-on-surface/40 bg-surface-lowest p-12 text-center hard-shadow-sm">
            <span
              className="material-symbols-outlined text-on-surface-muted"
              style={{ fontSize: "3rem" }}
              aria-hidden
            >
              image_not_supported
            </span>
            <div>
              <p className="text-lg font-extrabold">Belum ada hasil foto</p>
              <p className="text-sm font-medium text-on-surface-muted">
                Mulai sesi pertamamu di Studio dan unduh hasilnya agar muncul di
                sini.
              </p>
            </div>
            <Link
              href="/studio"
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-on-surface bg-secondary px-5 text-sm font-bold text-white hard-shadow active:translate-y-0.5 active:shadow-none"
            >
              <span className="material-symbols-outlined" aria-hidden>
                photo_camera
              </span>
              Buka Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <figure
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border-2 border-on-surface bg-surface-lowest hard-shadow-sm"
              >
                <div className="bg-surface-container p-2">
                  {/* data URL: pakai img biasa agar tidak diproses optimizer */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.dataUrl}
                    alt={`Strip ${templateName(item.templateId)}`}
                    className="mx-auto h-auto max-h-72 w-auto rounded-lg border-2 border-on-surface"
                  />
                </div>
                <figcaption className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex flex-col">
                    <span className="truncate text-sm font-extrabold">
                      {templateName(item.templateId)}
                    </span>
                    <span className="text-[11px] font-semibold text-on-surface-muted">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border-2 border-on-surface bg-primary text-xs font-bold text-white hard-shadow-sm active:translate-y-0.5 active:shadow-none"
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        download
                      </span>
                      Unduh
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Hapus dari galeri"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-on-surface bg-surface-low text-on-surface hard-shadow-sm active:translate-y-0.5 active:shadow-none"
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        delete
                      </span>
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus hasil ini?"
        description={
          deleteItem
            ? `Strip ${templateName(deleteItem.templateId)} akan dihapus dari galeri browser. Tindakan ini tidak bisa dibatalkan.`
            : "Hasil ini akan dihapus dari galeri browser. Tindakan ini tidak bisa dibatalkan."
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmRemove}
      />
    </>
  );
}
