import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Lesson } from '../src/content/schema.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

interface PageMeta {
  title: string
  description: string
  canonical: string
  noindex?: boolean
  jsonLd?: Record<string, unknown>
}

type Render = (pathname: string) => Promise<string>
type GetPageMeta = (pathname: string) => PageMeta

const grades = [5, 6, 7, 8, 9, 10, 11] as const

/**
 * Every URL the site has, derived from the content — nothing hand-listed.
 * Trailing slashes match src/lib/paths.ts and the files written below.
 */
function routePaths(lessons: Lesson[]): string[] {
  return [
    '/',
    '/pro-sait/',
    ...grades.map((grade) => `/klas/${grade}/`),
    ...lessons.map((lesson) => `/klas/${lesson.grade}/${lesson.slug}/`),
  ]
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Replace a whole tag by its id; ids are unique, so this stays unambiguous. */
function replaceTagById(html: string, id: string, tag: string): string {
  const pattern = new RegExp(`<[a-z]+[^>]*\\bid="${id}"[^>]*/?>`, 'i')
  if (!pattern.test(html)) {
    throw new Error(`index.html is missing the tag with id="${id}"`)
  }
  return html.replace(pattern, tag)
}

function buildHtml(template: string, meta: PageMeta, appHtml: string): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const canonical = escapeHtml(meta.canonical)

  let html = template.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${title}</title>`,
  )

  html = replaceTagById(
    html,
    'meta-description',
    `<meta id="meta-description" name="description" content="${description}" />`,
  )
  html = replaceTagById(
    html,
    'meta-robots',
    `<meta id="meta-robots" name="robots" content="${
      meta.noindex ? 'noindex, follow' : 'index, follow'
    }" />`,
  )
  html = replaceTagById(
    html,
    'meta-canonical',
    `<link id="meta-canonical" rel="canonical" href="${canonical}" />`,
  )
  html = replaceTagById(
    html,
    'meta-og-title',
    `<meta id="meta-og-title" property="og:title" content="${title}" />`,
  )
  html = replaceTagById(
    html,
    'meta-og-description',
    `<meta id="meta-og-description" property="og:description" content="${description}" />`,
  )
  html = replaceTagById(
    html,
    'meta-og-url',
    `<meta id="meta-og-url" property="og:url" content="${canonical}" />`,
  )

  if (meta.jsonLd) {
    /*
      `<` is escaped so a string in the data can never close the script tag.
      Schema.org data is only read from delivered HTML, so it is written here
      rather than maintained by the app during client-side navigation.
    */
    const json = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">${json}</script>\n  </head>`,
    )
  }

  return html.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  )
}

function sitemap(paths: string[], siteUrl: string, lessons: Lesson[]): string {
  const lastmod = new Map(
    lessons.map((lesson) => [
      `/klas/${lesson.grade}/${lesson.slug}/`,
      lesson.updatedAt ?? lesson.publishedAt,
    ]),
  )

  const urls = paths
    .map((path) => {
      const date = lastmod.get(path)
      return [
        '  <url>',
        `    <loc>${siteUrl}${path}</loc>`,
        date ? `    <lastmod>${date}</lastmod>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

async function writePage(path: string, html: string) {
  // "/" → dist/index.html, "/klas/6/" → dist/klas/6/index.html
  const file = join(distDir, path, 'index.html')
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html)
}

async function main() {
  // The SSR bundle re-exports everything the prerenderer needs, so the page
  // metadata here is produced by the same code the browser runs.
  const { render, getPageMeta, site } = (await import(
    join(ssrDir, 'entry-server.js')
  )) as { render: Render; getPageMeta: GetPageMeta; site: { url: string } }

  const lessons = JSON.parse(
    await readFile(join(root, 'src/generated/lessons.json'), 'utf8'),
  ) as Lesson[]

  const template = await readFile(join(distDir, 'index.html'), 'utf8')
  const paths = routePaths(lessons)

  for (const path of paths) {
    await writePage(
      path,
      buildHtml(template, getPageMeta(path), await render(path)),
    )
  }

  // GitHub Pages serves 404.html for anything unmatched.
  await writeFile(
    join(distDir, '404.html'),
    buildHtml(template, getPageMeta('/404'), await render('/404')),
  )

  await writeFile(
    join(distDir, 'sitemap.xml'),
    sitemap(paths, site.url, lessons),
  )
  await writeFile(
    join(distDir, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
  )

  await rm(ssrDir, { recursive: true, force: true })

  console.log(`prerender: ${paths.length} pages + 404, sitemap, robots.txt`)
}

await main()
