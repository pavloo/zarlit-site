import { Navigate, useParams } from 'react-router-dom'

import { LessonCard } from '@/components/lesson-card'
import { gradeInfo } from '@/data/grades'
import { getLessonsByGrade } from '@/data/lessons'
import { isGrade } from '@/data/types'
import { pluralizeLessons } from '@/lib/format'

export function GradePage() {
  const { grade: gradeParam } = useParams()

  if (!isGrade(gradeParam)) return <Navigate to="/404" replace />

  const grade = Number(gradeParam) as 5 | 6 | 7 | 8 | 9 | 10 | 11
  const lessons = getLessonsByGrade(grade)
  const info = gradeInfo.get(grade)

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{grade} клас</h1>
        {info && (
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            {info.blurb}
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          {lessons.length > 0
            ? pluralizeLessons(lessons.length)
            : 'Поки що порожньо'}
        </p>
      </header>

      {lessons.length > 0 ? (
        <ol className="grid gap-4">
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <LessonCard lesson={lesson} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
          Матеріали для цього класу ще готуються. Завітайте пізніше.
        </p>
      )}
    </div>
  )
}
