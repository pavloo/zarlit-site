import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { gradeList } from '@/data/grades'
import type { Attachment, Grade } from '@/data/types'

import { api, type AdminConfig, type LessonFile } from '../api'
import { AttachmentEditor } from './attachment-editor'
import { MarkdownEditor } from './markdown-editor'

interface Props {
  grade: Grade
  lesson?: LessonFile
  config: AdminConfig | null
  onDone: () => void
  onCancel: () => void
}

/*
  Local calendar date, not UTC: toISOString() would show tomorrow's date to an
  author working in the evening east of Greenwich, or yesterday's west of it.
*/
const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

export function LessonForm({ grade, lesson, config, onDone, onCancel }: Props) {
  const editing = lesson !== undefined

  const [form, setForm] = useState({
    grade: lesson?.grade ?? grade,
    title: lesson?.title ?? '',
    description: lesson?.description ?? '',
    topic: lesson?.topic ?? '',
    work: lesson?.work ?? '',
    publishedAt: lesson?.publishedAt ?? today(),
    updatedAt: lesson?.updatedAt ?? '',
    draft: lesson?.draft ?? false,
    body: lesson?.body ?? '',
  })

  const [attachments, setAttachments] = useState<Attachment[]>(
    lesson?.attachments ?? [],
  )
  const [slug, setSlug] = useState(lesson?.slug ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  /*
    The slug is derived from the title on the server, where the
    transliteration table lives. It is fixed once a lesson exists: it is the
    page's URL, and renaming it would break links teachers have shared.
  */
  useEffect(() => {
    if (editing || !form.title.trim()) return

    const timer = setTimeout(() => {
      api
        .slugFor(form.title)
        .then(({ slug: value }) => setSlug(value))
        .catch(() => undefined)
    }, 250)

    return () => clearTimeout(timer)
  }, [form.title, editing])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      slug,
      topic: form.topic.trim() || undefined,
      work: form.work.trim() || undefined,
      updatedAt: form.updatedAt || undefined,
      attachments,
      order: lesson?.order ?? 0,
    }

    try {
      if (editing) {
        await api.update(lesson.grade, lesson.slug, payload)
      } else {
        await api.create(payload)
      }
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="text-2xl font-bold">
        {editing ? `Редагування: ${lesson.title}` : 'Новий урок'}
      </h1>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="grade">Клас</Label>
          <Select
            id="grade"
            value={form.grade}
            disabled={editing}
            onChange={(event) => set('grade', Number(event.target.value) as Grade)}
          >
            {gradeList.map(({ grade: value }) => (
              <option key={value} value={value}>
                {value} клас
              </option>
            ))}
          </Select>
          {editing && (
            <p className="text-muted-foreground text-xs">
              Клас і адреса сторінки незмінні після створення.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="publishedAt">Дата публікації</Label>
          <Input
            id="publishedAt"
            type="date"
            required
            value={form.publishedAt}
            onChange={(event) => set('publishedAt', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Назва уроку</Label>
        <Input
          id="title"
          required
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Адреса: /klas/{form.grade}/{slug || '…'}/
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Опис</Label>
        <Textarea
          id="description"
          required
          maxLength={300}
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          {form.description.length}/300 — показується в списку уроків і в
          результатах пошуку.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="topic">Тема (необовʼязково)</Label>
          <Input
            id="topic"
            value={form.topic}
            onChange={(event) => set('topic', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work">Твір (необовʼязково)</Label>
          <Input
            id="work"
            value={form.work}
            onChange={(event) => set('work', event.target.value)}
          />
        </div>
      </div>

      <AttachmentEditor
        attachments={attachments}
        grade={form.grade}
        slug={slug}
        canUpload={config?.r2Configured ?? false}
        onChange={setAttachments}
      />

      <div className="space-y-2">
        <Label>Текст уроку (необовʼязково)</Label>
        <MarkdownEditor
          value={form.body}
          onChange={(markdown) => set('body', markdown)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="updatedAt">Дата оновлення (необовʼязково)</Label>
          <div className="flex gap-2">
            <Input
              id="updatedAt"
              type="date"
              value={form.updatedAt}
              onChange={(event) => set('updatedAt', event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => set('updatedAt', today())}
            >
              Сьогодні
            </Button>
          </div>
        </div>

        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={form.draft}
            onChange={(event) => set('draft', event.target.checked)}
            className="size-4"
          />
          <span className="text-sm">Чернетка — не потрапляє на сайт</span>
        </label>
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button type="submit" disabled={saving || attachments.length === 0}>
          {saving ? 'Збереження…' : 'Зберегти файл уроку'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Скасувати
        </Button>
        <p className="text-muted-foreground ml-auto self-center text-xs">
          Зберігає лише файл — коміт і публікація за вами.
        </p>
      </div>
    </form>
  )
}
