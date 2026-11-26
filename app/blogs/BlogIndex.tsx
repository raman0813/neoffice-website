import { allPosts } from "@/lib/content";
import { PostCards } from "@/components/Elementor";
export const PER_PAGE = 9;
export default function BlogIndex({ page }: { page: number }) {
  const posts = allPosts();
  const pages = Math.ceil(posts.length / PER_PAGE);
  const list = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <div className="blog-index">
      <div className="blog-hero"><h1>Blogs</h1><p>More about the latest trends and what we have to offer</p></div>
      <div className="blog-list"><PostCards count={PER_PAGE} posts={list} /></div>
      <nav className="pager" aria-label="Blog pages">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <a key={n} href={n === 1 ? "/blogs/" : `/blogs/page/${n}/`} aria-current={n === page ? "page" : undefined}>{n}</a>
        ))}
      </nav>
    </div>
  );
}
