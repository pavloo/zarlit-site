import { ArrowLeft, Download } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getLesson } from '@/data/lessons'
import { isGrade } from '@/data/types'
import { formatDate, formatFileSize } from '@/lib/format'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'

export function LessonPage() {
  const { grade: gradeParam, slug } = useParams()

  if (!isGrade(gradeParam) || !slug) return <Navigate to="/404" replace />

  const grade = Number(gradeParam) as 5 | 6 | 7 | 8 | 9 | 10 | 11
  const lesson = getLesson(grade, slug)

  if (!lesson) return <Navigate to="/404" replace />

  return (
    <article className="space-y-8">
      <Link
        to={paths.grade(grade)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        {grade} клас
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lesson.grade} клас</Badge>
          {lesson.topic && <Badge variant="outline">{lesson.topic}</Badge>}
          {lesson.work && <Badge variant="outline">«{lesson.work}»</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          {lesson.title}
        </h1>
        <p className="text-muted-foreground max-w-[70ch] text-lg leading-relaxed">
          {lesson.description}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Матеріали до уроку</h2>
        <ul className="grid gap-3">
          {lesson.attachments.map((attachment) => (
            <li key={attachment.url}>
              <a
                href={attachment.url}
                download={attachment.filename}
                className="hover:border-primary/50 hover:bg-accent/40 flex items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-md">
                  <Download className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{attachment.label}</span>
                  <span className="text-muted-foreground block text-sm">
                    {attachment.type.toUpperCase()} ·{' '}
                    {formatFileSize(attachment.size)}
                  </span>
                </span>
                <span
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'hidden sm:inline-flex',
                  )}
                  aria-hidden="true"
                >
                  Завантажити
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {lesson.bodyHtml && (
        <section
          className="max-w-[70ch] leading-relaxed [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:my-1 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
          // Sanitised at build time by the content pipeline (milestone 2).
          dangerouslySetInnerHTML={{ __html: lesson.bodyHtml }}
        />
      )}

      <footer className="text-muted-foreground border-t pt-4 text-sm">
        Опубліковано {formatDate(lesson.publishedAt)}
        {lesson.updatedAt && ` · оновлено ${formatDate(lesson.updatedAt)}`}
      </footer>
    </article>
  )
}
