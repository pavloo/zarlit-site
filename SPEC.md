# Zarlit — Technical Specification

A public library of lesson materials for teachers of **Зарубіжна література** (World Literature) in
Ukrainian schools, organised by grade. Each lesson has a title, a description, and one or more
downloadable files.

**Site title**: Зарубіжна література в українській школі
**Domain**: `zarlit.com.ua` · **Files**: `files.zarlit.com.ua`

Status: v1.8, live; milestones 1–4 plus the desktop app · Language of the site: Ukrainian only

> Items marked **TODO** below are placeholders: they are wired into the code so nothing is
> blocked, and swapping in the real text is a one-line edit in `src/data/site.ts`.

---

## 1. Product summary

| | |
|---|---|
| **Audience** | World literature teachers in Ukraine |
| **Core value** | Find the materials for a given grade and lesson, download them, use them in class |
| **Primary navigation** | Home → Grade (5–11) → Lesson → Download |
| **Title / domain** | Зарубіжна література в українській школі · `zarlit.com.ua` |

### Site metadata (`src/data/site.ts`)

```ts
export const site = {
  title: "Зарубіжна література в українській школі",
  shortTitle: "Зарубіжна література",              // header / narrow screens
  description:                                     // TODO: replace placeholder
    "Матеріали до уроків зарубіжної літератури для 5–11 класів: " +
    "розробки уроків, презентації та роздаткові матеріали для вчителів.",
  url: "https://zarlit.com.ua",
  filesUrl: "https://files.zarlit.com.ua",
  email: "",                                       // TODO: contact address, or leave empty
} as const;
```

`description` feeds the home page intro, the default `<meta name="description">`, and the
Open Graph tags. The placeholder above is serviceable Ukrainian and safe to launch with.
| **Authoring** | Single admin (site owner). No public accounts, no submissions |
| **Access** | Fully public. No login, no paywall, no gating of downloads |

### Non-goals for v1

- No user accounts, comments, ratings, or forums
- No full-text search, tags, or filtering by author/work (grade browsing only)
- No payments or premium content
- No multi-language UI

These are deliberately excluded to keep v1 shippable; §9 notes what the design leaves room for.

---

## 2. Architecture at a glance

```
Author (local machine)                GitHub                        Visitors
──────────────────────                ──────                        ────────
 npm run admin
   ├─ upload file ──────────────────────────────────────► Cloudflare R2 (files)
   └─ write .md  ──► git push ──► GitHub Actions ──► GitHub Pages (HTML) ──► browser
                                  (content build                    │
                                   + vite build)                    └─ download link → R2
```

**The site is fully static.** There is no database, no API, and no server at runtime. Lesson
metadata lives in Markdown files in the repository; the heavy attachments (`.docx`, `.pptx`,
`.pdf`) live in object storage and are linked by URL. The build runs in two steps: a content
script compiles the Markdown into a validated JSON index, then Vite builds the React app and
**prerenders one real HTML file per lesson**.

### Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 19 + Vite 7**, TypeScript | Plain React app, no framework conventions to learn; one toolchain shared with the admin tool |
| Routing | **React Router** (declarative routes) | Standard, familiar; the route list doubles as the prerender manifest |
| Static output | React Router's own static handler (`scripts/prerender.ts`) | Renders every route to a real HTML file at build time — preserves SEO and link previews, which a plain SPA loses. No third-party SSG package: see the note below |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | Fast, consistent typography and spacing; prebuilt accessible components without designing from scratch |
| Content | Markdown + frontmatter → zod-validated JSON index (prebuild script) | Type-safe content, build-time errors on bad data, no database, no runtime Markdown parsing |
| File storage | **Cloudflare R2** (S3-compatible), public bucket | Zero egress fees — the deciding factor when the product *is* downloads |
| Hosting | **GitHub Pages**, public repo | Free, HTTPS and custom domain included, deploys from the same repo |
| CI/CD | GitHub Actions on push to `main` | Commit a lesson → site is live in ~1 minute |
| Analytics | **GoatCounter** (privacy-friendly) | No cookies → no cookie banner; tracks page views and download clicks |

