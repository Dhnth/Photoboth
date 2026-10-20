"use client";

/**
 * Viewport kamera photobooth.
 *
 * Alur realtime tiap frame (requestAnimationFrame):
 *   draw video ke canvas → getImageData → chromaKey() → putImageData
 * sehingga background hijau langsung terlihat hilang di preview.
 *
 * Komponen ini juga menangani:
 *  - izin kamera + pesan error (ditolak / tidak ada kamera / browser tidak
 *    mendukung),
 *  - flip kamera dan pilihan timer (3/5/10 detik),
 *  - pilihan filter (diterapkan SETELAH chroma key agar deteksi hijau tetap
 *    akurat dan tidak muncul bercak putih),
 *  - tombol shutter besar dan urutan countdown,
 *  - HUD: kurung sudut, badge REC • SHOT x OF 4, badge filter.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  FILTER_PRESETS,
  type FilterPreset,
  TIMER_OPTIONS,
  type TimerSeconds,
  DEFAULT_FILTER,
} from "@/lib/constants";
import { chromaKey } from "@/lib/chromaKey";
import { PillButton } from "@/components/ui/PillButton";
import { CountdownOverlay } from "@/components/CountdownOverlay";

/** Lebar maksimum frame yang diproses agar chroma key tetap 60fps. */
const MAX_PROCESS_WIDTH = 720;

/** Hentikan kamera saat tab tidak terlihat agar hemat baterai + privasi. */
function subscribeVisibility(listener: () => void): () => void {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}

function getVisibilitySnapshot(): boolean {
  return document.visibilityState === "visible";
}

function getVisibilityServerSnapshot(): boolean {
  return true;
}

export interface CameraViewportProps {
  /** Index slot (0-based) yang akan diisi berikutnya; null jika tidak ada. */
  nextSlot: number | null;
  /** Total slot dalam satu strip. */
  totalShots: number;
  /** True jika pengambilan berikutnya mengganti foto yang sudah ada. */
  retaking?: boolean;
  /** Dipanggil saat satu frame berhasil ditangkap. */
  onCapture: (photo: HTMLCanvasElement) => void;
  /** Nonaktifkan shutter (mis. saat sudah penuh atau sedang memproses). */
  disabled?: boolean;
  /** Warna latar panggung (warna frame) agar area transparan tidak hitam. */
  backgroundColor?: string;
}

type Status = "starting" | "ready" | "error";

function describeError(error: unknown): string {
  const name = (error as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Izin kamera ditolak. Aktifkan izin kamera di browser lalu muat ulang halaman.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "Kamera tidak ditemukan. Pastikan webcam terpasang dan tidak dipakai aplikasi lain.";
    case "NotReadableError":
    case "TrackStartError":
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "Kamera dengan posisi tersebut tidak tersedia. Coba tombol Flip atau gunakan kamera lain.";
    default:
      return "Kamera gagal dibuka. Coba muat ulang atau gunakan browser lain.";
  }
}

