// One-off importer: turns the WordPress/Elementor export (parsed to all.json)
// into content files: content/pages/**.yml and content/blog/*.md.
// Usage: node scripts/import/convert-elementor.mjs <all.json>
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import TurndownService from "turndown";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const all = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const byId = new Map(all.map((d) => [d.id, d]));
const images = new Set();

// ---------- text fixes (clear typos and wrong contact details) ----------
const FIXES = [
  [/availablity/g, "availability"], [/Andriod/g, "Android"], [/Cafetaria/g, "Cafeteria"],
  [/GDPR complaint/g, "GDPR compliant"], [/\ba ISO 27001/g, "an ISO 27001"],
  [/we be in touch/g, "we will be in touch"], [/free feel to/gi, "feel free to"],
  [/Hibernte/g, "Hibernate"], [/Creterion/g, "Criteria"], [/provideh/g, "provide"], [/\bhTo\b/g, "To"],
  [/Occupany/g, "Occupancy"], [/transportion/g, "transportation"],
  [/hello@neofficesoftware\.com/g, "sales@neoffice.ai"],
  [/https?:\/\/(www\.)?neofficesoftware\.com\/?/g, "https://neoffice.ai/"],
  [/(www\.)?neofficesoftware\.com/g, "neoffice.ai"],
  [/\+91[\s-]?80[\s-]?4680[\s-]?5757/g, "+91 93 5377 6558"],
  [/http:\/\/8046805757/g, "tel:+919353776558"],
  [/\bAll Right Reserved/g, "All Rights Reserved"],
];
const fix = (s) => (typeof s === "string" ? FIXES.reduce((t, [a, b]) => t.replace(a, b), s) : s);

