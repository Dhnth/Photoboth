import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export default function NotFound() {
  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: "3.5rem" }}
          aria-hidden
        >
          image_not_supported
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-muted">
            Error 404
          </p>
          <h1 className="text-3xl font-extrabold">Halaman tidak ditemukan</h1>
          <p className="text-sm font-medium text-on-surface-muted">
            Tautan yang kamu buka mungkin sudah dipindahkan atau tidak pernah ada.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/studio"
            className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-on-surface bg-primary px-5 text-sm font-bold text-white hard-shadow active:translate-y-0.5 active:shadow-none"
          >
            <span className="material-symbols-outlined" aria-hidden>
              photo_camera
            </span>
            Buka Studio
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-on-surface bg-surface-lowest px-5 text-sm font-bold hard-shadow active:translate-y-0.5 active:shadow-none"
          >
            <span className="material-symbols-outlined" aria-hidden>
              home
            </span>
            Beranda
          </Link>
        </div>
      </main>
    </>
  );
}
