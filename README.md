# NeOffice website

The neoffice.ai website, rebuilt from WordPress so it's fast, secure, and easy to keep fresh.
Same pages, same words, same layout as the old site, with the obvious errors fixed.

## How to do the everyday things

**Plan blog posts (your content calendar)**
1. Go to https://app.pagescms.org and sign in with GitHub.
2. Open **neoffice-website**, then **Content calendar**.
3. Click **Add an entry**: pick a date, type the topic (and any notes), leave status as *planned*. Save.

Every morning Claude checks the calendar. On a post's date it writes a draft and sends it to you as a
GitHub "pull request" (you'll get an email). Read it on the preview link in that email.
- Happy with it? Click **Merge pull request**. It's live a minute later.
- Want changes? Leave a comment on that page, or edit the post in Pages CMS.

**Write or edit a post yourself**
Pages CMS > **Blog posts** > open a post (or **Add an entry**). Type like in Word. Click **Save**: it's live in about a minute.
Tick *Hide this post* to keep it as a draft.

**Change a phone number, email or the Sign in link**
Pages CMS > **Contact details and menus**. Save, and it updates on every page.

**Change wording on a page (home, pricing, product pages)**
Ask Claude in your NeOffice project, for example: "Change the pricing page headline to ...". Claude makes the change
and sends it for your approval. (Page layouts are detailed, so this is safer than editing them by hand.)

**Change how Claude writes posts**
Edit `content/writing-guide.md` (or ask Claude to).

## Where the website runs
The site is hosted on Vercel. Every change saved to this repository goes live automatically, and every
suggested change (pull request) gets its own preview link first.

## Form submissions
The demo and contact forms send each enquiry to whatever is set in Vercel > Project > Settings >
Environment Variables:
- `FORM_WEBHOOK_URL`: a webhook from Zapier, Make, HubSpot or similar, **or**
- `RESEND_API_KEY` and `LEAD_EMAIL_TO`: emails each enquiry (via resend.com) to the addresses in `LEAD_EMAIL_TO`.

## For developers
`npm install`, `npm run dev` (http://localhost:3000), `npm run build`. Node 20.9+.
See `CLAUDE.md` for how content is organised.
