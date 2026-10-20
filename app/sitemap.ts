import type { MetadataRoute } from "next";
import { absoluteUrl, OG_IMAGE, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
      images: [absoluteUrl(OG_IMAGE.url)],
    },
    {
      url: absoluteUrl("/studio"),
      changeFrequency: "monthly",
      priority: 0.9,
      images: [absoluteUrl(OG_IMAGE.url)],
    },
  ];
}
