"use client";

/**
 * Error boundary route-level. Menangkap error tak terduga di halaman dan
 * memberi jalan keluar yang jelas (coba lagi / kembali ke beranda) alih-alih
 * layar error bawaan Next.js.
 */
import { useEffect } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Terjadi error di halaman:", error);
  }, [error]);

  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: "3.5rem" }}
          aria-hidden
        >
          no_photography
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold">Ada yang tidak beres</h1>
          <p className="text-sm font-medium text-on-surface-muted">
            Halaman gagal dimuat. Coba lagi—kalau masih gagal, kembali ke beranda
            atau muat ulang browser.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-on-surface bg-primary px-5 text-sm font-bold text-white hard-shadow active:translate-y-0.5 active:shadow-none"
          >
            <span className="material-symbols-outlined" aria-hidden>
              refresh
            </span>
            Coba Lagi
          </button>
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