### Why split hosting (GitHub) from files (Cloudflare)

GitHub Pages has a soft 1 GB repository limit and is not meant for binary assets; a few hundred
presentations would blow past it and make every clone slow. R2 holds the binaries with free egress,
so the repository stays small and text-only. One extra account is the price of that split.

### Why prerender instead of a plain SPA

A client-rendered SPA serves a single empty `index.html`. Three consequences matter here:
search engines index little or nothing; a lesson link pasted into a Telegram or Facebook
teachers' group shows no title or preview; and GitHub Pages returns a hard 404 on any deep
link unless you add a `404.html` redirect shim. Prerendering removes all three problems and
costs one dependency plus a route list. The app is otherwise ordinary React — the same
components hydrate and run client-side after load.

If discovery turns out to be purely word-of-mouth and none of that matters, dropping the
prerender step for a plain SPA build is a small, reversible change: the React code is
identical, only the build command and the 404 handling differ.

### Why a hand-written prerenderer

`vite-react-ssg`, the obvious off-the-shelf choice, peers on React Router 6 and has no
support for the version 7 this project uses. Rather than hold the router back a major
version for the sake of a build-time convenience, the prerenderer is ~150 lines in
`scripts/prerender.ts` built on `createStaticHandler` / `StaticRouterProvider`, which
React Router ships itself. It walks the same route table the browser uses, so the two
cannot drift.

---

## 3. Content model

Lessons are Markdown files under `content/lessons/<grade>/<slug>.md` — outside `src/`, since
they are data rather than code, and the admin tool writes them.

### Frontmatter schema

```yaml
---
title: "Гомер. «Одіссея». Образ Одіссея"       # required
description: "Матеріали до уроку: презентація…" # required, 1–300 chars, used for SEO + cards
grade: 6                                        # required, integer 5–11
order: 12                                       # required, position within the grade
topic: "Антична література"                     # optional, shown as a label
work: "Одіссея"                                 # optional, literary work studied
attachments:                                    # required, at least one
  - label: "Презентація"                        # human label shown on the button
    url: "https://files.zarlit.com.ua/6/odisseia-presentation.pptx"
    filename: "odisseia-presentation.pptx"
    size: 4718592                               # optional; bytes, for "4,5 МБ" in the UI
    type: "pptx"                                # pptx | docx | pdf | xlsx | zip | other
publishedAt: 2026-09-01                         # required, date
updatedAt: 2026-09-14                           # optional
draft: false                                    # optional, default false; drafts excluded from build
---

Optional Markdown body: extra notes, lesson outline, links. Rendered on the lesson page
below the description. May be empty.
```

### The content build step

`scripts/build-content.ts` runs before Vite, and in watch mode during `npm run dev`. It:

1. reads every `content/lessons/**/*.md` with `gray-matter`,
2. validates the frontmatter against a zod schema (`src/content/schema.ts`),
3. renders the Markdown body to HTML with `markdown-it`,
4. writes `src/generated/lessons.json`.

Beyond field validation it rejects three mistakes that a schema alone would not catch:
a lesson whose `grade` disagrees with the directory it sits in (a misfiled lesson), two
lessons sharing a `slug`, and two lessons in one grade sharing an `order` — which would
otherwise make list order silently arbitrary.

Two details worth knowing when hand-writing a lesson:

- **Sanitisation** is `markdown-it`'s `html: false`, which escapes raw HTML in the body
  rather than passing it through. Nothing a Markdown file contains can inject markup.
- **Dates** may be written quoted or unquoted. YAML turns an unquoted `2026-08-28` into a
  Date and a quoted one into a string; the schema accepts both and normalises to an ISO
  date string, so authors need not remember which.

