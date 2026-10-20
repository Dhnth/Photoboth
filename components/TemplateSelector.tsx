"use client";

/**
 * Grid pemilih template. Thumbnail memakai WebP ringan dari /ready/thumbs
 * dengan rasio asli (tidak di-crop) supaya seluruh frame terlihat.
 *
 * Grid memakai 3 kolom dan dapat di-scroll di dalam panel agar 15 template
 * tetap muat tanpa memanjangkan halaman. Template penuh baru diunduh saat
 * dipilih — kartu yang dipilih menampilkan spinner sampai unduhan selesai.
 */
import { TEMPLATES, templateName, type Template } from "@/lib/constants";

export interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (templateId: string) => void;
  templates?: Template[];
  /** Id template yang gambarnya sedang dimuat (untuk indikator loading). */
  loadingId?: string | null;
  /** Mode di dalam drawer mobile: tanpa heading dan daftar mengisi tinggi. */
  embedded?: boolean;
  /** Pesan error pemuatan template. */
  error?: string;
}

export function TemplateSelector({
  selectedId,
  onSelect,
  templates = TEMPLATES,
  loadingId = null,
  embedded = false,
  error = "",
}: TemplateSelectorProps) {
  return (
    <div
      className={
        embedded ? "flex h-full min-h-0 flex-col gap-2" : "flex flex-col gap-2"
      }
    >
      {!embedded ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Pilih Frame</h2>
            <span className="rounded-full border-2 border-on-surface bg-surface-low px-3 py-1 text-[11px] font-bold uppercase">
              {templates.length} frame
            </span>
          </div>
          <p className="-mt-1 text-xs font-semibold text-on-surface-muted">
            Geser area di bawah untuk melihat semua frame.
          </p>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-muted">
            {templates.length} frame tersedia
          </span>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border-2 border-primary bg-surface-low px-3 py-2 text-xs font-semibold text-primary"
        >
          {error}
        </p>
      ) : null}

      <div
        className={`overflow-y-auto rounded-2xl border-2 border-on-surface bg-surface-low p-3 hard-shadow-sm ${
          embedded ? "min-h-0 flex-1" : "max-h-[70vh]"
        }`}
      >
        <div className="grid grid-cols-3 gap-3">
          {templates.map((template) => {
            const active = template.id === selectedId;
            const pending = loadingId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.id)}
                aria-pressed={active}
                aria-busy={pending}
                className={`group relative flex flex-col overflow-hidden rounded-xl border-2 border-on-surface bg-surface-lowest text-left transition-all hard-shadow-sm ${
                  active || pending
                    ? "-translate-y-0.5 hard-shadow"
                    : "hover:-translate-y-0.5"
                } ${pending ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                <div className="relative w-full overflow-hidden bg-surface-container">
                  {/* Thumbnail WebP ringan + lazy loading: tidak mengunduh
                      semua template sekaligus saat halaman dibuka. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/ready/thumbs/${template.file.replace(/\.png$/i, ".webp")}`}
                    alt={templateName(template.id)}
                    width={360}
                    height={1080}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full"
                  />
                  {pending ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[1px]">
                      <span
                        className="h-6 w-6 animate-spin rounded-full border-2 border-on-surface border-t-primary"
                        aria-hidden
                      />
                      <span className="text-[10px] font-bold uppercase text-on-surface-muted">
                        Memuat…
                      </span>
                    </div>
                  ) : null}
                  {template.slots.length === 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-on-surface/60 text-xs font-bold text-white">
                      Tanpa slot
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-1 px-2 py-2">
                  <span className="line-clamp-2 min-w-0 text-xs font-bold leading-tight sm:text-sm">
                    {templateName(template.id)}
                  </span>
                  {!embedded ? (
                    <span className="shrink-0 text-[9px] font-bold uppercase text-on-surface-muted">
                      {template.slots.length} slot
                    </span>
                  ) : null}
                </div>

                {active ? (
                  <span className="absolute right-1.5 top-1.5 rounded-full border-2 border-on-surface bg-primary px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                    Terpilih
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;
