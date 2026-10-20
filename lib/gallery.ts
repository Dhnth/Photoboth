/**
 * Penyimpanan sementara hasil foto di localStorage.
 * Dipakai oleh halaman /gallery. Tidak ada backend — data hilang bila
 * localStorage dibersihkan.
 *
 * Hasil disimpan sebagai JPEG (bukan PNG full-res) supaya kuota localStorage
 * yang biasanya hanya 5–10 MB bisa menampung beberapa strip. Unduhan dari
 * studio tetap PNG; galeri adalah salinan praktis untuk dilihat/diunduh ulang.
 */
import { GALLERY_STORAGE_KEY } from "./constants";

export interface GalleryItem {
  id: string;
  /** Data URL JPEG hasil komposit (resolusi penuh). */
  dataUrl: string;
  templateId: string;
  createdAt: number;
}

export interface GallerySaveResult {
  items: GalleryItem[];
  /** True jika item baru benar-benar tertulis ke localStorage. */
  saved: boolean;
  /** Jumlah item lama yang dibuang agar item baru muat. */
  dropped: number;
}

const listeners = new Set<() => void>();
let cachedSnapshot: GalleryItem[] | null = null;
const SERVER_SNAPSHOT: GalleryItem[] = [];

/** Batas jumlah item; kuota localStorage tetap jadi penentu akhir. */
const GALLERY_MAX_ITEMS = 6;

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Beri tahu semua subscriber bahwa galeri berubah. */
function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

/**
 * Berlangganan perubahan galeri (untuk useSyncExternalStore).
 * Mendengarkan event `storage` antar-tab dan event internal antar-komponen.
 */
export function subscribeGallery(listener: () => void): () => void {
  if (!isBrowser()) return () => undefined;

  listeners.add(listener);
  const onExternal = (event: StorageEvent): void => {
    if (!event.key || event.key === GALLERY_STORAGE_KEY) emit();
  };

  window.addEventListener("storage", onExternal);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onExternal);
  };
}

/** Snapshot sisi klien (di-cache agar referensinya stabil). */
export function getGallerySnapshot(): GalleryItem[] {
  if (!isBrowser()) return SERVER_SNAPSHOT;
  if (cachedSnapshot === null) cachedSnapshot = loadGallery();
  return cachedSnapshot;
}

/** Snapshot sisi server: selalu kosong. */
export function getGalleryServerSnapshot(): GalleryItem[] {
  return SERVER_SNAPSHOT;
}

export function loadGallery(): GalleryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GalleryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.dataUrl === "string" &&
          typeof item.templateId === "string",
      )
      .map((item) => ({
        id: item.id,
        dataUrl: item.dataUrl,
        templateId: item.templateId,
        createdAt:
          typeof item.createdAt === "number" ? item.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

export function saveGalleryItem(item: GalleryItem): GallerySaveResult {
  if (!isBrowser()) return { items: [], saved: false, dropped: 0 };

  // Hindari duplikat: aksi PNG, PDF, Share, dan "Ke Galeri" pada strip yang
  // sama menghasilkan data URL identik.
  const current = loadGallery();
  if (current.some((existing) => existing.dataUrl === item.dataUrl)) {
    emit();
    return { items: current, saved: true, dropped: 0 };
  }

  const original = [item, ...current.filter((existing) => existing.id !== item.id)]
    .slice(0, GALLERY_MAX_ITEMS);
  let next = original;

  // Coba simpan; kalau kuota penuh buang item terlama satu per satu.
  while (next.length > 0) {
    try {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
      emit();
      return { items: next, saved: true, dropped: original.length - next.length };
    } catch {
      if (next.length === 1) break;
      next = next.slice(0, -1);
    }
  }

  // Item baru sendiri tidak muat. Jangan hapus galeri lama yang masih valid;
  // setItem yang gagal tidak menulis apa pun, jadi data lama tetap utuh.
  emit();
  return { items: current, saved: false, dropped: 0 };
}

/** Kompres canvas hasil komposit ke JPEG lalu simpan ke galeri. */
export function saveCanvasToGallery(
  canvas: HTMLCanvasElement,
  templateId: string,
): GallerySaveResult {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return saveGalleryItem({
    id: createGalleryId(),
    dataUrl,
    templateId,
    createdAt: Date.now(),
  });
}

export function removeGalleryItem(id: string): GalleryItem[] {
  if (!isBrowser()) return [];
  const next = loadGallery().filter((item) => item.id !== id);
  window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
  emit();
  return next;
}

export function createGalleryId(): string {
  return `rplbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Ekstensi file berdasarkan isi data URL (item lama bisa masih PNG). */
export function galleryFileExtension(dataUrl: string): "jpg" | "png" {
  return dataUrl.startsWith("data:image/jpeg") ? "jpg" : "png";
}