The app imports that JSON, so no Markdown parser ships to the browser. A malformed lesson
**fails the build** rather than shipping broken — intentional, since there is no CMS to
validate at entry time.

### Ordering

`order` is an explicit integer, not the file name or upload date. Lessons are sorted by
`order` ascending, ties broken by `title`. This lets the grade page follow the school
programme sequence rather than the order lessons happened to be added. The admin tool (§5)
edits `order` by drag-and-drop and renumbers the affected files.

### Grades

Grades 5–11, seven sections. Grade metadata (display name, short blurb) lives in
`src/data/grades.ts` — a plain module, since it is a fixed list.

---

## 4. Site structure and pages

| Route | Page | Contents |
|---|---|---|
| `/` | Home | Short intro, grid of seven grade cards with lesson counts, latest additions |
| `/klas/:grade` | Grade index | Ordered list of lessons for that grade: title, description excerpt, attachment types |
| `/klas/:grade/:slug` | Lesson | Title, topic/work labels, full description, Markdown body, download buttons (one per attachment with label, type icon, size) |
| `/pro-sait` | About | Who runs the site, contact email. **TODO**: page exists with placeholder copy; fill in before launch, or drop the route and its header link |
| `*` | Not found | Links back to grade list; also emitted as `404.html` |
| `/sitemap.xml`, `/robots.txt` | Generated | Emitted by the prerender step from the same route list |

Every route above is enumerated at build time from `lessons.json` and prerendered to its own
`index.html`.

**URLs carry a trailing slash** (`/klas/6/`). Each page is a directory with an `index.html`,
and a static host serves that file for the slashed URL while 301-redirecting the bare one —
so linking to the slashed form means a full page load never pays for a redirect, and
canonical URLs never point at a redirecting address. React Router ignores trailing slashes
when matching, so client-side navigation is unaffected.

**Link previews** use `public/og.jpg` (1200×630), declared once in `index.html` since it is
the same for every page. It is generated from `scripts/assets/og.svg` by `npm run og`, which
uses macOS built-ins rather than adding an image dependency to the project.

**Structured data** (schema.org JSON-LD) is written into the prerendered HTML: `WebSite` on
the home page, `LearningResource` on each lesson — grade as `educationalLevel`, the work
studied as `about`, `isAccessibleForFree`, and a teacher audience. It is not maintained
during client-side navigation: crawlers read the HTML as delivered, and none of them click
through the app.

**Head tags** come from `getPageMeta(path)` in `src/lib/meta.ts` — one function mapping a
path to its title, description, canonical, and robots value. The prerenderer writes its
output into the static HTML; `DocumentMeta` applies it again on client-side navigation.
Because both read the same function, a page's tags cannot differ between the two. The tags
it rewrites are marked by `id` in `index.html`. This replaces the `react-helmet-async`
the spec originally called for: with one metadata function there is nothing left for a
head-management library to do.

Slugs are Latin-transliterated (`odisseia-obraz-odisseia`), lowercase, hyphenated — readable
URLs that survive copy-paste into messengers, which Cyrillic percent-encoding does not.

### UI notes

- Ukrainian throughout; `<html lang="uk">`.
- Mobile-first: teachers open these on phones. Download buttons are large tap targets.
- File type and size shown **before** the click — teachers on mobile data need to know.
- Typography tuned for reading: max ~70ch line length, generous line height.
- Light/dark handled by shadcn's token system, following system preference.

---

## 5. Authoring workflow — the local admin

A **separate local application**, never deployed, run with `npm run admin`. It exists because
hand-writing frontmatter and hand-uploading to a storage dashboard is tedious and error-prone.

- **Form fields**: grade, title, description, topic, work, attachments (drag-and-drop files),
  lesson body, draft toggle.
