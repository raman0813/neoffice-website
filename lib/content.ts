import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import matter from "gray-matter";
import { marked } from "marked";

const CONTENT = path.join(process.cwd(), "content");

export type Css = Record<string, Partial<Record<"d" | "t" | "m" | "dd" | "to", string>>>;
export type Node = { type: string; id: string; css?: Css; [k: string]: any };
export type Page = { title: string; description?: string; url: string; sections: Node[] };

function walkFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkFiles(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

let pageCache: Map<string, Page> | null = null;
export function allPages(): Map<string, Page> {
  if (pageCache && process.env.NODE_ENV === "production") return pageCache;
  const m = new Map<string, Page>();
  for (const f of walkFiles(path.join(CONTENT, "pages"), ".yml")) {
    const p = yaml.load(fs.readFileSync(f, "utf8")) as Page;
    const rel = path.relative(path.join(CONTENT, "pages"), f).replace(/\.yml$/, "");
    p.url = rel === "index" ? "/" : `/${rel}/`;
    m.set(p.url, p);
  }
  pageCache = m;
  return m;
}
export const getPage = (url: string) => allPages().get(url);

export type Post = {
  slug: string; title: string; date: string; image?: string; description?: string; seoTitle?: string;
  categories: string[]; tags: string[]; author?: string; draft?: boolean; html: string; excerpt: string;
};
let postCache: Post[] | null = null;
export function allPosts(): Post[] {
  if (postCache && process.env.NODE_ENV === "production") return postCache;
  const posts = walkFiles(path.join(CONTENT, "blog"), ".md").map((f) => {
    const { data, content } = matter(fs.readFileSync(f, "utf8"));
    const html = marked.parse(content, { async: false }) as string;
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
    return {
      slug: path.basename(f, ".md"), categories: [], tags: [], ...data, date, html,
      excerpt: data.description || text.slice(0, 160).replace(/\s\S*$/, "") + "…",
    } as unknown as Post;
  });
  const today = new Date().toISOString().slice(0, 10);
  postCache = posts.filter((p) => !p.draft && p.date <= today).sort((a, b) => (a.date < b.date ? 1 : -1));
  return postCache;
}
export const getPost = (slug: string) => allPosts().find((p) => p.slug === slug);

export type NavLink = { label: string; href: string; children?: NavLink[] };
export type Site = {
  name: string; signInUrl: string; demoUrl: string; calendlyUrl: string; company: string;
  phones: string[]; email: string; address: string; mapUrl: string; isoText: string;
  nav: NavLink[]; footer: { title: string; links: NavLink[] }[];
  social: { label: string; icon: string; href: string }[];
  apps: { android: string; ios: string };
  cookie: { title: string; text: string };
  formEndpoint?: string;
};
export function site(): Site {
  return yaml.load(fs.readFileSync(path.join(CONTENT, "settings/site.yml"), "utf8")) as Site;
}

export function formatDate(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
