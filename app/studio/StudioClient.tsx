"use client";

/**
 * Halaman /studio — alur utama photobooth.
 *
 * Alur: pilih frame → isi 4 foto lewat kamera atau upload → kamera ditutup
 * dan diganti panel informasi → atur warna frame → unduh.
 *
 * Foto disimpan sebagai array 4 slot (null = kosong) supaya user bisa
 * mengganti satu foto tertentu tanpa mengulang seluruh sesi. Slot kosong bisa
 * diisi dengan kamera atau file dari galeri HP/komputer.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { CameraViewport } from "@/components/CameraViewport";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PhotoStripPreview } from "@/components/PhotoStripPreview";
import { SessionCompletePanel } from "@/components/SessionCompletePanel";
import {
  SourceModeSwitch,
  type PhotoSource,
} from "@/components/SourceModeSwitch";
import { TemplateDrawer } from "@/components/TemplateDrawer";
import { TemplateSelector } from "@/components/TemplateSelector";
import {
  UploadPanel,
  type UploadProgress,
} from "@/components/UploadPanel";
import { composeStrip, loadTemplateImage } from "@/lib/composite";
import {
  DEFAULT_FRAME_COLOR,
  SLOTS_PER_STRIP,
  TEMPLATES,
  templateName,
} from "@/lib/constants";
import { saveCanvasToGallery } from "@/lib/gallery";
import { loadPhotoFile, PhotoUploadError, UPLOAD_ACCEPT } from "@/lib/photo";

const EMPTY_PHOTOS: Array<HTMLCanvasElement | null> = Array.from(
  { length: SLOTS_PER_STRIP },
  () => null,
);

function thumbSrc(file: string): string {
  return `/ready/thumbs/${file.replace(/\.png$/i, ".webp")}`;
}

/**
 * Tentukan slot tujuan untuk sejumlah file upload.
 *
 * Urutan prioritas: slot yang diminta (mis. tombol upload pada satu slot) →
 * slot kosong berikutnya → slot lain dari awal (menggantikan foto lama).
 */
function planUploadSlots(
  count: number,
  preferred: number | null,
  photos: Array<HTMLCanvasElement | null>,
): number[] {
  const slots: number[] = [];

  const push = (index: number): void => {
    if (index < 0 || index >= photos.length) return;
    if (slots.includes(index)) return;
    slots.push(index);
  };

  if (preferred !== null) push(preferred);
  for (let i = 0; i < photos.length && slots.length < count; i += 1) {
    if (!photos[i]) push(i);
  }
  for (let i = 0; i < photos.length && slots.length < count; i += 1) {
    push(i);
  }

  return slots.slice(0, count);
}