- **The body is edited visually**, not as raw Markdown: a TipTap editor with headings,
  bold, italic, lists, quotes and links, styled to match the lesson page's own typography.
  It still *stores* Markdown — every keystroke is serialised through `tiptap-markdown`, and
  a "Показати Markdown" toggle reveals exactly what will be written to the file, and lets
  it be edited directly. The editor is configured with `html: false`, matching the site's
  renderer: HTML in a lesson body would be escaped and shown as visible tags, so the editor
  must never produce any.

  One consequence worth knowing: opening a hand-written lesson in the editor re-flows its
  paragraphs onto single lines, since a soft wrap in Markdown is not a line break. The
  rendered page is identical; the diff is not.
- **On submit**: uploads each file to R2 under `<grade>/<slug>-<label>.<ext>`, reads back size
  and public URL, then writes `content/lessons/<grade>/<slug>.md` with complete frontmatter.
- **Reorder view**: lists lessons in a grade; drag, or use arrow buttons, and the new
  `order` values are written to the affected files immediately. Arrows exist alongside drag
  because they work by keyboard and on a touchpad, and the list is short.
- **Edit/delete**: edit an existing lesson's fields; delete asks, inline, whether to remove
  the storage objects as well as the record. That choice is made explicitly in the row
  rather than through a confirmation dialog, because it is the one action here that
  destroys something unrecoverable.
- The admin does **not** commit or push — you review `git diff` and push yourself. Deliberate:
  a git diff is the last safety net before the site is public.

**Implementation**: a React app under `admin/` with its own Vite config, sharing the
Tailwind theme and shadcn components with the site. The Express API is mounted into that
Vite dev server as middleware, so `npm run admin` is one process on one port with no proxy
to configure. It binds to `127.0.0.1`: a tool that writes files and deletes storage objects
should not be reachable from whatever network the laptop is on. It has no production build
target, and nothing in `src/` imports it, so it cannot reach the public site — the build
output contains none of its code or dependencies.

Talks to R2 via `@aws-sdk/client-s3` (R2 is S3-compatible), with credentials from a
gitignored `.env`. **Without credentials it still runs**: uploading is disabled and a file
URL is pasted instead, so the tool is usable before the bucket exists.

Slugs are generated server-side by transliterating the title with the official Ukrainian
table (Cabinet of Ministers resolution No. 55), so `Ґете. «Вільшаний король»` becomes
`gete-vilshanyi-korol`. A slug is **fixed once the lesson exists** — it is the page's URL,
and renaming it would break every link already shared — so the slug and grade are read-only
when editing. Frontmatter is written in a fixed key order, so generated files read like the
hand-written ones and later edits produce minimal diffs.

---

## 6. File storage (Cloudflare R2)

- One bucket, e.g. `zarlit-files`, **public read** — files are public content, and public reads
  keep the static site free of signing logic.
- Served from a custom subdomain, `files.zarlit.com.ua`, rather than the default `*.r2.dev`,
  so the URLs in committed Markdown stay stable if storage ever moves. This requires the
  domain's DNS to be managed by Cloudflare, which also covers the site records below.
- Key layout: `<grade>/<slug>-<label-slug>.<ext>` — human-browsable in the dashboard.
- Cache-Control: `public, max-age=31536000, immutable`. Filenames carry a content hash suffix
  when a file is replaced, so a corrected file never serves stale from cache.
- Suggested limits enforced by the admin tool: 50 MB per file, allowed types
  `pdf, docx, doc, pptx, ppt, xlsx, zip`.
- `size` is optional in the schema: the admin tool always records it, but a hand-written
  lesson should not have to stat the file, and a guessed number is worse than none. The
  download row shows the size only when it is known.
- Write credentials (an R2 API token scoped to this one bucket) exist only in the local `.env`.
  CI never touches R2 — it only builds HTML.

---

## 7. Build and deployment

- **Trigger**: push to `main` or `master`, plus manual `workflow_dispatch` to redeploy
  without a commit. Deploys are queued rather than cancelled, so two pushes cannot race.
