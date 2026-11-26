import type { MetadataRoute } from "next";
import { allPages, allPosts } from "@/lib/content";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://neoffice.ai";
  return [
    ...[...allPages().keys()].filter((u) => u !== "/thank-you/").map((u) => ({ url: base + u })),
    { url: base + "/blogs/" },
    ...allPosts().map((p) => ({ url: `${base}/${p.slug}/`, lastModified: p.date })),
  ];
}
