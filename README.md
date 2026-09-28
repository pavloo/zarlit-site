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
```

## Adding a lesson

Lessons are Markdown files in `content/lessons/<grade>/<slug>.md`. Frontmatter is validated
on every build, so a mistake fails the build instead of shipping. See SPEC.md §3 for the
fields; copy an existing file to start.

`npm run dev` rebuilds and reloads when a lesson file changes.

Publishing is: upload the file to R2 → write the Markdown file → check in `npm run dev` →
review `git diff` → push to `main`. The deploy runs itself from there.

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

Milestones 1–3 of 5 done: scaffold and pages; Markdown content pipeline with build-time
prerendering; deploy workflow, custom domain, SEO tags and analytics. The site is ready to
go live as soon as the setup above is done.

Next: milestone 4, the local admin tool for uploading files and writing lesson files.
See SPEC.md §11.
