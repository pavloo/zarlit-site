import type { Attachment, Grade } from '@/data/types'

export interface LessonFile {
  slug: string
  title: string
  description: string
  grade: Grade
  order: number
  topic?: string
  work?: string
  attachments: Attachment[]
  publishedAt: string
  updatedAt?: string
  draft: boolean
  body: string
}

export interface AdminConfig {
  r2Configured: boolean
  githubConfigured: boolean
  /** True inside the desktop app, where settings and publishing exist. */
  desktop: boolean
  grades: Grade[]
  maxFileBytes: number
}

export interface SettingsView {
  r2: { accountId: string; accessKeyId: string; bucket: string } | null
  github: { repo: string; authorName: string; authorEmail: string } | null
  hasR2Secret: boolean
  hasGitHubToken: boolean
  encryptionAvailable: boolean
}

export interface PublishStatus {
  changed: string[]
  ahead: number
  configured: boolean
}

export interface PublishResult {
  committed: boolean
  sha?: string
  pushed: boolean
  changed: string[]
  actionsUrl: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? `${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  config: () => request<AdminConfig>('/config'),

  list: (grade?: Grade) =>
    request<LessonFile[]>(`/lessons${grade ? `?grade=${grade}` : ''}`),

  get: (grade: Grade, slug: string) =>
    request<LessonFile>(`/lessons/${grade}/${slug}`),

  create: (lesson: Partial<LessonFile>) =>
    request<{ slug: string; path: string }>('/lessons', json(lesson)),

  update: (grade: Grade, slug: string, lesson: Partial<LessonFile>) =>
    request<{ slug: string; path: string }>(`/lessons/${grade}/${slug}`, {
      ...json(lesson),
      method: 'PUT',
    }),

  remove: (grade: Grade, slug: string, withFiles: boolean) =>
    request<{ deleted: string; removedKeys: string[] }>(
      `/lessons/${grade}/${slug}?files=${withFiles}`,
      { method: 'DELETE' },
    ),

  reorder: (grade: Grade, slugs: string[]) =>
    request<{ ok: true }>('/reorder', json({ grade, slugs })),

  slugFor: (title: string) =>
    request<{ slug: string }>('/slug', json({ title })),

  getSettings: () => request<SettingsView>('/settings'),

  saveSettings: (settings: unknown) =>
    request<{ ok: true }>('/settings', { ...json(settings), method: 'PUT' }),

  sync: () => request<{ ok: true }>('/sync', json({})),

  publishStatus: () => request<PublishStatus>('/publish'),

  publish: (message?: string) =>
    request<PublishResult>('/publish', json({ message })),

  upload: (file: File, grade: Grade, slug: string, label: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('grade', String(grade))
    form.append('slug', slug)
    form.append('label', label)

    return request<Attachment>('/upload', { method: 'POST', body: form })
  },
}
