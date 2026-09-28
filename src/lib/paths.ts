import type { Grade, Lesson } from '@/data/types'

/*
  Trailing slashes are deliberate. Each page is prerendered to
  `<route>/index.html`, and a static host serves that file for the
  trailing-slash URL while 301-redirecting the bare one. Linking to the
  slashed form means a full page load never pays for a redirect. React Router
  ignores the trailing slash when matching, so client navigation is unaffected.
*/
export const paths = {
  home: '/',
  grade: (grade: Grade) => `/klas/${grade}/`,
  lesson: (lesson: Pick<Lesson, 'grade' | 'slug'>) =>
    `/klas/${lesson.grade}/${lesson.slug}/`,
  about: '/pro-sait/',
} as const
