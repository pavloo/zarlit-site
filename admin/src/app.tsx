import { BookOpen, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { gradeList } from '@/data/grades'
import type { Grade } from '@/data/types'
import { cn } from '@/lib/utils'

import { api, type AdminConfig, type LessonFile } from './api'
import { LessonForm } from './components/lesson-form'
import { LessonList } from './components/lesson-list'

type View = { name: 'list' } | { name: 'new' } | { name: 'edit'; lesson: LessonFile }

export function App() {
  const [grade, setGrade] = useState<Grade>(5)
  const [view, setView] = useState<View>({ name: 'list' })
  const [lessons, setLessons] = useState<LessonFile[]>([])
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLessons(await api.list(grade))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [grade])

  /*
    Fetching the lesson list is synchronisation with an external system, which
    is what an effect is for. The state is set once the request resolves, not
    synchronously during the effect.
  */
  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    api.config().then(setConfig).catch(() => setConfig(null))
  }, [])

  const backToList = () => {
    setView({ name: 'list' })
    void reload()
  }

  return (
    <div className="min-h-screen">
      <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3">
          <BookOpen className="text-primary size-5" />
          <span className="font-semibold">Адмінка</span>
          <span className="text-muted-foreground hidden text-sm sm:inline">
            локальний інструмент — нічого не публікує
          </span>

          {view.name === 'list' && (
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => setView({ name: 'new' })}
            >
              <Plus className="size-4" />
              Новий урок
            </Button>
          )}
        </div>

        {view.name === 'list' && (
          <nav className="border-t" aria-label="Класи">
            <div className="mx-auto flex w-full max-w-4xl gap-1 overflow-x-auto px-4 py-2">
              {gradeList.map(({ grade: value }) => (
                <button
                  key={value}
                  onClick={() => setGrade(value)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    value === grade
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {value} клас
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        {error && (
          <p className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
            {error}
          </p>
        )}

        {config && !config.r2Configured && (
          <p className="border-primary/40 bg-primary/5 mb-6 rounded-md border p-3 text-sm">
            R2 не налаштовано — завантаження файлів вимкнено. Скопіюйте
            <code className="mx-1 text-xs">.env.example</code> у
            <code className="mx-1 text-xs">.env</code>, або вставляйте готові
            посилання на файли вручну.
          </p>
        )}

        {view.name === 'list' && (
          <LessonList
            grade={grade}
            lessons={lessons}
            onChanged={reload}
            onEdit={(lesson) => setView({ name: 'edit', lesson })}
          />
        )}

        {view.name === 'new' && (
          <LessonForm
            grade={grade}
            config={config}
            onDone={backToList}
            onCancel={() => setView({ name: 'list' })}
          />
        )}

        {view.name === 'edit' && (
          <LessonForm
            grade={view.lesson.grade}
            lesson={view.lesson}
            config={config}
            onDone={backToList}
            onCancel={() => setView({ name: 'list' })}
          />
        )}
      </main>
    </div>
  )
}