// ---------- links and images ----------
const LINK_MAP = {
  "/products/desk-booking-software/": "/workspace/desk-booking-software/",
  "/products/meeting-room-booking-software/": "/workspace/meeting-room-booking-software/",
  "/products/visitor-management-system/": "/workspace/visitor-management-system/",
  "/resources/about-us/": "/about-us/", "/resources/contact-us/": "/contact-us/",
  "/resources/privacy-policy/": "/privacy-policy/", "/resources/terms-conditions/": "/terms-conditions/",
  "/resources/gdpr/": "/gdpr/", "/schedule-demo": "/schedule-demo/",
};
function localUrl(u) {
  if (!u || typeof u !== "string") return u;
  u = u.trim();
  const m = u.match(/^https?:\/\/(www\.)?neoffice\.ai(\/.*)?$/);
  if (m) {
    let p = m[2] || "/";
    if (p.startsWith("/wp-content/uploads/")) { images.add(p.split(/[?#]/)[0]); return p; }
    const [base, hash] = p.split("#");
    let b = base; if (!b.endsWith("/") && !/\.[a-z0-9]+$/i.test(b)) b += "/";
    b = LINK_MAP[b] || LINK_MAP[base] || b;
    return hash !== undefined ? `${b}#${hash}` : b;
  }
  return u;
}
function fixHtml(html) {
  if (!html) return "";
  html = fix(html);
  html = html.replace(/(href|src)="([^"]*)"/g, (_, a, u) => `${a}="${localUrl(u)}"`);
  html = html.replace(/\s(srcset|sizes)="[^"]*"/g, "");
  html = html.replace(/<span data-metadata[^>]*><\/span>/g, "").replace(/<span data-metadata=?>([\s\S]*?)<\/span>/g, "$1");
  return html.trim();
}

// ---------- style helpers ----------
const has = (v) => v !== undefined && v !== null && v !== "";
function dims(v) {
  if (!v || typeof v !== "object") return null;
  const u = v.unit || "px"; const s = ["top", "right", "bottom", "left"].map((k) => v[k]);
  if (s.every((x) => !has(x))) return null;
  return s.map((x) => (has(x) ? `${x}${x == 0 ? "" : u}` : "0")).join(" ");
}
function size(v) { return v && typeof v === "object" && has(v.size) ? `${v.size}${v.unit || "px"}` : null; }
const BPS = { "": "d", _tablet: "t", _mobile: "m" };
function css() { return { d: [], t: [], m: [], dd: [], to: [] }; }
function put(c, bp, prop, val) { if (has(val)) c[bp].push(`${prop}:${val}`); }
function each(s, key, fn) { for (const [suf, bp] of Object.entries(BPS)) { const v = s[key + suf]; if (has(v)) fn(bp, v); } }
function typo(c, s, p = "typography_") {
  if (s[p + "typography"] !== "custom" && !s[p + "font_family"] && !s[p + "font_size"]) return;
  if (s[p + "font_family"]) put(c, "d", "font-family", `'${s[p + "font_family"]}',sans-serif`);
  each(s, p + "font_size", (bp, v) => put(c, bp, "font-size", size(v)));
  each(s, p + "font_weight", (bp, v) => put(c, bp, "font-weight", v));
  each(s, p + "line_height", (bp, v) => put(c, bp, "line-height", size(v)?.replace(/em$/, "em")));
  each(s, p + "letter_spacing", (bp, v) => put(c, bp, "letter-spacing", size(v)));
  each(s, p + "text_transform", (bp, v) => put(c, bp, "text-transform", v));
  each(s, p + "font_style", (bp, v) => put(c, bp, "font-style", v));
  each(s, p + "text_decoration", (bp, v) => put(c, bp, "text-decoration", v));
}
function bg(c, s, p = "background_") {
  const t = s[p + "background"];
  if (t === "classic") {
    each(s, p + "color", (bp, v) => put(c, bp, "background-color", v));
    each(s, p + "image", (bp, v) => { if (v?.url) put(c, bp, "background-image", `url(${localUrl(v.url)})`); });
    each(s, p + "position", (bp, v) => put(c, bp, "background-position", v === "initial" ? null : v));
    each(s, p + "size", (bp, v) => put(c, bp, "background-size", v === "initial" ? null : v));
    each(s, p + "repeat", (bp, v) => put(c, bp, "background-repeat", v));
  } else if (t === "gradient") {
    const a = s[p + "color"] || "transparent", b = s[p + "color_b"] || "#f2295b";
    const ang = s[p + "gradient_angle"]?.size ?? 180;
    put(c, "d", "background-image", `linear-gradient(${ang}deg, ${a} ${s[p + "color_stop"]?.size ?? 0}%, ${b} ${s[p + "color_b_stop"]?.size ?? 100}%)`);
  }
}
function border(c, s, p = "") {
  if (s[p + "border_border"] && s[p + "border_border"] !== "none") {
    put(c, "d", "border-style", s[p + "border_border"]);
    each(s, p + "border_width", (bp, v) => put(c, bp, "border-width", dims(v)));
    put(c, "d", "border-color", s[p + "border_color"]);
  }
  each(s, p + "border_radius", (bp, v) => put(c, bp, "border-radius", dims(v)));
  const sh = s[p + "box_shadow_box_shadow"];
  if (s[p + "box_shadow_box_shadow_type"] === "yes" && sh) put(c, "d", "box-shadow", `${sh.horizontal}px ${sh.vertical}px ${sh.blur}px ${sh.spread}px ${sh.color}`);
}
function hide(c, s) {
  if (s.hide_desktop) c.dd.push("display:none"); if (s.hide_tablet) c.to.push("display:none"); if (s.hide_mobile) c.m.push("display:none");
}
function pack(map) {
  // map: { selectorSuffix: css() } -> compact object, dropping empty breakpoints
  const out = {};
  for (const [sel, c] of Object.entries(map)) {
    const o = {}; for (const [bp, arr] of Object.entries(c)) if (arr.length) o[bp] = arr.join(";");
    if (Object.keys(o).length) out[sel || "self"] = o;
  }
  return Object.keys(out).length ? out : undefined;
}
const ALIGN = { left: "flex-start", center: "center", right: "flex-end", justify: "stretch", top: "flex-start", middle: "center", bottom: "flex-end", start: "flex-start", end: "flex-end" };

// ---------- popups / dynamic links ----------
function linkOf(s, key = "link") {
  const dyn = s.__dynamic__?.[key];
  if (dyn && /name="popup"/.test(dyn)) return "/schedule-demo/";
  const u = s[key]?.url;
  if (!has(u)) return undefined;
  return localUrl(fix(u));
}
const iconOf = (ic) => {
  if (!ic || !ic.value) return undefined;
  if (ic.library === "svg") return { svg: localUrl(ic.value.url) };
  return ic.value; // font awesome class, e.g. "fas fa-arrow-right"
};
function imageOf(img) {
  if (!img?.url) return undefined;
  const att = byId.get(String(img.id));
  return { src: localUrl(img.url), alt: fix(img.alt || att?.meta?._wp_attachment_image_alt || "") };
}

// ---------- widgets ----------
function widgetCommon(s, c, box) {
  each(s, "_margin", (bp, v) => put(box, bp, "margin", dims(v)));
  each(s, "_padding", (bp, v) => put(box, bp, "padding", dims(v)));
  each(s, "_element_width", (bp, v) => {
    if (v === "auto") put(c, bp, "width", "auto");
    else if (v === "initial") put(c, bp, "width", size(s["_element_custom_width" + Object.keys(BPS).find((k) => BPS[k] === bp)]) || "auto");
  });
  bg(box, s, "_background_"); border(box, s, "_"); hide(c, s);
  if (s._position === "absolute" || s._position === "fixed") {
    put(c, "d", "position", "absolute");
    each(s, "_offset_x", (bp, v) => put(c, bp, s._offset_orientation_h === "end" ? "right" : "left", size(v)));
    each(s, "_offset_y", (bp, v) => put(c, bp, s._offset_orientation_v === "end" ? "bottom" : "top", size(v)));
  }
  if (has(s._z_index)) put(c, "d", "z-index", s._z_index);
  each(s, "_flex_size", (bp, v) => put(c, bp, "flex", v === "grow" ? "1 1 0" : v === "shrink" ? "0 1 auto" : "0 0 auto"));
}
function widget(n) {
  const s = Array.isArray(n.settings) ? {} : n.settings || {};
  const t = n.widgetType; const self = css(); const inner = css(); const box = css(); const extra = {};
  widgetCommon(s, self, box);
  let w;
  switch (t) {
    case "heading": {
      each(s, "align", (bp, v) => put(self, bp, "text-align", v));
      put(inner, "d", "color", s.title_color); typo(inner, s);
      w = { type: "heading", tag: s.header_size || "h2", text: fixHtml(s.title || "").replace(/\n+$/, ""), link: linkOf(s) };
      break;
    }
    case "text-editor": {
      each(s, "align", (bp, v) => put(self, bp, "text-align", v));
      put(self, "d", "color", s.text_color); typo(self, s);
      w = { type: "text", html: fixHtml(s.editor || "") };
      break;
    }
    case "image": {
      each(s, "align", (bp, v) => put(self, bp, "text-align", v));
      each(s, "width", (bp, v) => put(inner, bp, "width", size(v)));
      each(s, "space", (bp, v) => put(inner, bp, "max-width", size(v)));
      each(s, "height", (bp, v) => put(inner, bp, "height", size(v)));
      if (s["object-fit"]) put(inner, "d", "object-fit", s["object-fit"]);
      each(s, "image_border_radius", (bp, v) => put(inner, bp, "border-radius", dims(v)));
      if (s.image_box_shadow_box_shadow_type === "yes" && s.image_box_shadow_box_shadow) { const sh = s.image_box_shadow_box_shadow; put(inner, "d", "box-shadow", `${sh.horizontal}px ${sh.vertical}px ${sh.blur}px ${sh.spread}px ${sh.color}`); }
      const im = imageOf(s.image);
      if (!im) return null;
      w = { type: "image", ...im, link: s.link_to === "custom" ? linkOf(s) : undefined };
      break;
    }
    case "button": {
      const a = s.align; each(s, "align", (bp, v) => put(self, bp, "text-align", v === "justify" ? "center" : v));
      if (a === "justify") put(inner, "d", "width", "100%");
      put(inner, "d", "background-color", s.background_color); put(inner, "d", "color", s.button_text_color);
      typo(inner, s); border(inner, s); each(s, "text_padding", (bp, v) => put(inner, bp, "padding", dims(v)));
      const hov = css(); put(hov, "d", "background-color", s.button_background_hover_color); put(hov, "d", "color", s.hover_color); put(hov, "d", "border-color", s.button_hover_border_color);
      extra[":hover a"] = hov;
      w = { type: "button", text: fix(s.text || "Click here"), link: linkOf(s) || "/schedule-demo/", size: s.size || "sm", icon: iconOf(s.selected_icon), iconAlign: s.icon_align === "right" ? "right" : undefined };
      break;
    }
    case "icon": {
      each(s, "align", (bp, v) => put(self, bp, "text-align", v));
      put(inner, "d", "color", s.primary_color); each(s, "size", (bp, v) => put(inner, bp, "font-size", size(v)));
      w = { type: "icon", icon: iconOf(s.selected_icon), link: linkOf(s) };
      break;
    }
    case "icon-box": {
      each(s, "text_align", (bp, v) => put(self, bp, "text-align", v));
      const ic = css(); put(ic, "d", "color", s.primary_color); each(s, "icon_size", (bp, v) => put(ic, bp, "font-size", size(v)));
      const ti = css(); put(ti, "d", "color", s.title_color); typo(ti, s, "title_typography_");
      const de = css(); put(de, "d", "color", s.description_color); typo(de, s, "description_typography_");
      extra[" .ib-icon"] = ic; extra[" .ib-title"] = ti; extra[" .ib-desc"] = de;
      w = { type: "icon-box", icon: iconOf(s.selected_icon), title: fixHtml(s.title_text || ""), html: fixHtml(s.description_text || ""), tag: s.title_size || "h3", position: s.position || "top", link: linkOf(s) };
      break;
    }
    case "icon-list": {
      const tx = css(); put(tx, "d", "color", s.text_color); typo(tx, s, "icon_typography_");
      const ic = css(); put(ic, "d", "color", s.icon_color); each(s, "icon_size", (bp, v) => put(ic, bp, "font-size", size(v)));
      extra[" li"] = tx; extra[" .il-icon"] = ic;
      w = { type: "icon-list", inline: s.view === "inline" || undefined, items: (s.icon_list || []).map((i) => ({ text: fixHtml(i.text || ""), icon: iconOf(i.selected_icon), link: linkOf(i) })) };
      break;
    }
    case "social-icons":
      w = { type: "social", items: (s.social_icon_list || []).map((i) => ({ icon: iconOf(i.social_icon), link: linkOf(i) })) };
      break;
    case "divider": {
      const ln = css(); put(ln, "d", "border-top", `${s.weight?.size ?? 1}px ${s.style || "solid"} ${s.color || "#ddd"}`); put(ln, "d", "width", size(s.width) || "100%");
      extra[" hr"] = ln; w = { type: "divider" }; break;
    }
    case "spacer": put(self, "d", "height", size(s.space) || "50px"); each(s, "space", (bp, v) => put(self, bp, "height", size(v))); w = { type: "spacer" }; break;
    case "accordion": case "toggle":
      w = { type: "accordion", items: (s.tabs || []).map((i) => ({ title: fix(i.tab_title || ""), html: fixHtml(i.tab_content || "") })) }; break;
    case "form":
      w = { type: "form", name: s.form_name, button: fix(s.button_text || "Send"), fields: (s.form_fields || []).map((f) => ({ name: f.custom_id || f._id, type: f.field_type || "text", label: fix(f.field_label || ""), placeholder: fix(f.placeholder || ""), required: f.required === "true" || undefined, options: f.field_options ? fix(f.field_options).split("\n").map((x) => x.split("|")[0].trim()).filter(Boolean) : undefined, width: f.width })) };
      break;
    case "posts": w = { type: "posts", count: s.classic_posts_per_page || s.cards_posts_per_page || s.posts_per_page || 3 }; break;
    case "image-carousel": w = { type: "carousel", images: (s.carousel || []).map(imageOf).filter(Boolean), perView: Number(s.slides_to_show) || undefined }; break;
    case "video": w = { type: "video", url: s.youtube_url || s.vimeo_url || s.external_url?.url || (s.hosted_url?.url && localUrl(s.hosted_url.url)) }; break;
    case "menu-anchor": w = { type: "anchor", anchor: s.anchor }; break;
    default: return null; // post-info, table-of-contents, shortcode: not used on pages
  }
  for (const k of Object.keys(w)) if (w[k] === undefined) delete w[k];
  const styles = pack({ "": self, " > .wc": box, " .w-el": inner, ...extra });
  return { ...w, id: n.id, ...(styles ? { css: styles } : {}) };
}

// ---------- layout ----------
const GAPS = { no: 0, narrow: 5, default: 10, extended: 15, wide: 20, wider: 30 };
function section(n) {
  const s = Array.isArray(n.settings) ? {} : n.settings || {};
  const self = css(); const row = css();
  bg(self, s); border(self, s); hide(self, s);
  each(s, "padding", (bp, v) => put(self, bp, "padding", dims(v)));
  each(s, "margin", (bp, v) => put(self, bp, "margin", dims(v)?.replace(/^(\S+) \S+ (\S+) \S+$/, "$1 0 $2 0")));
  if (s.height === "min-height" || s.height === "full") {
    put(row, "d", "min-height", s.height === "full" ? "100vh" : size(s.custom_height) || "400px");
    each(s, "custom_height", (bp, v) => bp !== "d" && put(row, bp, "min-height", size(v)));
  }
  const cp = s.content_position; if (cp && ALIGN[cp]) put(row, "d", "align-items", ALIGN[cp]);
  if (s.layout !== "full_width") put(row, "d", "max-width", size(s.content_width) || "1140px");
  if (s.reverse_order_mobile) put(row, "m", "flex-direction", "column-reverse");
  if (has(s.z_index)) put(self, "d", "z-index", s.z_index);
  const gap = s.gap === "custom" ? s.gap_columns_custom?.size ?? 10 : GAPS[s.gap || "default"];
  const cols = (n.elements || []).map((c) => column(c, gap)).filter(Boolean);
  const styles = pack({ "": self, " > .row": row });
  return { type: "section", id: n.id, ...(s.css_id ? { anchor: s.css_id } : {}), ...(styles ? { css: styles } : {}), columns: cols };
}
function column(n, gap) {
  const s = Array.isArray(n.settings) ? {} : n.settings || {};
  const self = css(); const wrap = css();
  const wd = s._inline_size ?? s._column_size ?? 100;
  put(self, "d", "width", `${+(+wd).toFixed(3)}%`);
  if (has(s._inline_size_tablet)) put(self, "t", "width", `${s._inline_size_tablet}%`);
  put(self, "m", "width", has(s._inline_size_mobile) ? `${s._inline_size_mobile}%` : "100%");
  put(wrap, "d", "padding", `${gap}px`);
  each(s, "padding", (bp, v) => put(wrap, bp, "padding", dims(v)));
  each(s, "margin", (bp, v) => put(wrap, bp, "margin", dims(v)));
  bg(wrap, s); border(wrap, s); hide(self, s);
  each(s, "content_position", (bp, v) => ALIGN[v] && put(wrap, bp, "align-content", ALIGN[v]));
  each(s, "align", (bp, v) => ALIGN[v] && put(wrap, bp, "justify-content", ALIGN[v] === "stretch" ? "space-between" : ALIGN[v]));
  each(s, "space_between_widgets", (bp, v) => put(wrap, bp, "--gap", `${v.size ?? v}px`));
  const items = (n.elements || []).map(child).filter(Boolean);
  const styles = pack({ "": self, " > .wrap": wrap });
  return { type: "column", id: n.id, ...(styles ? { css: styles } : {}), items };
}
function container(n) {
  const s = Array.isArray(n.settings) ? {} : n.settings || {};
  const self = css(); const inn = css();
  bg(self, s); border(self, s); hide(self, s);
  put(self, "d", "padding", "10px"); each(s, "padding", (bp, v) => put(self, bp, "padding", dims(v)));
  each(s, "margin", (bp, v) => put(self, bp, "margin", dims(v)));
  each(s, "width", (bp, v) => put(self, bp, "width", size(v)));
  each(s, "min_height", (bp, v) => put(self, bp, "min-height", size(v)));
  put(inn, "d", "flex-direction", s.flex_direction || "column");
  each(s, "flex_direction", (bp, v) => bp !== "d" && put(inn, bp, "flex-direction", v));
  each(s, "flex_gap", (bp, v) => put(inn, bp, "gap", has(v.size) ? `${v.size}${v.unit || "px"}` : has(v.column) ? `${v.row}px ${v.column}px` : null));
  each(s, "flex_justify_content", (bp, v) => put(inn, bp, "justify-content", v));
  each(s, "flex_align_items", (bp, v) => put(inn, bp, "align-items", v));
  if (s.flex_wrap) put(inn, "d", "flex-wrap", s.flex_wrap);
  if (s.content_width !== "full") put(inn, "d", "max-width", size(s.boxed_width) || "1140px");
  const styles = pack({ "": self, " > .inner": inn });
  return { type: "container", id: n.id, ...(styles ? { css: styles } : {}), items: (n.elements || []).map(child).filter(Boolean) };
}
function child(n) {
  if (n.elType === "section") return section(n);
  if (n.elType === "column") return column(n, 10);
  if (n.elType === "container") return container(n);
  if (n.elType === "widget") return widget(n);
  return null;
}

// ---------- write pages ----------
const SKIP = new Set(["/workspace/", "/solutions/", "/blogs/", "/elementor-11014/"]);
const pages = all.filter((d) => d.type === "page" && d.status === "publish");
const written = [];
for (const p of pages) {
  const url = localUrl(p.link);
  if (SKIP.has(url)) continue;
  const data = p.meta._elementor_data ? JSON.parse(p.meta._elementor_data) : [];
  const doc = {
    title: fix(p.meta._yoast_wpseo_title?.replace(/%%[a-z_]+%%/g, "").replace(/\s*[|-]\s*$/, "").trim() || p.title.trim()),
    description: fix(p.meta._yoast_wpseo_metadesc || ""),
    url,
    sections: data.map(child).filter(Boolean),
  };
  const file = url === "/" ? "index" : url.replace(/^\/|\/$/g, "");
  const out = path.join(ROOT, "content/pages", `${file}.yml`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, "# Page layout imported from WordPress/Elementor. Edit the text fields; leave 'id' and 'css' alone.\n" + yaml.dump(doc, { lineWidth: 120, noRefs: true }));
  written.push(url);
}

// ---------- blog posts -> markdown ----------
const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced" });
td.keep(["iframe"]);
const posts = all.filter((d) => d.type === "post" && d.status === "publish");
const slugs = [];
for (const p of posts) {
  const data = p.meta._elementor_data ? JSON.parse(p.meta._elementor_data) : [];
  const parts = []; let sawTitle = false; let skippedFirstImage = false;
  const thumb = byId.get(p.meta._thumbnail_id);
  const cover = thumb?.url ? localUrl(thumb.url) : undefined;
  const walk = (n) => {
    if (n.elType === "widget") {
      const s = Array.isArray(n.settings) ? {} : n.settings || {};
      if (n.widgetType === "heading") {
        const tag = s.header_size || "h2"; const text = fixHtml(s.title || "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").trim();
        if (tag === "h1" && !sawTitle) { sawTitle = true; return; }
        const lvl = { h1: 2, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 }[tag];
        parts.push(lvl ? `${"#".repeat(lvl)} ${text}` : `**${text}**`);
      } else if (n.widgetType === "text-editor") parts.push(td.turndown(fixHtml(s.editor || "")));
      else if (n.widgetType === "image" && s.image?.url) {
        const im = imageOf(s.image);
        if (!skippedFirstImage && (im.src === cover || parts.length === 0)) { skippedFirstImage = true; return; }
        parts.push(`![${im.alt}](${im.src})`);
      } else if (n.widgetType === "icon-list") parts.push((s.icon_list || []).map((i) => `- ${td.turndown(fixHtml(i.text || ""))}`).join("\n"));
      else if (n.widgetType === "accordion" || n.widgetType === "toggle") for (const t of s.tabs || []) parts.push(`### ${fix(t.tab_title)}\n\n${td.turndown(fixHtml(t.tab_content || ""))}`);
      return;
    }
    (n.elements || []).forEach(walk);
  };
  data.forEach(walk);
  if (!cover && !skippedFirstImage) { /* no cover */ }
  const cats = p.cats.filter(([d]) => d === "category").map(([, c]) => c);
  const tags = p.cats.filter(([d]) => d === "post_tag").map(([, c]) => c);
  const title = fix(p.title.replace(/[￼]/g, "").replace(/\s+/g, " ").trim());
  const fm = {
    title,
    date: p.date.slice(0, 10),
    ...(cover ? { image: cover } : {}),
    description: fix(p.meta._yoast_wpseo_metadesc || ""),
    ...(p.meta._yoast_wpseo_title && !/%%/.test(p.meta._yoast_wpseo_title) && p.meta._yoast_wpseo_title !== title ? { seoTitle: fix(p.meta._yoast_wpseo_title) } : {}),
    categories: cats, tags,
    author: "NeOffice Team",
  };
  const body = parts.join("\n\n").replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const slug = p.slug;
  fs.mkdirSync(path.join(ROOT, "content/blog"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "content/blog", `${slug}.md`), `---\n${yaml.dump(fm, { lineWidth: 200 })}---\n\n${body}\n`);
  slugs.push(slug);
}
fs.writeFileSync(path.join(ROOT, "scripts/import/image-list.txt"), [...images].sort().join("\n") + "\n");
console.log(`pages: ${written.length}, posts: ${slugs.length}, images: ${images.size}`);
console.log(written.join("\n"));
