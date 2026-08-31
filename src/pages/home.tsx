import { Link } from 'react-router-dom'

import { LessonCard } from '@/components/lesson-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { gradeList } from '@/data/grades'
import { getLessonCount, getRecentLessons } from '@/data/lessons'
import { site } from '@/data/site'
import { pluralizeLessons } from '@/lib/format'
import { paths } from '@/lib/paths'

export function HomePage() {
  const recent = getRecentLessons()

  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {site.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
          {site.description}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Оберіть клас</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gradeList.map(({ grade, blurb }) => {
            const count = getLessonCount(grade)

            return (
              <Card
                key={grade}
                className="hover:border-primary/40 relative transition-colors"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl">
                    <Link
                      to={paths.grade(grade)}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {grade} клас
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {blurb}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {count > 0 ? pluralizeLessons(count) : 'Матеріали готуються'}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Нещодавно додані</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((lesson) => (
              <LessonCard key={lesson.slug} lesson={lesson} showGrade />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
