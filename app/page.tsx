import Image from "next/image";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { TEMPLATES, templateName, type Template } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

function getTemplate(id: string): Template {
  const template = TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error(`Template ${id} tidak ditemukan`);
  return template;
}

const HERO_MAIN = getTemplate("1");
const HERO_LEFT = getTemplate("3");
const HERO_RIGHT = getTemplate("6");

const WALL_TEMPLATES = ["1", "3", "5", "6", "14", "15"].map(getTemplate);
const WALL_ROTATIONS = [
  "lg:-rotate-2",
  "lg:rotate-1",
  "lg:-rotate-1",
  "lg:rotate-2",
  "lg:-rotate-2",
  "lg:rotate-1",
];
const WALL_OFFSETS = [
  "lg:mt-8",
  "lg:mt-0",
  "lg:mt-12",
  "lg:mt-4",
  "lg:mt-10",
  "lg:mt-2",
];

const MARQUEE_ITEMS = [
  "PHOTOBOOTH",
  "GREEN SCREEN",
  "15 FRAME",
  "6 WARNA",
  "PNG + PDF",
  "GRATIS",
];

const STEPS = [
  {
    number: "01",
    title: "Ambil 4 pose",
    body: "Green screen opsional, timer 3/5/10 detik, filter, dan retake per foto.",
  },
  {
    number: "02",
    title: "Pilih frame & warna",
    body: "15 frame dan 6 warna frame. Ganti warna tanpa mengulang sesi.",
  },
  {
    number: "03",
    title: "Unduh & simpan",
    body: "PNG resolusi penuh atau PDF A6. Kamera otomatis mati setelah 4/4.",
  },
];

const TIPS = [
  {
    title: "Latar hijau polos",
    body: "Kain atau dinding hijau tanpa motif. Makin rata, makin rapi.",
  },
  {
    title: "Cahaya merata",
    body: "Hindari bayangan keras di wajah atau di area green screen.",
  },
  {
    title: "Jangan pakai hijau",
    body: "Baju atau aksesori hijau ikut terhapus oleh chroma key.",
  },
];

/* ------------------------------------------------------------------ */
/* Ilustrasi strip                                                    */
/* ------------------------------------------------------------------ */

interface PortraitPalette {
  bg: string;
  shirt: string;
  skin: string;
  hair: string;
  cheek: string;
  accent: string;
}

const PORTRAITS: PortraitPalette[] = [
  {
    bg: "#d9c2ff",
    shirt: "#8127cf",
    skin: "#f2c6a0",
    hair: "#1c192c",
    cheek: "#ff8fc7",
    accent: "#ffffff",
  },
  {
    bg: "#b8ecd8",
    shirt: "#b10e6b",
    skin: "#8d5524",
    hair: "#1c192c",
    cheek: "#fde047",
    accent: "#ffffff",
  },
  {
    bg: "#ffd9b3",
    shirt: "#006577",
    skin: "#e0ac69",
    hair: "#5a3a22",
    cheek: "#ff8fc7",
    accent: "#ffffff",
  },
  {
    bg: "#ff8fc7",
    shirt: "#1c192c",
    skin: "#f2c6a0",
    hair: "#1c192c",
    cheek: "#fde047",
    accent: "#ffffff",
  },
];

/**
 * Wajah ilustrasi sederhana untuk mengisi contoh slot di landing page.
 * Bukan foto asli—hanya daya tarik visual agar frame tidak terlihat kosong.
 */
function MockPortrait({ variant }: { variant: number }) {
  const palette = PORTRAITS[variant % PORTRAITS.length];
  const hairStyle = variant % 4;

  return (
    <svg
      viewBox="0 0 100 75"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      <rect width="100" height="75" fill={palette.bg} />
      <circle cx="82" cy="13" r="20" fill={palette.accent} opacity="0.3" />
      <circle cx="14" cy="67" r="16" fill={palette.accent} opacity="0.2" />

      <path
        d="M4 75c4-16 18-24 46-24s42 8 46 24Z"
        fill={palette.shirt}
      />
      <rect x="43" y="42" width="14" height="15" rx="7" fill={palette.skin} />
      <circle cx="50" cy="32" r="17" fill={palette.skin} />

      {hairStyle === 0 ? (
        <path
          d="M33 31c0-11 7-17 17-17s17 6 17 17c-4-5-9-7-17-7s-13 2-17 7Z"
          fill={palette.hair}
        />
      ) : null}
      {hairStyle === 1 ? (
        <path
          d="M31 38c0-16 8-24 19-24s19 8 19 24c0 4-1 7-3 9V33c-4-3-9-5-16-5s-12 2-16 5v14c-2-2-3-5-3-9Z"
          fill={palette.hair}
        />
      ) : null}
      {hairStyle === 2 ? (
        <>
          <path
            d="M33 30c0-10 7-16 17-16s17 6 17 16H33Z"
            fill={palette.hair}
          />
          <path
            d="M31 31h38"
            stroke="#1c192c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {hairStyle === 3 ? (
        <>
          <path
            d="M33 31c0-11 7-17 17-17s17 6 17 17c-4-5-9-7-17-7s-13 2-17 7Z"
            fill={palette.hair}
          />
          <circle cx="35" cy="24" r="6" fill={palette.hair} />
          <circle cx="46" cy="19" r="7" fill={palette.hair} />
          <circle cx="58" cy="20" r="6" fill={palette.hair} />
          <circle cx="65" cy="27" r="5" fill={palette.hair} />
        </>
      ) : null}

      <circle cx="44" cy="33" r="1.8" fill="#1c192c" />
      <circle cx="56" cy="33" r="1.8" fill="#1c192c" />
      <path
        d="M45.5 40c2 2.2 7 2.2 9 0"
        stroke="#1c192c"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="39" cy="38" r="2" fill={palette.cheek} opacity="0.7" />
      <circle cx="61" cy="38" r="2" fill={palette.cheek} opacity="0.7" />
    </svg>
  );
}

