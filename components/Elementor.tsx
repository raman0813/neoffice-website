// Renders page layouts imported from Elementor (content/pages/*.yml).
// Each node carries its own CSS (desktop / tablet / mobile), collected into one <style> tag.
import type { Css, Node } from "@/lib/content";
import { allPosts, formatDate } from "@/lib/content";
import LeadForm from "./LeadForm";
import { Fragment, type ReactNode } from "react";

const MEDIA: Record<string, string | null> = {
  d: null, dd: "(min-width:1025px)", t: "(max-width:1024px)", to: "(min-width:768px) and (max-width:1024px)", m: "(max-width:767px)",
};
const ORDER = ["d", "dd", "t", "to", "m"] as const;

export function collectCss(nodes: Node[]): string {
  const buckets: Record<string, string[]> = { d: [], dd: [], t: [], to: [], m: [] };
  const visit = (n: Node) => {
    if (n.css) addCss(buckets, n.id, n.css);
    for (const k of ["columns", "items"]) (n[k] as Node[] | undefined)?.forEach(visit);
  };
  nodes.forEach(visit);
  return ORDER.map((bp) => {
    const rules = buckets[bp].join("");
    if (!rules) return "";
    return MEDIA[bp] ? `@media ${MEDIA[bp]}{${rules}}` : rules;
  }).join("");
}
function addCss(b: Record<string, string[]>, id: string, css: Css) {
  for (const [sel, bps] of Object.entries(css)) {
    const s = `.e-${id}${sel === "self" ? "" : sel}`;
    for (const bp of ORDER) if (bps[bp]) b[bp].push(`${s}{${bps[bp]}}`);
  }
}

export function Sections({ nodes }: { nodes: Node[] }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: collectCss(nodes) }} />
      {nodes.map((n) => <Element key={n.id} n={n} />)}
    </>
  );
}

function Element({ n }: { n: Node }): ReactNode {
  switch (n.type) {
    case "section":
      return (
        <section className={`el-section e-${n.id}`} id={n.anchor}>
          <div className="row">{(n.columns as Node[]).map((c) => <Element key={c.id} n={c} />)}</div>
        </section>
      );
    case "column":
      return (
        <div className={`el-column e-${n.id}`}>
          <div className="wrap">{(n.items as Node[]).map((c) => <Element key={c.id} n={c} />)}</div>
        </div>
      );
    case "container":
      return (
        <div className={`el-container e-${n.id}`}>
          <div className="inner">{(n.items as Node[]).map((c) => <Element key={c.id} n={c} />)}</div>
        </div>
      );
    default:
      return (
        <div className={`w w-${n.type} e-${n.id}`}>
          <div className="wc"><Widget n={n} /></div>
        </div>
      );
  }
}

function A({ href, children, className }: { href?: string; children: ReactNode; className?: string }) {
  if (!href) return <>{children}</>;
  const ext = /^https?:\/\//.test(href);
  return <a href={href} className={className} {...(ext ? { target: "_blank", rel: "noopener" } : {})}>{children}</a>;
}
export function Icon({ icon, className }: { icon?: string | { svg: string }; className?: string }) {
  if (!icon) return null;
  if (typeof icon === "object") return <img src={icon.svg} alt="" className={className} style={{ width: "1em", height: "1em" }} />;
  return <i className={`${icon} ${className || ""}`} aria-hidden="true" />;
}
const html = (s: string) => ({ __html: s });

function Widget({ n }: { n: Node }): ReactNode {
  switch (n.type) {
    case "heading": {
      const Tag = (["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div"].includes(n.tag) ? n.tag : "h2") as any;
      return <Tag className="w-el heading-title">{n.link ? <a href={n.link} dangerouslySetInnerHTML={html(n.text)} /> : <span dangerouslySetInnerHTML={html(n.text)} />}</Tag>;
    }
    case "text":
      return <div className="text-editor" dangerouslySetInnerHTML={html(n.html)} />;
    case "image":
      return <A href={n.link}><img className="w-el" src={n.src} alt={n.alt || ""} loading="lazy" /></A>;
    case "button":
      return (
        <a className={`w-el btn btn-${n.size || "sm"}`} href={n.link} {...(/^https?:/.test(n.link) ? { target: "_blank", rel: "noopener" } : {})}>
          {n.icon && n.iconAlign !== "right" && <Icon icon={n.icon} className="btn-icon" />}
          <span>{n.text}</span>
          {n.icon && n.iconAlign === "right" && <Icon icon={n.icon} className="btn-icon right" />}
        </a>
      );
    case "icon":
      return <A href={n.link}><span className="w-el icon"><Icon icon={n.icon} /></span></A>;
    case "icon-box": {
      const T = (n.tag || "h3") as any;
      return (
        <div className={`icon-box pos-${n.position}`}>
          {n.icon && <div className="ib-icon"><Icon icon={n.icon} /></div>}
          <div className="ib-content">
            {n.title && <T className="ib-title"><A href={n.link}><span dangerouslySetInnerHTML={html(n.title)} /></A></T>}
            {n.html && <p className="ib-desc" dangerouslySetInnerHTML={html(n.html)} />}
          </div>
        </div>
      );
    }
    case "icon-list":
      return (
        <ul className={`icon-list${n.inline ? " inline" : ""}`}>
          {(n.items as any[]).map((i, k) => (
            <li key={k}><A href={i.link}>{i.icon && <span className="il-icon"><Icon icon={i.icon} /></span>}<span dangerouslySetInnerHTML={html(i.text)} /></A></li>
          ))}
        </ul>
      );
    case "social":
      return (
        <div className="social">
          {(n.items as any[]).map((i, k) => <a key={k} href={i.link} target="_blank" rel="noopener" aria-label={String(i.icon).replace(/.*fa-/, "")}><Icon icon={i.icon} /></a>)}
        </div>
      );
    case "divider": return <hr />;
    case "spacer": return <div />;
    case "anchor": return <span id={n.anchor} />;
    case "accordion":
      return (
        <div className="accordion">
          {(n.items as any[]).map((i, k) => (
            <details key={k}><summary>{i.title}</summary><div dangerouslySetInnerHTML={html(i.html)} /></details>
          ))}
        </div>
      );
    case "form": return <LeadForm fields={n.fields} button={n.button} name={n.name} />;
    case "posts": return <PostCards count={n.count || 3} />;
    case "carousel":
      return <div className="carousel">{(n.images as any[]).map((im, k) => <img key={k} src={im.src} alt={im.alt} loading="lazy" />)}</div>;
    case "video": {
      const u: string = n.url || "";
      const yt = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
      if (yt) return <div className="video"><iframe src={`https://www.youtube.com/embed/${yt[1]}`} title="Video" allowFullScreen loading="lazy" /></div>;
      return u ? <video src={u} controls /> : null;
    }
    default: return null;
  }
}

export function PostCards({ count, posts }: { count: number; posts?: ReturnType<typeof allPosts> }) {
  const list = posts ?? allPosts().slice(0, count);
  return (
    <div className="post-cards">
      {list.map((p) => (
        <article key={p.slug} className="post-card">
          <a href={`/${p.slug}/`} className="thumb">{p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <span />}</a>
          <div className="body">
            <h4><a href={`/${p.slug}/`}>{p.title}</a></h4>
            <div className="meta">{formatDate(p.date)}</div>
            <p>{p.excerpt}</p>
            <a className="more" href={`/${p.slug}/`}>Learn More »</a>
          </div>
        </article>
      ))}
    </div>
  );
}
export { Fragment };
