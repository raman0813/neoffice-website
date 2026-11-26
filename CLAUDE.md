# NeOffice website: notes for Claude

The site is Next.js (App Router, `trailingSlash: true`), built statically and hosted on Vercel.
Raman (the owner) is not technical. Explain things in plain language, never ask for passwords.

## Where things live
- `content/pages/**.yml`: every marketing page, converted 1:1 from the old WordPress/Elementor site.
  The file path is the URL (`content/pages/workspace/office-pass.yml` = `/workspace/office-pass/`, `index.yml` = `/`).
  Each section/column/widget has `id` and `css` (desktop `d`, tablet `t`, mobile `m`, desktop-only `dd`, tablet-only `to`).
  To change wording, edit `text`/`html`/`title` fields only. Keep `id` unique if you add a widget (any short new id).
- `content/blog/<slug>.md`: blog posts, served at `/<slug>/` (same URLs as WordPress). Front matter: title, date,
  image, description, categories, tags, author, optional `draft: true`. Posts dated in the future are hidden until a
  rebuild on/after that date.
- `content/settings/contact.yml` (contacts, links, cookie text) and `content/settings/site.yml` (menus, footer).
- `content/calendar.yml`: the content calendar. `content/writing-guide.md`: house style for posts.
- `components/Elementor.tsx` renders the page YAML. `scripts/import/` holds the one-off WordPress importer.
- `.pages.yml`: config for the Pages CMS visual editor (app.pagescms.org).

## Drafting scheduled posts (the scheduled task does this)
1. Read `content/calendar.yml` and `content/writing-guide.md`.
2. Pick entries with `status: planned` and `date` on or before today (in Asia/Kolkata). If none, stop and do nothing.
3. Skip any entry whose topic already has an open pull request (search open PRs titled "Blog draft:").
4. For each (at most 2 per run): write `content/blog/<short-keyword-slug>.md` following the guide. Use `date:` = the
   calendar date, a cover `image:` chosen from existing files in `public/wp-content/uploads/` that fits the topic
   (check the file exists), `categories:` from existing posts, and `author: NeOffice Team`. Never invent customers,
   quotes or statistics.
5. Set that calendar entry's `status: drafted`. Run `npm run build` to be sure it builds.
6. Create branch `blog/<slug>`, commit, push, and open a PR titled `Blog draft: <title>`. In the PR body, in plain
   language: what the post covers, and "To publish: click Merge pull request. To ask for changes: comment on this page."
7. When a `Blog draft:` PR is merged, the post goes live automatically (Vercel deploys `main`). After merge, the next run
   should set the calendar entry's status to `published` (on main, small commit).

## Rules
- Don't touch `css`/`id` values unless asked to change layout.
- Keep old URLs working. If a page or post moves, add a redirect in `next.config.ts`.
- `npm run build` must pass before pushing.
