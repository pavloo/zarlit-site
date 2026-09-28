import { gradeInfo } from '@/data/grades'
import { getLesson, getLessonsByGrade } from '@/data/lessons'
import { site } from '@/data/site'
import { isGrade, type Grade } from '@/data/types'
import { pluralizeLessons } from '@/lib/format'

export interface PageMeta {
  title: string
  description: string
  /** Absolute canonical URL, also used as the Open Graph URL. */
  canonical: string
  /** Excluded from the sitemap and marked noindex. */
  noindex?: boolean
  /**
   * Schema.org data for search engines, written into the prerendered HTML by
   * scripts/prerender.ts. It is not maintained during client-side navigation:
   * crawlers read the delivered HTML, and no crawler clicks through the app.
   */
  jsonLd?: Record<string, unknown>
}

function withSuffix(title: string): string {
  return `${title} — ${site.title}`
}

/*
  One function that maps a path to its head tags. The app uses it at runtime to
  keep the title in step with client-side navigation; the prerenderer uses the
  same function to write the tags into the static HTML, so the two can never
  drift apart.
*/
export function getPageMeta(pathname: string): PageMeta {
  const path = pathname.replace(/\/+$/, '') || '/'
  // Canonicals use the trailing-slash form the static host actually serves,
  // so they never point at a URL that redirects. See src/lib/paths.ts.
  const canonical = `${site.url}${path === '/' ? '/' : `${path}/`}`
  const segments = path.split('/').filter(Boolean)

  if (path === '/') {
    return {
      title: site.title,
      description: site.description,
      canonical,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.title,
        description: site.description,
        url: `${site.url}/`,
        inLanguage: 'uk-UA',
      },
    }
  }

  if (path === '/pro-sait') {
    return {
      title: withSuffix('Про сайт'),
      description: `Хто веде сайт «${site.title}» і як із ним зв'язатися.`,
      canonical,
    }
  }

  if (segments[0] === 'klas' && isGrade(segments[1])) {
    const grade = Number(segments[1]) as Grade

    if (segments.length === 2) {
      const count = getLessonsByGrade(grade).length
      const blurb = gradeInfo.get(grade)?.blurb ?? ''
      return {
        title: withSuffix(`${grade} клас`),
        description: `Матеріали до уроків зарубіжної літератури, ${grade} клас: ${blurb.toLowerCase()}. ${
          count > 0 ? pluralizeLessons(count) : 'Матеріали готуються'
        }.`,
        canonical,
      }
    }

    if (segments.length === 3) {
      const lesson = getLesson(grade, segments[2])
      if (lesson) {
        return {
          title: withSuffix(lesson.title),
          description: lesson.description,
          canonical,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: lesson.title,
            description: lesson.description,
            url: canonical,
            inLanguage: 'uk-UA',
            learningResourceType: 'lesson plan',
            educationalLevel: `${grade} клас`,
            about: lesson.work ?? lesson.topic,
            datePublished: lesson.publishedAt,
            dateModified: lesson.updatedAt ?? lesson.publishedAt,
            isAccessibleForFree: true,
            audience: {
              '@type': 'EducationalAudience',
              educationalRole: 'teacher',
            },
            publisher: { '@type': 'Organization', name: site.title },
          },
        }
      }
    }
  }

  return {
    title: withSuffix('Сторінку не знайдено'),
    description: site.description,
    canonical,
    noindex: true,
  }
}
