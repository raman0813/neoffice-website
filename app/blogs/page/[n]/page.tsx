import BlogIndex, { PER_PAGE } from "../../BlogIndex";
import { allPosts } from "@/lib/content";
export const dynamicParams = false;
export function generateStaticParams() {
  const pages = Math.ceil(allPosts().length / PER_PAGE);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}
export const metadata = { title: "Blogs | NeOffice" };
export default async function P({ params }: { params: Promise<{ n: string }> }) { const { n } = await params; return <BlogIndex page={Number(n)} />; }
