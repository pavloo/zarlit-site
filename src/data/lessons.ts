import lessonsJson from '@/generated/lessons.json'
import type { Grade, Lesson } from './types'

/*
  `src/generated/lessons.json` is produced by `scripts/build-content.ts` from
  the Markdown in `content/lessons/`. It is gitignored and rebuilt before every
  dev run and build, so it is always in step with the Markdown on disk.
*/
const allLessons = lessonsJson as Lesson[]

const byOrder = (a: Lesson, b: Lesson) =>
  a.order - b.order || a.title.localeCompare(b.title, 'uk')

export function getAllLessons(): Lesson[] {
  return allLessons
}

export function getLessonsByGrade(grade: Grade): Lesson[] {
  return allLessons.filter((lesson) => lesson.grade === grade).sort(byOrder)
}

export function getLesson(grade: Grade, slug: string): Lesson | undefined {
  return allLessons.find(
    (lesson) => lesson.grade === grade && lesson.slug === slug,
  )
}

export function getLessonCount(grade: Grade): number {
  return allLessons.filter((lesson) => lesson.grade === grade).length
}

export function getRecentLessons(limit = 4): Lesson[] {
  return [...allLessons]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
}
