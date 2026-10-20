import type { Metadata } from "next";
import {
  absoluteUrl,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "./site";

const defaultRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: `/${string}`;
  exactTitle?: boolean;
  noIndex?: boolean;
};

/**
 * Metadata halaman lengkap: canonical, Open Graph, Twitter Card, dan robots.
 * Judul halaman pendek otomatis memakai template "· RPLBox" dari root layout.
 */
export function createPageMetadata({
  title,
  description,
  path,
  exactTitle = false,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const socialTitle = exactTitle ? title : `${title} · ${SITE_NAME}`;
  const canonical = path === "/" ? "/" : path;

  return {
    title: exactTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [
        {
          url: absoluteUrl(OG_IMAGE.url),
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
          type: "image/png",
          alt: OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [
        {
          url: absoluteUrl(OG_IMAGE.url),
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
          type: "image/png",
          alt: OG_IMAGE.alt,
        },
      ],
    },
    robots: noIndex ? noIndexRobots : defaultRobots,
  };
}

export const homePageMetadata = createPageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  exactTitle: true,
});

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: absoluteUrl("/"),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "id-ID",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icons/icon-512.png"),
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "RPLBox Photobooth",
      url: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
      applicationCategory: "MultimediaApplication",
      applicationSubCategory: "Photobooth",
      operatingSystem: "Any",
      browserRequirements:
        "Memerlukan browser modern dengan JavaScript dan akses kamera.",
      isAccessibleForFree: true,
      inLanguage: "id-ID",
      image: absoluteUrl(OG_IMAGE.url),
      screenshot: absoluteUrl(OG_IMAGE.url),
      featureList: [
        "Ambil 4 foto per sesi",
        "15 pilihan frame photobooth",
        "6 warna frame",
        "Green screen / chroma key opsional",
        "Retake per foto",
        "Unduh strip PNG dan PDF",
        "Semua foto diproses di browser",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IDR",
        availability: "https://schema.org/InStock",
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
} as const;
