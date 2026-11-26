import type { Metadata } from "next";
import { getPage } from "@/lib/content";
import { Sections } from "@/components/Elementor";

export function generateMetadata(): Metadata {
  const p = getPage("/")!;
  return { title: p.title, description: p.description, alternates: { canonical: "/" }, openGraph: { title: p.title, description: p.description, url: "/" } };
}
export default function Home() {
  return <Sections nodes={getPage("/")!.sections} />;
}
