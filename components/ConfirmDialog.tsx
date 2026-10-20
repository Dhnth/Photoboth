"use client";

import { useEffect, useId, useRef } from "react";

export type ConfirmDialogTone = "danger" | "default";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog konfirmasi custom RPLBox.
 *
 * Memakai overlay fixed + role="dialog" agar tidak bergantung pada
 * window.confirm yang tampilannya tidak bisa diselaraskan dengan brand.
 * Fokus dikunci di dalam dialog, Escape membatalkan, dan scroll halaman
 * dihentikan selama dialog terbuka.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  const icon = tone === "danger" ? "delete" : "refresh";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-on-surface/60 p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="animate-modal-in max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-on-surface bg-surface-lowest p-5 hard-shadow-lg outline-none sm:p-6"
      >
        <div className="flex items-start gap-3.5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-on-surface hard-shadow-sm ${
              tone === "danger"
                ? "bg-primary text-white"
                : "bg-flash text-on-surface"
            }`}
          >
            <span
              className="material-symbols-outlined is-filled"
              aria-hidden
            >
              {icon}
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
              Konfirmasi
            </p>
            <h2
              id={titleId}
              className="font-display mt-1 text-xl font-extrabold leading-tight"
            >
              {title}
            </h2>
          </div>
        </div>

        <p
          id={descriptionId}
          className="mt-4 text-sm font-medium leading-relaxed text-on-surface-muted"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-full border-2 border-on-surface bg-surface-lowest px-5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex h-11 items-center justify-center rounded-full border-2 border-on-surface px-5 text-sm font-bold text-white transition-transform hard-shadow-sm hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
              tone === "danger" ? "bg-primary" : "bg-secondary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
