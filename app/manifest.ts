import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} — Photobooth Online`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "id-ID",
    dir: "ltr",
    start_url: "/studio",
    scope: "/",
    display: "standalone",
    background_color: "#fdf8ff",
    theme_color: "#fdf8ff",
    categories: ["photo", "entertainment", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Mulai foto",
        short_name: "Studio",
        description: "Buka studio photobooth dan mulai sesi 4 foto.",
        url: "/studio",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