export default function StudioClient({
  initialFrame,
}: {
  initialFrame?: string;
}) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState(
    initialFrame ?? TEMPLATES[0]?.id ?? "",
  );
  const [photos, setPhotos] = useState<Array<HTMLCanvasElement | null>>(EMPTY_PHOTOS);
  const [retakeSlot, setRetakeSlot] = useState<number | null>(null);
  const [frameColor, setFrameColor] = useState(DEFAULT_FRAME_COLOR.hex);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState("");
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [sourceMode, setSourceMode] = useState<PhotoSource>("camera");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const templateRequestRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSlotRef = useRef<number | null>(null);
  const uploadBusyRef = useRef(false);

  const filledCount = photos.filter(Boolean).length;
  const complete = filledCount >= SLOTS_PER_STRIP;
  const firstEmpty = photos.findIndex((photo) => !photo);
  const targetSlot = retakeSlot ?? (firstEmpty === -1 ? null : firstEmpty);

  const selectedTemplateMeta = useMemo(
    () => TEMPLATES.find((item) => item.id === selectedTemplate),
    [selectedTemplate],
  );
  const captureAspect = selectedTemplateMeta?.slots[0]
    ? selectedTemplateMeta.slots[0].w / selectedTemplateMeta.slots[0].h
    : 16 / 9;

  const closeDrawer = useCallback(() => setTemplateDrawerOpen(false), []);

  /**
   * Cegah browser membuka file bila user melepas gambar di luar dropzone
   * (mis. di area kamera). Dropzone tetap menangani drop-nya sendiri lewat
   * event React; listener ini hanya mematikan perilaku default browser.
   */
  useEffect(() => {
    const preventFileDrop = (event: DragEvent): void => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
      }
    };

    window.addEventListener("dragover", preventFileDrop);
    window.addEventListener("drop", preventFileDrop);
    return () => {
      window.removeEventListener("dragover", preventFileDrop);
      window.removeEventListener("drop", preventFileDrop);
    };
  }, []);

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
      setUploadError("");
      setUploadNotice("");

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
      setUploadError("");
      setUploadNotice("");

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
    setSourceMode("camera");
    setGalleryError("");
    setUploadError("");
    setUploadNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReset = useCallback(() => {
    setResetConfirmOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    setResetConfirmOpen(false);
    setPhotos([...EMPTY_PHOTOS]);
    setRetakeSlot(null);
    setGalleryError("");
    setUploadError("");
    setUploadNotice("");
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

  /**
   * Proses file upload secara berurutan supaya progress terlihat dan memori
   * tetap rendah. File divalidasi di lib/photo; kegagalan satu file tidak
   * membatalkan file lain.
   */
  const handleUploadFiles = useCallback(
    async (files: File[], preferredSlot: number | null = null) => {
      if (uploadBusyRef.current || files.length === 0) return;

      const preferred = preferredSlot ?? retakeSlot;
      const targets = planUploadSlots(files.length, preferred, photos);
      if (targets.length === 0) return;

      const usableFiles = files.slice(0, targets.length);
      const nextPhotos = [...photos];
      const failures: string[] = [];
      let succeeded = 0;
      let replaced = 0;

      uploadBusyRef.current = true;
      setUploadBusy(true);
      setUploadProgress({ done: 0, total: usableFiles.length });
      setUploadError("");
      setUploadNotice("");
      setGalleryError("");

      try {
        for (let i = 0; i < usableFiles.length; i += 1) {
          const file = usableFiles[i];
          const slot = targets[i];
          const slotMeta = selectedTemplateMeta?.slots[slot];
          const aspect = slotMeta ? slotMeta.w / slotMeta.h : captureAspect;

          try {
            const hadPhoto = Boolean(nextPhotos[slot]);
            nextPhotos[slot] = await loadPhotoFile(file, aspect);
            succeeded += 1;
            if (hadPhoto) replaced += 1;
          } catch (error) {
            failures.push(
              error instanceof PhotoUploadError
                ? error.message
                : `"${file.name}" gagal diproses. Coba file lain.`,
            );
          }

          setUploadProgress({ done: i + 1, total: usableFiles.length });
        }

        if (succeeded > 0) {
          setPhotos(nextPhotos);
          setRetakeSlot(null);
        }

        const notices: string[] = [];
        if (succeeded > 0) {
          notices.push(`${succeeded} foto berhasil dimuat.`);
        }
        if (replaced > 0 && succeeded > 0) {
          notices.push(`${replaced} foto lama diganti.`);
        }
        if (files.length > usableFiles.length) {
          notices.push(
            `Hanya ${usableFiles.length} foto dipakai karena strip punya ${SLOTS_PER_STRIP} slot.`,
          );
        }
        if (notices.length > 0) setUploadNotice(notices.join(" "));

        if (failures.length > 0) {
          const shown = failures.slice(0, 2).join(" ");
          setUploadError(
            failures.length > 2
              ? `${shown} Dan ${failures.length - 2} foto lain gagal.`
              : shown,
          );
        }

        const wasComplete = filledCount >= SLOTS_PER_STRIP;
        const nowComplete =
          nextPhotos.filter(Boolean).length >= SLOTS_PER_STRIP;
        if (!wasComplete && nowComplete) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } finally {
        uploadBusyRef.current = false;
        setUploadBusy(false);
        setUploadProgress(null);
      }
    },
    [
      captureAspect,
      filledCount,
      photos,
      retakeSlot,
      selectedTemplateMeta,
    ],
  );

  /** Buka file picker; `slot` tertentu atau slot kosong berikutnya. */
  const openFilePicker = useCallback((slot?: number) => {
    if (uploadBusyRef.current) return;
    uploadSlotRef.current = slot ?? null;

    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      const target = uploadSlotRef.current;
      uploadSlotRef.current = null;
      event.target.value = "";

      if (files.length > 0) void handleUploadFiles(files, target);
    },
    [handleUploadFiles],
  );

  const handleSourceModeChange = useCallback((mode: PhotoSource) => {
    setSourceMode(mode);
    setUploadError("");
    setUploadNotice("");
  }, []);

  return (
    <>
      <AppNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold">Studio</h1>
          <p className="text-sm font-medium text-on-surface-muted">
            {retakeSlot !== null
              ? `Mode ganti foto ${retakeSlot + 1}. Ambil foto baru atau upload — slot lain tetap aman.`
              : complete
                ? "Sesi selesai. Kamera dimatikan untuk hemat baterai—atur frame lalu unduh hasilnya."
                : sourceMode === "upload"
                  ? `Upload ${SLOTS_PER_STRIP - filledCount} foto lagi. Bisa satu-satu atau beberapa sekaligus.`
                  : `Ambil ${SLOTS_PER_STRIP - filledCount} foto lagi untuk menyelesaikan strip.`}
          </p>

          {uploadBusy && (complete || sourceMode === "camera") ? (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-xl border-2 border-on-surface bg-flash px-3 py-2 text-xs font-extrabold"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-on-surface border-t-transparent"
                aria-hidden
              />
              Memproses {uploadProgress?.done ?? 0} dari{" "}
              {uploadProgress?.total ?? "…"} foto…
            </p>
          ) : null}

          {uploadError ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border-2 border-primary bg-surface-low px-3 py-2 text-xs font-semibold leading-relaxed text-primary"
            >
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontSize: "1rem" }}
                aria-hidden
              >
                image_not_supported
              </span>
              <span className="min-w-0">{uploadError}</span>
            </p>
          ) : null}

          {uploadNotice ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-xl border-2 border-on-surface/20 bg-surface-low px-3 py-2 text-xs font-semibold leading-relaxed text-on-surface-muted"
            >
              <span
                className="material-symbols-outlined shrink-0 text-primary"
                style={{ fontSize: "1rem" }}
                aria-hidden
              >
                celebration
              </span>
              <span className="min-w-0">{uploadNotice}</span>
            </p>
          ) : null}
        </div>

        {/* Grid utama */}
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 flex flex-col gap-6 lg:col-span-7">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">
                  {complete
                    ? "Sesi Selesai"
                    : sourceMode === "camera"
                      ? "Kamera"
                      : "Upload Foto"}
                </h2>
                {!complete ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-on-surface-muted">
                    Pilih sumber
                  </span>
                ) : null}
              </div>

              {!complete ? (
                <SourceModeSwitch
                  value={sourceMode}
                  onChange={handleSourceModeChange}
                  disabled={uploadBusy}
                />
              ) : null}

              {complete ? (
                <SessionCompletePanel
                  onViewResult={handleViewResult}
                  onReset={handleReset}
                  onOpenGallery={handleOpenGallery}
                  galleryBusy={galleryBusy}
                  error={galleryError}
                />
              ) : sourceMode === "camera" ? (
                <CameraViewport
                  nextSlot={targetSlot}
                  totalShots={SLOTS_PER_STRIP}
                  retaking={retakeSlot !== null}
                  onCapture={handleCapture}
                  disabled={targetSlot === null}
                  backgroundColor={frameColor}
                  aspectRatio={captureAspect}
                  chromaEnabled={chromaEnabled}
                  onChromaEnabledChange={setChromaEnabled}
                />
              ) : (
                <UploadPanel
                  nextSlot={targetSlot}
                  totalShots={SLOTS_PER_STRIP}
                  retaking={retakeSlot !== null}
                  photos={photos}
                  aspectRatio={captureAspect}
                  busy={uploadBusy}
                  progress={uploadProgress}
                  onPickFiles={openFilePicker}
                  onDropFiles={handleUploadFiles}
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
                onUpload={openFilePicker}
                onDropFiles={handleUploadFiles}
                uploadBusy={uploadBusy}
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

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Mulai sesi baru?"
        description="Semua foto di sesi ini akan dihapus. Strip yang sudah tersimpan di galeri tidak ikut terhapus."
        confirmLabel="Ya, mulai baru"
        cancelLabel="Batal"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={confirmReset}
      />

      {/* Input file bersama: dipicu dari tombol upload mana pun. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={handleFileInputChange}
      />
    </>
  );
}
