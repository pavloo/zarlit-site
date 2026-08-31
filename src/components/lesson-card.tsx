import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Lesson } from '@/data/types'
import { paths } from '@/lib/paths'

interface LessonCardProps {
  lesson: Lesson
  /** Grade pages already state the grade; the home page needs it spelled out. */
  showGrade?: boolean
}

export function LessonCard({ lesson, showGrade = false }: LessonCardProps) {
  return (
    <Card className="hover:border-primary/40 focus-within:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {showGrade && <Badge variant="secondary">{lesson.grade} клас</Badge>}
          {lesson.topic && <Badge variant="outline">{lesson.topic}</Badge>}
        </div>
        <CardTitle>
          <Link
            to={paths.lesson(lesson)}
            className="after:absolute after:inset-0 hover:underline"
          >
            {lesson.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {lesson.description}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          {lesson.attachments.map((attachment) => (
            <Badge key={attachment.url} variant="outline" className="uppercase">
              {attachment.type}
            </Badge>
          ))}
          <span className="text-primary ml-auto inline-flex items-center gap-1 font-medium">
            Відкрити <ArrowRight className="size-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
