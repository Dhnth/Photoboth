"use client";

/**
 * Halaman /studio — alur utama photobooth.
 *
 * Alur: pilih frame → ambil 4 foto (chroma key realtime) → kamera ditutup dan
 * diganti panel informasi → atur warna frame → unduh.
 *
 * Foto disimpan sebagai array 4 slot (null = kosong) supaya user bisa
 * mengganti satu foto tertentu tanpa mengulang seluruh sesi. Saat slot kosong
 * kembali, kamera otomatis dipasang ulang.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { CameraViewport } from "@/components/CameraViewport";
import { PhotoStripPreview } from "@/components/PhotoStripPreview";
import { SessionCompletePanel } from "@/components/SessionCompletePanel";
import { TemplateDrawer } from "@/components/TemplateDrawer";
import { TemplateSelector } from "@/components/TemplateSelector";
import { composeStrip, loadTemplateImage } from "@/lib/composite";
import {
  DEFAULT_FRAME_COLOR,
  SLOTS_PER_STRIP,
  TEMPLATES,
  templateName,
} from "@/lib/constants";
import { saveCanvasToGallery } from "@/lib/gallery";

const EMPTY_PHOTOS: Array<HTMLCanvasElement | null> = Array.from(
  { length: SLOTS_PER_STRIP },
  () => null,
);

function thumbSrc(file: string): string {
  return `/ready/thumbs/${file.replace(/\.png$/i, ".webp")}`;
}

export default function StudioPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]?.id ?? "");
  const [photos, setPhotos] = useState<Array<HTMLCanvasElement | null>>(EMPTY_PHOTOS);
  const [retakeSlot, setRetakeSlot] = useState<number | null>(null);
  const [frameColor, setFrameColor] = useState(DEFAULT_FRAME_COLOR.hex);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState("");
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const templateRequestRef = useRef(0);

  const filledCount = photos.filter(Boolean).length;
  const complete = filledCount >= SLOTS_PER_STRIP;
  const firstEmpty = photos.findIndex((photo) => !photo);
  const targetSlot = retakeSlot ?? (firstEmpty === -1 ? null : firstEmpty);

  const selectedTemplateMeta = useMemo(
    () => TEMPLATES.find((item) => item.id === selectedTemplate),
    [selectedTemplate],
  );

  const closeDrawer = useCallback(() => setTemplateDrawerOpen(false), []);

  const handleCapture = useCallback(
    (photo: HTMLCanvasElement) => {
      const target = retakeSlot ?? photos.findIndex((item) => !item);
      if (target === -1) return;

      setPhotos((prev) => {
        const next = [...prev];
        next[target] = photo;
        return next;
      });
      setRetakeSlot(null);
      setGalleryError("");

      // Kamera akan ditutup otomatis setelah ini; bawa user ke panel hasil.
      if (filledCount + 1 >= SLOTS_PER_STRIP) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [retakeSlot, photos, filledCount],
  );

  /**
   * Pilih template: unduh file penuh dulu, tampilkan spinner di kartu, lalu
   * baru aktifkan. Dengan begitu tidak semua template diunduh sekaligus dan
   * preview tidak pernah menampilkan frame setengah jadi.
   */
  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      if (templateId === selectedTemplate) return;

      const template = TEMPLATES.find((item) => item.id === templateId);
      if (!template) {
        setTemplateError("Frame tidak ditemukan. Pilih frame lain.");
        return;
      }

      const request = ++templateRequestRef.current;
      setPendingTemplate(templateId);
      setTemplateError("");

      loadTemplateImage(template)
        .then(() => {
          if (templateRequestRef.current !== request) return;
          setSelectedTemplate(templateId);
          setPendingTemplate(null);
        })
        .catch(() => {
          if (templateRequestRef.current !== request) return;
          setPendingTemplate(null);
          setTemplateError(
            "Gagal memuat frame. Periksa koneksi lalu coba pilih lagi.",
          );
        });
    },
    [selectedTemplate],
  );

  /** Kosongkan satu slot lalu arahkan kamera untuk mengambil ulang slot itu. */
  const handleRetake = useCallback((index: number) => {
    setPhotos((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setRetakeSlot(index);
    setGalleryError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReset = useCallback(() => {
    if (!window.confirm("Hapus semua foto dan mulai sesi baru?")) return;
    setPhotos([...EMPTY_PHOTOS]);
    setRetakeSlot(null);
    setGalleryError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewResult = useCallback(() => {
    document
      .getElementById("preview-strip")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Simpan strip ke galeri lebih dulu, baru pindah halaman. */
  const handleOpenGallery = useCallback(async () => {
    if (galleryBusy) return;
    setGalleryBusy(true);
    setGalleryError("");

    try {
      const canvas = await composeStrip(photos, selectedTemplate, { frameColor });
      const result = saveCanvasToGallery(canvas, selectedTemplate);

      if (!result.saved) {
        setGalleryError(
          "Penyimpanan browser penuh. Unduh PNG dari preview sebagai gantinya.",
        );
        return;
      }

      router.push("/gallery");
    } catch {
      setGalleryError(
        "Gagal menyimpan hasil ke galeri. Coba lagi atau unduh PNG dari preview.",
      );
    } finally {
      setGalleryBusy(false);
    }
  }, [galleryBusy, photos, selectedTemplate, frameColor, router]);

  return (
    <>
      <AppNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold">Studio</h1>
          <p className="text-sm font-medium text-on-surface-muted">
            {retakeSlot !== null
              ? `Mode ganti foto ${retakeSlot + 1}. Ambil foto baru — slot lain tetap aman.`
              : complete
                ? "Sesi selesai. Kamera dimatikan untuk hemat baterai—atur frame lalu unduh hasilnya."
                : `Ambil ${SLOTS_PER_STRIP - filledCount} foto lagi untuk menyelesaikan strip.`}
          </p>
        </div>

        {/* Grid utama */}
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 flex flex-col gap-6 lg:col-span-7">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-extrabold">
                {complete ? "Sesi Selesai" : "Kamera"}
              </h2>

              {complete ? (
                <SessionCompletePanel
                  onViewResult={handleViewResult}
                  onReset={handleReset}
                  onOpenGallery={handleOpenGallery}
                  galleryBusy={galleryBusy}
                  error={galleryError}
                />
              ) : (
                <CameraViewport
                  nextSlot={targetSlot}
                  totalShots={SLOTS_PER_STRIP}
                  retaking={retakeSlot !== null}
                  onCapture={handleCapture}
                  disabled={targetSlot === null}
                  backgroundColor={frameColor}
                />
              )}
            </div>

            {/* Pemicu drawer frame (mobile). Di desktop, grid tampil inline. */}
            <button
              type="button"
              onClick={() => setTemplateDrawerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={templateDrawerOpen}
              aria-controls="template-drawer"
              className="flex items-center gap-3 rounded-2xl border-2 border-on-surface bg-surface-lowest p-3 text-left hard-shadow-sm active:translate-y-0.5 active:shadow-none lg:hidden"
            >
              {selectedTemplateMeta ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbSrc(selectedTemplateMeta.file)}
                  alt=""
                  width={48}
                  height={72}
                  loading="lazy"
                  className="h-[72px] w-12 shrink-0 rounded-lg border-2 border-on-surface bg-surface-container object-cover object-top"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-on-surface-muted">
                  Frame aktif
                </span>
                <span className="block truncate text-sm font-extrabold">
                  {templateName(selectedTemplate)}
                </span>
                <span className="block text-xs font-semibold text-on-surface-muted">
                  Ketuk untuk buka daftar frame
                </span>
              </span>
              <span className="shrink-0 rounded-full border-2 border-on-surface bg-primary px-3 py-1.5 text-xs font-bold text-white">
                {pendingTemplate ? "Memuat…" : "Pilih"}
              </span>
            </button>

            {templateError ? (
              <p
                role="alert"
                className="rounded-xl border-2 border-primary bg-surface-low px-3 py-2 text-xs font-semibold text-primary lg:hidden"
              >
                {templateError}
              </p>
            ) : null}

            {/* Pemilih frame di bawah kamera (desktop) */}
            <div className="hidden lg:block">
              <TemplateSelector
                selectedId={selectedTemplate}
                onSelect={handleSelectTemplate}
                loadingId={pendingTemplate}
                error={templateError}
              />
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-20">
              <PhotoStripPreview
                photos={photos}
                templateId={selectedTemplate}
                frameColor={frameColor}
                onFrameColorChange={setFrameColor}
                onRetake={handleRetake}
              />
            </div>
          </aside>
        </div>
      </main>

      <TemplateDrawer
        open={templateDrawerOpen}
        onClose={closeDrawer}
        selectedId={selectedTemplate}
        onSelect={handleSelectTemplate}
        loadingId={pendingTemplate}
        error={templateError}
      />
    </>
  );
}
