# zarlit

Матеріали до уроків зарубіжної літератури для 5–11 класів — [zarlit.com.ua](https://zarlit.com.ua)

Architecture, content model, and roadmap live in [SPEC.md](SPEC.md).

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # validate content, typecheck, build, prerender → dist/
npm run preview  # serve dist/ at http://localhost:4173
npm run lint
npm run og       # regenerate public/og.jpg (macOS only)
npm run admin    # local authoring tool, http://127.0.0.1:5174
```

## Adding a lesson

Run `npm run admin`, fill in the form, attach the files. It uploads each file to R2, reads
back its size and URL, and writes `content/lessons/<grade>/<slug>.md` for you. It also
reorders lessons within a grade, edits them, and deletes them.

**It never commits.** Review `git diff`, then push — that diff is the last check before the
site is public. Publishing is:

    npm run admin → review git diff → commit → push to main → live in about a minute

Lessons are plain Markdown, so writing one by hand is equally valid; copy an existing file
and see SPEC.md §3 for the fields. Frontmatter is validated on every build, so a mistake
fails the build instead of shipping. `npm run dev` reloads when a lesson file changes.

Notes on the admin tool:

- The lesson body is written in a visual editor (headings, lists, bold, links), but stored
  as Markdown. "Показати Markdown" switches to the raw text when you want it. Opening a
  hand-written lesson re-flows its paragraphs onto single lines — the page renders the
  same, but the diff will show it.
- Without R2 credentials it still runs — file upload is disabled, and you paste a file URL
  instead. Fill in `.env` (see `.env.example`) to enable uploads.
- A lesson's address is fixed once created. Renaming would break links teachers have
  already shared, so the slug and grade are read-only when editing.
- Deleting asks whether to remove the files from storage too; removing only the record
  leaves the files reachable by anyone who already has the link.

## First-time setup

The site builds and deploys on its own once these four are done. None can be done from the
repository alone.

### 1. GitHub repository and Pages

Push this repository to GitHub, then in **Settings → Pages**, set **Source** to
**GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and deploys on
every push to `main` or `master`; it needs no secrets.

### 2. DNS for zarlit.com.ua

`public/CNAME` claims the domain. Because it is an apex domain, Pages needs **A and AAAA**
records — a CNAME at the apex will not work:

```
A     zarlit.com.ua   185.199.108.153
A     zarlit.com.ua   185.199.109.153
A     zarlit.com.ua   185.199.110.153
A     zarlit.com.ua   185.199.111.153
AAAA  zarlit.com.ua   2606:50c0:8000::153
AAAA  zarlit.com.ua   2606:50c0:8001::153
AAAA  zarlit.com.ua   2606:50c0:8002::153
AAAA  zarlit.com.ua   2606:50c0:8003::153
CNAME www             <username>.github.io
```

Verify these against GitHub's current published addresses before entering them — GitHub has
changed them before. If DNS is hosted at Cloudflare (it will be, for R2), these records must
be **DNS-only — grey cloud**. Proxying them blocks GitHub's certificate issuance. Then enable
**Enforce HTTPS** in Settings → Pages.

### 3. Cloudflare R2 for lesson files

Create a bucket, allow public read, and map it to `files.zarlit.com.ua`. Upload lesson files
under `<grade>/<slug>-<label>.<ext>`; that public URL is what goes in the Markdown
frontmatter. See SPEC.md §6.

### 4. Analytics

Create a site at [goatcounter.com](https://www.goatcounter.com) and put its code — the first
label of the dashboard URL, so `zarlit` for `zarlit.goatcounter.com` — into
`analytics.goatcounterCode` in `src/data/site.ts`. While it is empty no analytics script
loads at all, which keeps local development out of the numbers.

## Status

Milestones 1–4 of 5 done: scaffold and pages; Markdown content pipeline with build-time
prerendering; deploy workflow, custom domain, SEO and analytics; local admin tool. The site
is ready to go live as soon as the setup above is done.

Next: milestone 5 — fill in real lessons and refine the UI against them. See SPEC.md §11.
