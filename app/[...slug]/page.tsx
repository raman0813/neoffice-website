import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPages, allPosts, getPage, getPost, formatDate, site } from "@/lib/content";
import { Sections, PostCards } from "@/components/Elementor";

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;

export function generateStaticParams() {
  const pages = [...allPages().keys()].filter((u) => u !== "/").map((u) => ({ slug: u.replace(/^\/|\/$/g, "").split("/") }));
  const posts = allPosts().map((p) => ({ slug: [p.slug] }));
  return [...pages, ...posts];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const url = `/${slug.join("/")}/`;
  const page = getPage(url);
  if (page) return { title: page.title, description: page.description, alternates: { canonical: url }, openGraph: { title: page.title, description: page.description, url } };
  const post = slug.length === 1 ? getPost(slug[0]) : undefined;
  if (!post) return {};
  return {
    title: post.seoTitle || `${post.title} | NeOffice`, description: post.description, alternates: { canonical: url },
    openGraph: { type: "article", title: post.title, description: post.description, url, images: post.image ? [post.image] : undefined, publishedTime: post.date },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const url = `/${slug.join("/")}/`;
  const page = getPage(url);
  if (page) return <Sections nodes={page.sections} />;
  const post = slug.length === 1 ? getPost(slug[0]) : undefined;
  if (!post) notFound();
  const s = site();
  const related = allPosts().filter((p) => p.slug !== post.slug && p.categories.some((c) => post.categories.includes(c))).slice(0, 3);
  const share = encodeURIComponent(`https://neoffice.ai${url}`);
  return (
    <article className="post">
      <div className="post-inner">
        <a className="back" href="/blogs/"><i className="fas fa-arrow-left" /> Back</a>
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>{formatDate(post.date)}</span>
          <span className="share">
            {s.social.slice(0, 3).map((x) => <a key={x.label} href={x.href} target="_blank" rel="noopener">{x.label}</a>)}
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${share}`} target="_blank" rel="noopener">Share</a>
          </span>
        </div>
        {post.image && <img className="cover" src={post.image} alt={post.title} />}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        <div className="post-cta">
          <h3>See how NeOffice can help your workplace</h3>
          <a className="btn-red" href={s.demoUrl}>Book a Demo</a>
        </div>
        {related.length > 0 && (<><h3 className="related-h">Related posts</h3><PostCards count={3} posts={related} /></>)}
      </div>
    </article>
  );
}
