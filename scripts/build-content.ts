import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { z } from 'zod'

import { frontmatterSchema, type Lesson } from '../src/content/schema.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const contentDir = join(root, 'content/lessons')
const outFile = join(root, 'src/generated/lessons.json')

/*
  `html: false` escapes raw HTML in lesson bodies rather than passing it
  through, which is the sanitisation step: nothing a Markdown file contains
  can inject markup into the page.
*/
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  quotes: '«»‘’',
})

async function markdownFiles(dir: string): Promise<string[]> {
  // A site with no lessons yet is a valid state — a fresh clone, or every
  // lesson deleted — so a missing directory is empty, not an error.
  const entries = await readdir(dir, {
    recursive: true,
    withFileTypes: true,
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw error
  })

  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === '.md')
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
}

function parseLesson(path: string, raw: string, errors: string[]): Lesson | null {
  const where = relative(root, path)
  const { data, content } = matter(raw)
  const result = frontmatterSchema.safeParse(data)

  if (!result.success) {
    errors.push(`${where}\n${z.prettifyError(result.error)}`)
    return null
  }

  const { draft, ...frontmatter } = result.data
  if (draft) return null

  // The directory is the authority on grade; a mismatch means a misfiled lesson.
  const dirGrade = Number(basename(join(path, '..')))
  if (dirGrade !== frontmatter.grade) {
    errors.push(
      `${where}\n  ✖ grade ${frontmatter.grade} does not match directory ${dirGrade}`,
    )
    return null
  }

  return {
    ...frontmatter,
    slug: basename(path, '.md'),
    bodyHtml: content.trim() ? md.render(content) : '',
  }
}

function checkDuplicates(lessons: Lesson[], errors: string[]) {
  const seenSlugs = new Set<string>()
  const seenOrder = new Map<string, string>()

  for (const lesson of lessons) {
    const id = `${lesson.grade}/${lesson.slug}`
    if (seenSlugs.has(id)) errors.push(`  ✖ duplicate lesson ${id}`)
    seenSlugs.add(id)

    const orderKey = `${lesson.grade}#${lesson.order}`
    const clash = seenOrder.get(orderKey)
    if (clash) {
      errors.push(
        `  ✖ grade ${lesson.grade}: "${clash}" and "${lesson.slug}" share order ${lesson.order}`,
      )
    }
    seenOrder.set(orderKey, lesson.slug)
  }
}

export async function buildContent(): Promise<Lesson[]> {
  const files = await markdownFiles(contentDir)
  const errors: string[] = []

  const lessons = (
    await Promise.all(
      files.map(async (path) =>
        parseLesson(path, await readFile(path, 'utf8'), errors),
      ),
    )
  ).filter((lesson): lesson is Lesson => lesson !== null)

  lessons.sort(
    (a, b) =>
      a.grade - b.grade ||
      a.order - b.order ||
      a.title.localeCompare(b.title, 'uk'),
  )
  checkDuplicates(lessons, errors)

  if (errors.length > 0) {
    throw new Error(`Invalid lesson content:\n\n${errors.join('\n\n')}\n`)
  }

  await mkdir(join(root, 'src/generated'), { recursive: true })
  await writeFile(outFile, `${JSON.stringify(lessons, null, 2)}\n`)

  return lessons
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    const lessons = await buildContent()
    console.log(`content: ${lessons.length} lessons → src/generated/lessons.json`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
