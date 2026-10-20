import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Galeri",
  description:
    "Lihat dan unduh ulang strip photobooth yang tersimpan sementara di browser ini.",
  path: "/gallery",
  noIndex: true,
});

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return children;
}