- **Workflow**: `actions/checkout` → `npm ci` → `npm run build` → `actions/upload-pages-artifact`
  → `actions/deploy-pages`. No secrets required.
- `npm run build` is four steps: `build-content.ts` (Markdown → `lessons.json`) → `tsc -b` →
  `vite build` (client bundle) → `vite build --ssr` (Node bundle of the app) →
  `prerender.ts` (HTML per route, plus `404.html`, `sitemap.xml`, `robots.txt`).
- **Output**: static HTML in `dist/` — one directory per route, plus hashed JS/CSS assets —
  served by GitHub Pages over HTTPS. Deep links resolve to real files, so no SPA redirect shim.
- **Custom domain**: `zarlit.com.ua`, set by a `CNAME` file in `public/` containing that name.
  Because it is an apex domain, GitHub Pages needs **A and AAAA records** pointing at the four
  Pages IPv4 and four IPv6 addresses — a CNAME will not work at the apex. Add a `www` CNAME to
  `<user>.github.io` as well, which Pages redirects to the apex. Pages provisions the TLS
  certificate once DNS resolves; enable *Enforce HTTPS*.
  DNS lives in Cloudflare alongside the R2 subdomain, and the site records must be
  **DNS-only (grey cloud)** — proxying them breaks GitHub's certificate issuance.
- A failed content validation fails the build and blocks the deploy — the previous site stays live.

---

## 8. Analytics

GoatCounter. No cookies and no personal data, so no consent banner is required under
Ukrainian or EU rules.

The site code lives in `analytics.goatcounterCode` in `src/data/site.ts`. **While it is empty
no script is loaded at all** — so local development and preview builds never reach the
service, and the numbers stay clean without an environment check.

Tracked:
- Page views per lesson and per grade — shows which grades need more material.
- **Download clicks** as explicit events (`download:<grade>/<slug>/<label>`), fired on the
  download button. Since files are served from R2, downloads are otherwise invisible.

Because the site is a single-page app after first load, the automatic page view is suppressed
(`no_onload`) and counting is driven by route changes instead — so the landing page and every
page after it are recorded the same way, and never twice.

---

## 9. What this design leaves room for

Deferred features, and the cheapest path to each if v1 proves out:

| Later want | Path from here |
|---|---|
| Search | `lessons.json` is already the whole catalogue and is small — filter it client-side; no backend, no index to build |
| Tags / filter by author or work | Add optional array fields to the frontmatter schema; generate tag index pages |
| Contributions from other teachers | Content stays Markdown; add editors as repo collaborators, review via pull request — no code change needed |
| Accounts or paid access | Requires a real backend and a rethink of static hosting; treat as a v2 rewrite of the delivery layer, with the content model surviving intact |
| Full lesson text on the page | Already supported — the Markdown body is rendered into the prerendered HTML; just start writing it |

---

## 10. Repository layout

```
zarlit/
├─ content/lessons/{5..11}/*.md        lesson content (the actual data)
├─ scripts/
│  ├─ build-content.ts                 md → validated lessons.json
│  └─ prerender.ts                     route HTML + 404 + sitemap + robots
├─ src/
│  ├─ main.tsx, routes.tsx             client entry + route definitions
│  ├─ entry-server.tsx                 static-render entry used by prerender.ts
│  ├─ content/schema.ts                zod schema for lesson frontmatter
│  ├─ lib/meta.ts                      path → title/description/canonical
│  ├─ generated/lessons.json           build artefact, gitignored
│  ├─ pages/                           Home, Grade, Lesson, About, NotFound
│  ├─ components/                      shared components + shadcn/ui
│  ├─ data/grades.ts
│  └─ styles/global.css
├─ admin/                              local-only authoring app (not deployed)
├─ public/                             favicon, og image, CNAME
├─ .github/workflows/deploy.yml
├─ vite.config.ts
└─ SPEC.md
```

