"use client";

/**
 * Overlay countdown besar.
 *
 * Angka memakai `font-display-hero` (Bricolage Grotesque besar) berwarna
 * kuning #FDE047 dengan outline tebal. Setiap angka memicu animasi bounce
 * lewat `key`.
 */
export interface CountdownOverlayProps {
  /** Nilai hitungan saat ini; 0 berarti tidak tampil. */
  value: number;
}

export function CountdownOverlay({ value }: CountdownOverlayProps) {
  if (value <= 0) return null;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-on-surface/25"
    >
      <span
        key={value}
        className="animate-countdown-pop text-outline font-display-hero select-none text-flash"
      >
        {value}
      </span>
    </div>
  );
}

export default CountdownOverlay;
