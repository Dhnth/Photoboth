import { Suspense } from "react";
import { AppNav } from "@/components/AppNav";
import { TEMPLATES } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";
import StudioClient from "./StudioClient";

export const metadata = createPageMetadata({
  title: "Studio Photobooth",
  description:
    "Ambil 4 foto di studio photobooth RPLBox. Pilih dari 15 frame, atur timer, aktifkan green screen opsional, lalu simpan strip PNG atau PDF.",
  path: "/studio",
});

type StudioSearchParams = Promise<{ frame?: string | string[] }>;

export default function StudioPage({
  searchParams,
}: {
  searchParams: StudioSearchParams;
}) {
  return (
    <Suspense fallback={<StudioFallback />}>
      <StudioRoute searchParams={searchParams} />
    </Suspense>
  );
}

async function StudioRoute({
  searchParams,
}: {
  searchParams: StudioSearchParams;
}) {
  const params = await searchParams;
  const initialFrame =
    typeof params.frame === "string" &&
    TEMPLATES.some((template) => template.id === params.frame)
      ? params.frame
      : undefined;

  return (
    <StudioClient key={initialFrame ?? "default"} initialFrame={initialFrame} />
  );
}

function StudioFallback() {
  return (
    <>
      <AppNav />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div
          role="status"
          className="rounded-2xl border-2 border-on-surface bg-surface-lowest px-6 py-5 text-center hard-shadow"
        >
          <span
            className="material-symbols-outlined is-filled text-primary"
            aria-hidden
          >
            photo_camera
          </span>
          <p className="font-display mt-1 text-lg font-extrabold">
            Menyiapkan studio…
          </p>
          <p className="mt-1 text-sm font-medium text-on-surface-muted">
            Sebentar, frame dan kamera lagi disiapkan.
          </p>
        </div>
      </main>
    </>
  );
}
