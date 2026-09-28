import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import matter from 'gray-matter'

import { frontmatterSchema, type Frontmatter } from '../../src/content/schema.ts'

const root = fileURLToPath(new URL('../..', import.meta.url))
const contentDir = join(root, 'content/lessons')

export interface LessonFile extends Frontmatter {
  slug: string
  body: string
}

function lessonPath(grade: number, slug: string): string {
  return join(contentDir, String(grade), `${slug}.md`)
}

/*
  A slug becomes a file path, so it must not be able to escape the content
  directory. Everything the admin writes goes through here.
*/
function assertSafeSlug(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(`Unsafe slug: ${slug}`)
  }
}

export async function readLesson(
  grade: number,
  slug: string,
): Promise<LessonFile> {
  assertSafeSlug(slug)
  const raw = await readFile(lessonPath(grade, slug), 'utf8')
  const { data, content } = matter(raw)

  return {
    ...frontmatterSchema.parse(data),
    slug,
    body: content.replace(/^\n+/, ''),
  }
}

export async function listLessons(grade?: number): Promise<LessonFile[]> {
  const entries = await readdir(contentDir, {
    recursive: true,
    withFileTypes: true,
  })

  const lessons = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && extname(entry.name) === '.md')
      .map((entry) =>
        readLesson(
          Number(basename(entry.parentPath)),
          basename(entry.name, '.md'),
        ),
      ),
  )

  return lessons
    .filter((lesson) => grade === undefined || lesson.grade === grade)
    .sort((a, b) => a.grade - b.grade || a.order - b.order)
}

/** The next free position in a grade, so a new lesson lands at the end. */
export async function nextOrder(grade: number): Promise<number> {
  const lessons = await listLessons(grade)
  return lessons.reduce((max, lesson) => Math.max(max, lesson.order), 0) + 1
}

export async function writeLesson(
  lesson: Omit<LessonFile, 'body'> & { body: string },
): Promise<string> {
  const { slug, body, ...frontmatter } = lesson
  assertSafeSlug(slug)
  frontmatterSchema.parse(frontmatter)

  const path = lessonPath(frontmatter.grade, slug)
  await mkdir(join(path, '..'), { recursive: true })

  /*
    Keys are written in a fixed order so that generated files read like the
    hand-written ones and a later edit produces a minimal diff. `draft: false`
    is the schema default and is left out rather than written into every
    lesson, as are undefined optionals.
  */
  const KEY_ORDER = [
    'title',
    'description',
    'grade',
    'order',
    'topic',
    'work',
    'attachments',
    'publishedAt',
    'updatedAt',
    'draft',
  ] as const

  const data = Object.fromEntries(
    KEY_ORDER.map((key) => [key, frontmatter[key]]).filter(
      ([key, value]) => value !== undefined && !(key === 'draft' && !value),
    ),
  )

  await writeFile(path, matter.stringify(`\n${body.trim()}\n`, data))
  return path
}

export async function deleteLesson(grade: number, slug: string) {
  assertSafeSlug(slug)
  await rm(lessonPath(grade, slug))
}

/** Writes new `order` values for a grade, leaving everything else untouched. */
export async function reorderLessons(grade: number, slugs: string[]) {
  await Promise.all(
    slugs.map(async (slug, index) => {
      const lesson = await readLesson(grade, slug)
      if (lesson.order === index + 1) return
      await writeLesson({ ...lesson, order: index + 1 })
    }),
  )
}
