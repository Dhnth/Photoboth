import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { TEMPLATES } from "@/lib/constants";

const STEPS = [
  {
    icon: "photo_library",
    title: "Pilih Template",
    body: "15 template Seoul 4-cut dengan slot yang sudah terdeteksi otomatis.",
  },
  {
    icon: "photo_camera",
    title: "Ambil 4 Foto",
    body: "Kamera langsung menghapus background hijau berkat chroma key realtime.",
  },
  {
    icon: "palette",
    title: "Percantik",
    body: "Pilih frame dan warna favoritmu. Kamera otomatis mati saat 4 foto selesai.",
  },
  {
    icon: "download",
    title: "Unduh",
    body: "Simpan hasil sebagai PNG resolusi penuh atau PDF siap cetak.",
  },
];

export default function Home() {
  return (
    <>
      <AppNav />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="paper-texture border-b-2 border-on-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center lg:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-flash px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide hard-shadow-sm">
              <span className="material-symbols-outlined is-filled" aria-hidden>
                auto_awesome
              </span>
              Green Screen Auto-Composite
            </span>

            <h1 className="font-display max-w-4xl text-balance text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Photobooth{" "}
              <span className="whitespace-nowrap text-primary">Seoul 4-Cut</span>{" "}
              langsung di browser
            </h1>

            <p className="max-w-2xl text-base font-medium text-on-surface-muted sm:text-lg">
              Tanpa aplikasi, tanpa bayar. Ambil foto dengan latar hijau, biarkan
              RPLBox menghapus background secara otomatis, lalu bingkai dengan
              template favoritmu.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/studio"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-on-surface bg-primary px-8 text-base font-bold text-white hard-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <span className="material-symbols-outlined is-filled" aria-hidden>
                  photo_camera
                </span>
                Mulai Foto
              </Link>
              <Link
                href="/gallery"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-on-surface bg-surface-lowest px-8 text-base font-bold hard-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  photo_library
                </span>
                Lihat Galeri
              </Link>
            </div>

            <p className="text-sm font-semibold text-on-surface-muted">
              {TEMPLATES.length} template siap pakai • PNG &amp; PDF • Gratis
            </p>
          </div>
        </section>

        {/* Cara kerja */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-extrabold">
            Empat langkah, satu strip
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border-2 border-on-surface bg-surface-lowest p-5 hard-shadow"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-on-surface bg-secondary text-white">
                  <span className="material-symbols-outlined is-filled" aria-hidden>
                    {step.icon}
                  </span>
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wide text-on-surface-muted">
                  Langkah {index + 1}
                </span>
                <h3 className="text-lg font-extrabold">{step.title}</h3>
                <p className="text-sm font-medium text-on-surface-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-on-surface bg-tertiary p-6 text-white hard-shadow sm:flex-row sm:items-center">
            <span
              className="material-symbols-outlined is-filled shrink-0 text-flash"
              style={{ fontSize: "2.5rem" }}
              aria-hidden
            >
              lightbulb
            </span>
            <div>
              <h3 className="text-lg font-extrabold">Tips hasil terbaik</h3>
              <p className="text-sm font-medium text-white/90">
                Gunakan latar hijau polos dan pencahayaan rata. Hindari memakai
                baju berwarna hijau agar tidak ikut terhapus oleh chroma key.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-on-surface bg-surface-low">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm font-semibold text-on-surface-muted sm:flex-row">
          <span>RPLBox — online 4-cut photobooth.</span>
          <span>Dibuat dengan Next.js, Sharp, dan Canvas API.</span>
        </div>
      </footer>
    </>
  );
}
