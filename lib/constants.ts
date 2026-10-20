/**
 * Konstanta & tipe global RPLBox.
 *
 * Metadata slot dibaca dari public/ready/slots.json (hasil Fase 1). Import
 * statis dipakai supaya nilainya ikut ter-bundle saat build — tidak ada
 * pembacaan file saat runtime di browser.
 */
import slotsFile from "@/public/ready/slots.json";

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Template {
  id: string;
  file: string;
  width: number;
  height: number;
  slots: Slot[];
}

export interface SlotsFile {
  templates: Template[];
}

/** Semua template yang siap dipakai di /studio. */
export const TEMPLATES: Template[] = (slotsFile as SlotsFile).templates;

/** Jumlah slot baku sebuah strip 4-cut. */
export const SLOTS_PER_STRIP = 4;

/** Nama tampilan untuk tiap template (id berasal dari nama file). */
export const TEMPLATE_NAMES: Record<string, string> = {
  "1": "Retro Player",
  "2": "City Exit",
  "3": "Blue Checker",
  "4": "Pink Checker",
  "5": "Hindia",
  "6": "Comic Smash",
  "7": "Capture Moment",
  "8": "Sounds of The Sea",
  "9": "Route 66",
  "10": "Street Snap",
  "11": "Midnight Wave",
  "12": "Carnival",
  "13": "Antique 2026",
  "14": "RPL Studio",
  "15": "Persona 5",
};

export function templateName(id: string): string {
  return TEMPLATE_NAMES[id] ?? `Template ${id}`;
}

/** Warna frame yang bisa dipilih user (spec Fase 2). */
export interface FrameColor {
  id: string;
  name: string;
  hex: string;
  /** Warna teks yang kontras di atas warna ini. */
  ink: string;
}

export const FRAME_COLORS: FrameColor[] = [
  { id: "classic-white", name: "Classic White", hex: "#ffffff", ink: "#1c192c" },
  { id: "pitch-black", name: "Pitch Black", hex: "#1c192c", ink: "#ffffff" },
  { id: "pastel-lilac", name: "Pastel Lilac", hex: "#d9c2ff", ink: "#1c192c" },
  { id: "butter-peach", name: "Butter Peach", hex: "#ffd9b3", ink: "#1c192c" },
  { id: "haru-mint", name: "Haru Mint", hex: "#b8ecd8", ink: "#1c192c" },
  { id: "barbie-pink", name: "Barbie Pink", hex: "#ff8fc7", ink: "#1c192c" },
];

export const DEFAULT_FRAME_COLOR = FRAME_COLORS[0];

/**
 * Preset filter kamera. Nilainya adalah CSS filter string yang diterapkan
 * lewat CanvasRenderingContext2D.filter saat frame digambar.
 */
export interface FilterPreset {
  id: string;
  name: string;
  css: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "normal", name: "Normal", css: "none" },
  { id: "warm", name: "Warm", css: "saturate(1.15) sepia(0.12) contrast(1.05)" },
  { id: "cool", name: "Cool", css: "saturate(1.1) hue-rotate(-12deg) brightness(1.03)" },
  { id: "mono", name: "Mono", css: "grayscale(1) contrast(1.08)" },
  { id: "vivid", name: "Vivid", css: "saturate(1.5) contrast(1.12)" },
  { id: "fade", name: "Fade", css: "contrast(0.92) brightness(1.08) saturate(0.9)" },
];

export const DEFAULT_FILTER = FILTER_PRESETS[0];

/** Pilihan timer (detik). */
export const TIMER_OPTIONS = [3, 5, 10] as const;
export type TimerSeconds = (typeof TIMER_OPTIONS)[number];

/** Kunci penyimpanan hasil di localStorage. */
export const GALLERY_STORAGE_KEY = "rplbox.gallery.v1";
