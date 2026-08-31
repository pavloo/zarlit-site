import type { Grade, Lesson } from '@/data/types'

export const paths = {
  home: '/',
  grade: (grade: Grade) => `/klas/${grade}`,
  lesson: (lesson: Pick<Lesson, 'grade' | 'slug'>) =>
    `/klas/${lesson.grade}/${lesson.slug}`,
  about: '/pro-sait',
} as const
