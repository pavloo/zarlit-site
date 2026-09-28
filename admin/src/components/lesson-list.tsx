import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Grade } from '@/data/types'

import { api, type LessonFile } from '../api'

interface Props {
  grade: Grade
  lessons: LessonFile[]
  onChanged: () => void
  onEdit: (lesson: LessonFile) => void
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function LessonList({ grade, lessons, onChanged, onEdit }: Props) {
  const [items, setItems] = useState(lessons)
  const [dragging, setDragging] = useState<number | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  /*
    `items` is a local copy so that a drag or an arrow press reorders the list
    immediately, before the server has written the files. When a fresh list
    arrives — another grade, or a reload after saving — it replaces that copy.
    Adjusting during render rather than in an effect avoids rendering the stale
    list for a frame first.
  */
  const [shown, setShown] = useState(lessons)
  if (shown !== lessons) {
    setShown(lessons)
    setItems(lessons)
  }

  /*
    Order is saved as soon as it changes: the alternative is a dirty-state
    banner and a save button, for a list that is reordered a few times a year.
  */
  const commit = async (next: LessonFile[]) => {
    setItems(next)
    setStatus('Збереження…')
    try {
      await api.reorder(
        grade,
        next.map((lesson) => lesson.slug),
      )
      setStatus('Порядок збережено')
      onChanged()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  /*
    Deleting is the one action here that can destroy something unrecoverable —
    the files in R2 — so the choice is made explicitly in place rather than
    through stacked confirm() dialogs where OK and Cancel mean different kinds
    of deletion.
  */
  const remove = async (lesson: LessonFile, withFiles: boolean) => {
    setConfirming(null)
    try {
      await api.remove(grade, lesson.slug, withFiles)
      onChanged()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        У {grade} класі ще немає уроків.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          {items.length} {items.length === 1 ? 'урок' : 'уроків'} — перетягніть
          або скористайтеся стрілками, щоб змінити порядок
        </span>
        {status && <span aria-live="polite">{status}</span>}
      </div>

      <ul className="space-y-2">
        {items.map((lesson, index) => (
          <li
            key={lesson.slug}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (dragging !== null && dragging !== index) {
                void commit(move(items, dragging, index))
              }
              setDragging(null)
            }}
            onDragEnd={() => setDragging(null)}
            className={`bg-card flex items-center gap-3 rounded-lg border p-3 ${
              dragging === index ? 'opacity-50' : ''
            }`}
          >
            <GripVertical
              className="text-muted-foreground size-4 shrink-0 cursor-grab"
              aria-hidden="true"
            />

            <div className="flex shrink-0 flex-col">
              <button
                aria-label={`Перемістити «${lesson.title}» вище`}
                disabled={index === 0}
                onClick={() => void commit(move(items, index, index - 1))}
                className="hover:bg-accent rounded p-0.5 disabled:opacity-30"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                aria-label={`Перемістити «${lesson.title}» нижче`}
                disabled={index === items.length - 1}
                onClick={() => void commit(move(items, index, index + 1))}
                className="hover:bg-accent rounded p-0.5 disabled:opacity-30"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{lesson.title}</span>
                {lesson.draft && <Badge variant="outline">чернетка</Badge>}
              </div>
              <p className="text-muted-foreground truncate text-sm">
                {lesson.slug} · {lesson.attachments.length} файл(и)
              </p>
            </div>

            {confirming === lesson.slug ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-sm">Видалити:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void remove(lesson, false)}
                >
                  лише запис
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-600 dark:text-red-400"
                  onClick={() => void remove(lesson, true)}
                >
                  запис і файли
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(null)}
                >
                  скасувати
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Редагувати «${lesson.title}»`}
                  onClick={() => onEdit(lesson)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Видалити «${lesson.title}»`}
                  onClick={() => setConfirming(lesson.slug)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