---

## 11. Milestones

1. **Skeleton** ✅ — Vite + React + Tailwind + shadcn, routing, layout, home and grade pages
   with hardcoded data.
2. **Content pipeline** ✅ — zod schema, `build-content.ts`, lesson pages, prerendering wired
   up, sample lessons committed by hand.
3. **Ship** ✅ — GitHub Actions deploy, `CNAME`, SEO tags, sitemap, structured data,
   link-preview image, analytics. Going live now needs only the accounts and DNS set up
   (README, "First-time setup") — no further code.
4. **Admin tool** ✅ — R2 upload, Markdown generation, reordering, edit/delete.
5. **Fill** — bulk-add real lessons; refine UI against real content.
6. **Desktop app** ✅ — the authoring tool as an installable Electron app, so the site can
   be updated from a Windows or Mac machine with no Node, git or terminal.

Milestone 4 landed after milestone 3 as planned: hand-writing the first lessons settled what
the form actually needed, so the tool was built once rather than twice.

Milestones 1–3 produce a live, usable site. The admin tool is a productivity investment that
only pays off once the shape of the content is settled — hence its position after launch.

---

## 11a. The desktop app (`desktop/`)

Added after launch, when the tool's user turned out to be someone working on Windows
rather than in a terminal. It is a wrapper, not a rewrite: the same Express API and React
UI that `npm run admin` serves, started inside Electron on an ephemeral loopback port, with
the window pointed at it. That avoids a second implementation of uploading, writing lesson
files and publishing behind an IPC layer.

| Concern | Decision |
|---|---|
| GitHub auth | A fine-grained token over HTTPS, via isomorphic-git. No SSH key, so no git binary has to be installed and nothing has to manage `known_hosts`; the token is scoped to one repository and revocable from the web |
| Publishing | Commit the changed lesson files and push. GitHub Actions builds and deploys, so the machine needs no toolchain and the build behind the live site stays the one in CI |
| Repository | Cloned into the app's data folder on first save of a token, shallow. The user never picks a folder or sees a checkout |
| Credentials | Encrypted with Electron `safeStorage` — DPAPI on Windows, Keychain on macOS — in the app's data folder, never in the repository. If the OS offers no keystore the app says so rather than silently writing plaintext |
| Packaging | electron-builder; unsigned. Both platforms are built in CI, which is also how a Windows installer is produced without Wine on a Mac |

The server modules take their repository path and credentials from `admin/server/config.ts`
rather than reading `process.env` and their own file location, which is what let the same
code serve a developer checkout and a managed clone.

Publishing failures are translated into plain Ukrainian — an expired token, a missing
repository, no network, or someone else's newer commits — because "HTTP Error: 401" tells
the person using this app nothing they can act on.

---

## 12. Placeholders to replace before launch

| What | Where | Placeholder in use |
|---|---|---|
| Site description | `site.description` | Generic Ukrainian one-liner about lesson materials for grades 5–11 |
| Contact email | `site.email` | Empty string — the About page hides the contact block while it is empty |
| About page copy | `src/pages/About.tsx` | Lorem-free stub: one paragraph saying who runs the site, marked `TODO` |
| ~~OG preview image~~ | `public/og.jpg` | Done — generated, 1200×630, regenerate with `npm run og` |
| ~~Favicon~~ | `public/favicon.svg` | Done — simple book glyph |
| GoatCounter code | `site.analytics.goatcounterCode` | Empty — no analytics script loads until it is set |

### Deferred decision: pagination

Unknown at spec time: how many lessons per grade at launch. Grade pages render the full
ordered list with no pagination — correct and fast up to roughly 100 lessons per grade, which
comfortably covers a school year. If a grade grows past that, add pagination or grouping by
topic then; the data model already carries `order` and `topic`, so no migration is involved.
