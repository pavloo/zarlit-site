import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { api, type SettingsView } from '../api'

interface Props {
  onDone: () => void
}

const EMPTY = {
  r2: { accountId: '', accessKeyId: '', secretAccessKey: '', bucket: '' },
  github: {
    token: '',
    repo: 'pavloo/zarlit-site',
    authorName: '',
    authorEmail: '',
  },
}

export function SettingsForm({ onDone }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [stored, setStored] = useState<SettingsView | null>(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        setStored(settings)
        setForm({
          r2: { ...EMPTY.r2, ...settings.r2, secretAccessKey: '' },
          github: { ...EMPTY.github, ...settings.github, token: '' },
        })
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : String(cause)),
      )
  }, [])

  const setR2 = (key: keyof typeof EMPTY.r2, value: string) =>
    setForm((current) => ({ ...current, r2: { ...current.r2, [key]: value } }))

  const setGitHub = (key: keyof typeof EMPTY.github, value: string) =>
    setForm((current) => ({
      ...current,
      github: { ...current.github, [key]: value },
    }))

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await api.saveSettings(form)

      /*
        With a token saved, fetch the site repository: on first run this
        clones it, afterwards it pulls. Without this the app would have no
        lessons to show and nothing to publish.
      */
      if (form.github.token || stored?.hasGitHubToken) {
        setProgress('Завантаження матеріалів із GitHub…')
        await api.sync()
      }

      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <h1 className="text-2xl font-bold">Налаштування</h1>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </p>
      )}

      {stored && !stored.encryptionAvailable && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Операційна система не надає сховища для паролів, тому ключі
          зберігаються у файлі без шифрування.
        </p>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Cloudflare R2 — сховище файлів</h2>
          <p className="text-muted-foreground text-sm">
            Створіть токен у R2 → API → Manage R2 API Tokens, з доступом
            «Object Read &amp; Write» лише до цього бакета.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountId">Account ID</Label>
            <Input
              id="accountId"
              value={form.r2.accountId}
              onChange={(event) => setR2('accountId', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bucket">Назва бакета</Label>
            <Input
              id="bucket"
              value={form.r2.bucket}
              onChange={(event) => setR2('bucket', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">Access Key ID</Label>
            <Input
              id="accessKeyId"
              value={form.r2.accessKeyId}
              onChange={(event) => setR2('accessKeyId', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              type="password"
              autoComplete="off"
              placeholder={stored?.hasR2Secret ? '•••••• (збережено)' : ''}
              value={form.r2.secretAccessKey}
              onChange={(event) => setR2('secretAccessKey', event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Лишіть порожнім, щоб не змінювати збережений ключ.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">GitHub — публікація сайту</h2>
          <p className="text-muted-foreground text-sm">
            Потрібен fine-grained токен із доступом лише до репозиторію сайту
            (Contents: Read and write). Створюється на github.com → Settings →
            Developer settings → Personal access tokens.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="repo">Репозиторій</Label>
            <Input
              id="repo"
              value={form.github.repo}
              onChange={(event) => setGitHub('repo', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Токен</Label>
            <Input
              id="token"
              type="password"
              autoComplete="off"
              placeholder={stored?.hasGitHubToken ? '•••••• (збережено)' : ''}
              value={form.github.token}
              onChange={(event) => setGitHub('token', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorName">Імʼя для історії змін</Label>
            <Input
              id="authorName"
              value={form.github.authorName}
              onChange={(event) => setGitHub('authorName', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorEmail">Email для історії змін</Label>
            <Input
              id="authorEmail"
              type="email"
              value={form.github.authorEmail}
              onChange={(event) => setGitHub('authorEmail', event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2 border-t pt-4">
        <Button type="submit" disabled={saving}>
          {progress ?? (saving ? 'Збереження…' : 'Зберегти')}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Скасувати
        </Button>
      </div>
    </form>
  )
}