export function CameraViewport({
  nextSlot,
  totalShots,
  retaking = false,
  onCapture,
  disabled = false,
  backgroundColor = "#1c192c",
}: CameraViewportProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const onCaptureRef = useRef(onCapture);

  const [status, setStatus] = useState<Status>("starting");
  const [errorMessage, setErrorMessage] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [timer, setTimer] = useState<TimerSeconds>(3);
  const [filter, setFilter] = useState<FilterPreset>(DEFAULT_FILTER);
  const [countdown, setCountdown] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot,
  );

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /** Buka kamera. Dipanggil ulang saat facing/restart/visibility berubah. */
  useEffect(() => {
    if (!pageVisible) {
      stopStream();
      return;
    }

    let cancelled = false;

    async function start(): Promise<void> {
      setStatus("starting");
      setErrorMessage("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMessage(
          "Browser ini tidak mendukung akses kamera (getUserMedia). Gunakan Chrome, Edge, Safari, atau Firefox terbaru.",
        );
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: facing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch (error) {
          const name = (error as { name?: string }).name;
          // Sebagian perangkat tidak punya kamera environment; fallback ke
          // kamera default daripada gagal total.
          if (
            name === "OverconstrainedError" ||
            name === "ConstraintNotSatisfiedError"
          ) {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: true,
            });
          } else {
            throw error;
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            // Abaikan event dari track yang memang kita hentikan sendiri.
            if (cancelled || streamRef.current !== stream) return;
            setStatus("error");
            setErrorMessage(
              "Kamera terputus. Periksa sambungan lalu tekan Coba Lagi.",
            );
            stopStream();
          });
        });

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            if (cancelled) return;
            stopStream();
            setStatus("error");
            setErrorMessage(
              "Kamera tidak bisa diputar. Coba muat ulang halaman atau gunakan browser lain.",
            );
            return;
          }
        }

        if (cancelled) return;
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(describeError(error));
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, stopStream, pageVisible, restartKey]);

  /**
   * Loop pemrosesan: gambar video → chroma key → tulis ke canvas.
   * Berhenti otomatis saat komponen dibongkar atau tab tidak terlihat.
   */
  useEffect(() => {
    if (status !== "ready" || !pageVisible) return;

    let running = true;

    const renderFrame = (): void => {
      if (!running) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const scale = Math.min(1, MAX_PROCESS_WIDTH / video.videoWidth);
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      // Chroma key memakai warna asli video (tanpa filter) supaya deteksi
      // hijau stabil. Filter hanya diterapkan saat ditampilkan/ditangkap.
      ctx.save();
      if (facing === "user") {
        // Cermin untuk kamera depan supaya terasa natural.
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();

      const frame = ctx.getImageData(0, 0, width, height);
      const keyed = chromaKey(frame, {
        tolerance: 0.08,
        feather: 1,
        spillReduction: 0.3,
      });
      ctx.putImageData(keyed, 0, 0);

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    rafRef.current = requestAnimationFrame(renderFrame);

    return () => {
      running = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [status, facing, pageVisible]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  /** Ambil frame canvas saat ini sebagai foto. */
  const capture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;

    const photo = document.createElement("canvas");
    photo.width = canvas.width;
    photo.height = canvas.height;
    const ctx = photo.getContext("2d");
    if (!ctx) return;

    // Terapkan filter saat menyalin ke foto hasil (filter tidak memengaruhi
    // chroma key karena keying sudah dilakukan pada frame mentah).
    ctx.filter = filter.css;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";

    onCaptureRef.current(photo);
  }, [filter]);

  const triggerShutter = useCallback(() => {
    if (disabled || status !== "ready" || countdown > 0) return;

    let remaining = timer;
    setCountdown(remaining);

    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdown(0);
        capture();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [disabled, status, countdown, timer, capture]);

  const atCapacity = nextSlot === null;
  const displayShot = nextSlot === null ? totalShots : nextSlot + 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Panggung kamera */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-on-surface hard-shadow"
        style={{ backgroundColor }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
        />

        {status === "error" ? (
          <div
            role="alert"
            className="flex min-h-[320px] items-center justify-center p-6"
          >
            <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-on-surface bg-surface-lowest p-6 text-center hard-shadow-sm">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: "3rem" }}
                aria-hidden
              >
                no_photography
              </span>
              <p className="text-sm font-semibold">{errorMessage}</p>
              <PillButton
                variant="ghost"
                icon="refresh"
                onClick={() => setRestartKey((key) => key + 1)}
              >
                Coba Lagi
              </PillButton>
            </div>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="block h-auto w-full"
              style={{ filter: filter.css === "none" ? undefined : filter.css }}
            />

            {/* HUD: kurung sudut */}
            <div className="pointer-events-none absolute inset-3">
              <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-flash" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-flash" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-flash" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-flash" />
            </div>

            {/* Badge REC */}
            <div
              role="status"
              aria-live="polite"
              className="absolute left-4 top-4 flex items-center gap-2 rounded-full border-2 border-on-surface bg-white/90 px-3 py-1 text-xs font-extrabold uppercase tracking-wide"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
              REC • SHOT {displayShot} OF {totalShots}
            </div>

            {/* Badge filter */}
            <div className="absolute bottom-4 left-4 rounded-full border-2 border-on-surface bg-white/90 px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
              Filter: {filter.name}
            </div>

            {status === "starting" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-on-surface/35">
                <div className="flex items-center gap-2 rounded-full border-2 border-on-surface bg-surface-lowest px-4 py-2 text-sm font-bold text-on-surface hard-shadow-sm">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-on-surface border-t-primary"
                    aria-hidden
                  />
                  Menyiapkan kamera…
                </div>
              </div>
            ) : null}

            <CountdownOverlay value={countdown} />
          </div>
        )}
      </div>

      {/* Kontrol */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-on-surface bg-surface-lowest p-3 hard-shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setFacing((prev) => (prev === "user" ? "environment" : "user"))
            }
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-on-surface bg-surface-low px-4 text-sm font-bold"
          >
            <span className="material-symbols-outlined" aria-hidden>
              flip_camera_android
            </span>
            Flip
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-on-surface-muted">
            Timer
          </span>
          <div className="flex overflow-hidden rounded-full border-2 border-on-surface">
            {TIMER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTimer(option)}
                aria-pressed={timer === option}
                className={`h-9 w-11 text-sm font-bold transition-colors ${
                  timer === option
                    ? "bg-primary text-white"
                    : "bg-surface-lowest text-on-surface"
                }`}
              >
                {option}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setFilter(preset)}
            aria-pressed={filter.id === preset.id}
            className={`rounded-full border-2 border-on-surface px-4 py-1.5 text-xs font-bold transition-colors ${
              filter.id === preset.id
                ? "bg-secondary text-white hard-shadow-sm"
                : "bg-surface-lowest"
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Shutter */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <PillButton
          size="lg"
          variant="primary"
          icon="photo_camera"
          filledIcon
          onClick={triggerShutter}
          disabled={disabled || atCapacity || status !== "ready" || countdown > 0}
          className="w-full max-w-xs justify-center"
        >
          {atCapacity
            ? "Semua foto siap"
            : countdown > 0
              ? `Bersiap… ${countdown}`
              : `${retaking ? "Ganti" : "Ambil"} Foto ${displayShot}`}
        </PillButton>
        <p className="text-xs font-semibold text-on-surface-muted">
          Ambient hijau &amp; rata lebih mudah dihapus. Hindari memakai baju hijau.
        </p>
      </div>
    </div>
  );
}

export default CameraViewport;