function MockStrip({
  template,
  className = "",
  priority = false,
}: {
  template: Template;
  className?: string;
  priority?: boolean;
}) {
  const src = `/ready/thumbs/${template.file.replace(/\.png$/i, ".webp")}`;

  return (
    <div
      className={`rounded-[1.1rem] border-2 border-on-surface bg-white p-1.5 hard-shadow-lg ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-[0.75rem] bg-surface-container"
        style={{ aspectRatio: `${template.width} / ${template.height}` }}
      >
        {template.slots.map((slot, index) => (
          <div
            key={`${template.id}-${index}`}
            aria-hidden
            className="absolute overflow-hidden"
            style={{
              left: `${(slot.x / template.width) * 100}%`,
              top: `${(slot.y / template.height) * 100}%`,
              width: `${(slot.w / template.width) * 100}%`,
              height: `${(slot.h / template.height) * 100}%`,
            }}
          >
            <MockPortrait variant={index + Number(template.id)} />
          </div>
        ))}

        <Image
          src={src}
          alt={`Contoh strip dengan frame ${templateName(template.id)}`}
          fill
          priority={priority}
          unoptimized
          sizes="(min-width: 1024px) 220px, 45vw"
          className="absolute inset-0 z-10 object-cover"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                            */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <AppNav />

      <main className="flex flex-1 flex-col">
        {/* HERO */}
        <section className="paper-texture relative overflow-hidden border-b-2 border-on-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8 lg:py-20">
            <div className="relative z-10 flex flex-col items-start">
              <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-on-surface-muted sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                <span>RPLBox / Photobooth</span>
                <span className="text-on-surface/25" aria-hidden>
                  /
                </span>
                <span>Est. 2026</span>
              </div>

              <h1 className="font-display max-w-3xl text-balance text-[clamp(2.75rem,6.9vw,5.3rem)] font-extrabold leading-[0.9] tracking-[-0.045em]">
                Empat pose.
                <br />
                Satu{" "}
                <span className="relative inline-block">
                  <span
                    aria-hidden
                    className="absolute inset-x-[-0.06em] bottom-[0.08em] h-[0.22em] -rotate-1 bg-flash"
                  />
                  <span className="relative">strip.</span>
                </span>
                <br />
                Langsung jadi.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base font-medium text-on-surface-muted sm:text-lg">
                Photobooth langsung di browser. Green screen opsional, 15
                frame, hasil PNG atau PDF. Tanpa install, tanpa bayar.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/studio"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-on-surface bg-primary px-8 text-base font-bold text-white hard-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:w-auto"
                >
                  <span
                    className="material-symbols-outlined is-filled"
                    aria-hidden
                  >
                    photo_camera
                  </span>
                  Mulai foto
                </Link>
                <Link
                  href="#frame-wall"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-on-surface bg-surface-lowest px-8 text-base font-bold text-on-surface hard-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:w-auto"
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    photo_library
                  </span>
                  Intip 15 frame
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 border-t-2 border-dashed border-on-surface/25 pt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-on-surface-muted sm:gap-x-3 sm:text-xs sm:tracking-[0.12em]">
                <span>{TEMPLATES.length} frame</span>
                <span aria-hidden>•</span>
                <span>6 warna frame</span>
                <span aria-hidden>•</span>
                <span>PNG + PDF</span>
                <span aria-hidden>•</span>
                <span>Gratis</span>
              </div>
            </div>

            {/* Fan strip */}
            <div className="relative mx-auto mt-2 h-[540px] w-full max-w-[460px] sm:h-[660px] lg:mt-0 lg:h-[680px]">
              <div
                aria-hidden
                className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-[78%] -translate-x-1/2 rotate-3 rounded-[2rem] border-2 border-dashed border-on-surface/15 bg-surface-container/60"
              />

              <MockStrip
                template={HERO_LEFT}
                className="absolute left-0 top-20 z-0 w-[31%] -rotate-6 sm:top-24"
              />
              <MockStrip
                template={HERO_RIGHT}
                className="absolute right-0 top-24 z-0 w-[31%] rotate-6 sm:top-28"
              />
              <MockStrip
                template={HERO_MAIN}
                priority
                className="absolute left-1/2 top-0 z-10 w-[46%] -translate-x-1/2 -rotate-2"
              />

              <div className="absolute -left-1 top-2 z-20 flex h-20 w-20 -rotate-12 items-center justify-center rounded-full border-2 border-on-surface bg-flash text-center font-display text-sm font-extrabold uppercase leading-[0.9] hard-shadow-sm sm:h-24 sm:w-24 sm:text-base">
                4
                <br />
                cut
              </div>

              <div className="absolute bottom-8 right-0 z-20 -rotate-3 rounded-xl border-2 border-on-surface bg-white px-3 py-2 text-left hard-shadow-sm">
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-on-surface-muted">
                  Timer
                </span>
                <span className="font-display text-lg font-extrabold leading-none">
                  3 sec
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div
          className="overflow-hidden border-b-2 border-on-surface bg-flash py-3"
          aria-hidden
        >
          <div className="animate-marquee flex w-max items-center">
            {[0, 1].map((group) => (
              <div
                key={group}
                className="flex shrink-0 items-center gap-6 pr-6"
              >
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${group}-${item}`}
                    className="flex items-center gap-6 whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-[0.16em] sm:text-base"
                  >
                    {item}
                    <span className="text-primary">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FRAME WALL */}
        <section
          id="frame-wall"
          className="scroll-mt-20 border-b-2 border-on-surface bg-surface-low"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary sm:text-xs">
                  Frame wall / 15 pilihan
                </p>
                <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Satu strip,
                  <br />
                  banyak mood.
                </h2>
                <p className="mt-3 text-sm font-medium text-on-surface-muted sm:text-base">
                  Dari retro player sampai comic smash. Semua frame punya empat
                  slot yang sudah siap diisi. Klik satu frame untuk langsung
                  memakainya.
                </p>
              </div>

              <Link
                href="/studio"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-on-surface bg-surface-lowest px-5 text-sm font-bold hard-shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Buka semua frame
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6 lg:gap-x-3">
              {WALL_TEMPLATES.map((template, index) => {
                const name = templateName(template.id);
                const src = `/ready/thumbs/${template.file.replace(/\.png$/i, ".webp")}`;

                return (
                  <Link
                    key={template.id}
                    href={`/studio?frame=${template.id}`}
                    aria-label={`Pakai frame ${name}`}
                    className={`group relative block transition-transform duration-200 hover:z-10 hover:-translate-y-1.5 hover:rotate-0 ${WALL_ROTATIONS[index] ?? ""} ${WALL_OFFSETS[index] ?? ""}`}
                  >
                    <div className="rounded-xl border-2 border-on-surface bg-white p-1.5 hard-shadow-sm transition-shadow group-hover:hard-shadow">
                      <div
                        className="relative overflow-hidden rounded-lg bg-surface-container"
                        style={{
                          aspectRatio: `${template.width} / ${template.height}`,
                        }}
                      >
                        <Image
                          src={src}
                          alt={`Frame ${name}`}
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 16vw, 30vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1 px-0.5">
                      <span
                        className="truncate text-[10px] font-extrabold sm:text-xs lg:text-[13px]"
                        title={name}
                      >
                        {name}
                      </span>
                      <span
                        aria-hidden
                        className="text-sm font-bold text-primary transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CARA KERJA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="overflow-hidden rounded-3xl border-2 border-on-surface bg-surface-lowest hard-shadow-lg">
            <div className="flex flex-col gap-2 border-b-2 border-dashed border-on-surface/30 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary sm:text-xs">
                  Cara kerja / 3 langkah
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Dari pose ke print.
                </h2>
              </div>
              <p className="max-w-xs text-sm font-medium text-on-surface-muted sm:text-right">
                Rata-rata dua menit. Semua prosesnya ada di browser.
              </p>
            </div>

            <div className="grid divide-y-2 divide-dashed divide-on-surface/25 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
              {STEPS.map((step) => (
                <div key={step.number} className="flex flex-col gap-3 p-6 sm:p-8">
                  <span className="font-display text-6xl font-extrabold leading-none text-primary/20">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-extrabold">{step.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-on-surface-muted">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t-2 border-on-surface/20 bg-flash px-6 py-3 text-xs font-bold sm:px-8">
              <span className="material-symbols-outlined" aria-hidden>
                photo_camera
              </span>
              Kamera otomatis mati setelah 4/4 — lebih hemat baterai.
            </div>
          </div>
        </section>

        {/* GREEN SCREEN 101 */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border-2 border-on-surface bg-surface-lowest p-6 hard-shadow-lg sm:p-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary sm:text-xs">
                Green screen 101
              </p>
              <h2 className="mt-2 max-w-lg text-3xl font-extrabold tracking-tight sm:text-4xl">
                Cut-out rapi,
                <br />
                tanpa drama.
              </h2>
              <p className="mt-3 max-w-md text-sm font-medium text-on-surface-muted sm:text-base">
                Tiga hal kecil yang bikin tepi foto jauh lebih bersih.
              </p>

              <ol className="mt-7 grid gap-5 sm:grid-cols-3">
                {TIPS.map((tip, index) => (
                  <li
                    key={tip.title}
                    className="border-t-2 border-dashed border-on-surface/25 pt-3"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                      0{index + 1}
                    </span>
                    <h3 className="mt-1 text-sm font-extrabold">{tip.title}</h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-on-surface-muted">
                      {tip.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col rounded-3xl border-2 border-on-surface bg-tertiary p-6 text-white hard-shadow-lg sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-flash sm:text-xs">
                  Area hijau
                </p>
                <span className="rounded-full border border-white/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/70">
                  Chroma key
                </span>
              </div>

              <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl border-2 border-on-surface bg-[#2f9e4f]">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 12px)",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-4 rounded-xl border-2 border-dashed border-white/50"
                />

                <svg
                  viewBox="0 0 100 75"
                  preserveAspectRatio="xMidYMax meet"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden
                  focusable="false"
                >
                  <path
                    d="M12 75c4-18 17-27 38-27s34 9 38 27Z"
                    fill="#ffffff"
                    opacity="0.94"
                  />
                  <rect
                    x="43"
                    y="42"
                    width="14"
                    height="13"
                    rx="7"
                    fill="#f2c6a0"
                  />
                  <circle
                    cx="50"
                    cy="32"
                    r="16"
                    fill="#f2c6a0"
                    stroke="#1c192c"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M34 31c0-10 7-16 16-16s16 6 16 16c-4-5-9-7-16-7s-12 2-16 7Z"
                    fill="#1c192c"
                  />
                  <circle cx="44" cy="33" r="1.7" fill="#1c192c" />
                  <circle cx="56" cy="33" r="1.7" fill="#1c192c" />
                  <path
                    d="M46 40c2 2 6 2 8 0"
                    stroke="#1c192c"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Area hapus
                </span>
                <span className="absolute bottom-3 left-3 rounded-full border border-on-surface/30 bg-white/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-on-surface">
                  Subjek
                </span>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-white/80">
                Aktifkan toggle “Hapus background hijau” saat memakai kain
                hijau. Yang hijau dihapus, yang bukan hijau dipertahankan. Pakai
                kain polos dan cahaya rata untuk hasil paling bersih.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-y-2 border-on-surface bg-primary">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-24 select-none font-display text-[18rem] font-extrabold leading-none text-white/10 sm:text-[26rem]"
          >
            4
          </span>

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/65 sm:text-xs">
                Siap pose?
              </p>
              <h2 className="mt-2 text-4xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-5xl">
                Strip berikutnya
                <br />
                bisa jadi milikmu.
              </h2>
              <p className="mt-3 max-w-md text-sm font-medium text-white/75 sm:text-base">
                Pilih frame, ambil empat foto, lalu unduh. Semuanya gratis dan
                langsung jalan di browser.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <Link
                href="/studio"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-on-surface bg-flash px-8 text-base font-bold text-on-surface hard-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <span
                  className="material-symbols-outlined is-filled"
                  aria-hidden
                >
                  photo_camera
                </span>
                Mulai foto
              </Link>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                15 frame • 6 warna • gratis
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-on-surface text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white/20 bg-primary text-white">
                <span
                  className="material-symbols-outlined is-filled"
                  aria-hidden
                >
                  photo_camera
                </span>
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight">
                RPLBox
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm font-medium text-white/55">
              Photobooth browser untuk pose spontan dan strip yang layak
              disimpan.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
            <Link href="/studio" className="text-white/70 hover:text-white">
              Studio
            </Link>
            <Link href="/gallery" className="text-white/70 hover:text-white">
              Galeri
            </Link>
            <Link href="#frame-wall" className="text-white/70 hover:text-white">
              Frame
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-[11px] font-semibold text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 RPLBox. Semua foto diproses di browser.</span>
            <span>Next.js · Sharp · Canvas API</span>
          </div>
        </div>
      </footer>
    </>
  );
}
