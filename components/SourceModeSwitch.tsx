"use client";

/**
 * Pemilih sumber foto: kamera langsung atau upload dari galeri.
 *
 * Dibuat sebagai dua kartu besar (bukan tab kecil) supaya jelas di layar HP
 * dan tetap nyaman diklik di desktop. Saat mode upload aktif, kamera
 * di-unmount sehingga track kamera berhenti—bukan cuma disembunyikan.
 */

export type PhotoSource = "camera" | "upload";

const OPTIONS: Array<{
  value: PhotoSource;
  label: string;
  hint: string;
  icon: string;
}> = [
  {
    value: "camera",
    label: "Kamera",
    hint: "Ambil langsung",
    icon: "photo_camera",
  },
  {
    value: "upload",
    label: "Upload Foto",
    hint: "Dari galeri HP/PC",
    icon: "add_a_photo",
  },
];

export interface SourceModeSwitchProps {
  value: PhotoSource;
  onChange: (value: PhotoSource) => void;
  disabled?: boolean;
}

export function SourceModeSwitch({
  value,
  onChange,
  disabled = false,
}: SourceModeSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Pilih sumber foto"
      className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-on-surface bg-surface-low p-1.5 hard-shadow-sm"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`group flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-left transition-all duration-100 sm:px-3 ${
              active
                ? "border-on-surface bg-primary text-white hard-shadow-sm"
                : "border-transparent bg-surface-lowest text-on-surface hover:border-on-surface/25 hover:bg-surface"
            } disabled:pointer-events-none disabled:opacity-50`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-on-surface transition-transform group-hover:-rotate-3 sm:h-10 sm:w-10 ${
                active ? "bg-white/15 text-white" : "bg-surface-container text-primary"
              }`}
              aria-hidden
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1.25rem" }}
              >
                {option.icon}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold leading-tight">
                {option.label}
              </span>
              <span
                className={`block truncate text-[10px] font-semibold leading-tight sm:text-[11px] ${
                  active ? "text-white/75" : "text-on-surface-muted"
                }`}
              >
                {option.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SourceModeSwitch;
