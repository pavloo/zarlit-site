import { Trash2, Upload } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Attachment, Grade } from '@/data/types'
import { formatFileSize } from '@/lib/format'

import { api } from '../api'

interface Props {
  attachments: Attachment[]
  grade: Grade
  slug: string
  canUpload: boolean
  onChange: (attachments: Attachment[]) => void
}

const emptyAttachment: Attachment = {
  label: '',
  url: '',
  filename: '',
  type: 'other',
}

export function AttachmentEditor({
  attachments,
  grade,
  slug,
  canUpload,
  onChange,
}: Props) {
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const update = (index: number, patch: Partial<Attachment>) => {
    onChange(
      attachments.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  const upload = async (index: number, file: File) => {
    if (!slug) {
      setError('Спочатку введіть назву уроку — з неї утворюється ім’я файлу.')
      return
    }

    // The label becomes part of the object key, so fall back to the file's own
    // name rather than uploading to a key ending in a dash.
    const label =
      attachments[index].label || file.name.replace(/\.[^.]+$/, '')

    setBusy(index)
    setError(null)

    try {
      const uploaded = await api.upload(file, grade, slug, label)
      update(index, uploaded)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Матеріали</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...attachments, { ...emptyAttachment }])}
        >
          Додати матеріал
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {attachments.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Потрібен щонайменше один матеріал.
        </p>
      )}

      <ul className="space-y-3">
        {attachments.map((attachment, index) => (
          <li key={index} className="bg-card space-y-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={attachment.label}
                placeholder="Підпис, напр. «Презентація»"
                onChange={(event) =>
                  update(index, { label: event.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Прибрати матеріал"
                onClick={() =>
                  onChange(attachments.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {attachment.url ? (
              <p className="text-muted-foreground truncate text-sm">
                {attachment.filename || attachment.url}
                {' · '}
                {attachment.type.toUpperCase()}
                {attachment.size !== undefined &&
                  ` · ${formatFileSize(attachment.size)}`}
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm ${
                    canUpload
                      ? 'hover:bg-accent cursor-pointer'
                      : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <Upload className="size-4" />
                  {busy === index ? 'Завантаження…' : 'Вибрати файл'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={!canUpload || busy !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void upload(index, file)
                    }}
                  />
                </label>

                {/*
                  Pasting a URL keeps the tool usable before R2 exists, and
                  works for a file that is already uploaded.
                */}
                <Input
                  placeholder="або вставте URL файлу"
                  value={attachment.url}
                  onChange={(event) => {
                    const url = event.target.value
                    const filename = url.split('/').pop() ?? ''
                    const extension = filename
                      .slice(filename.lastIndexOf('.') + 1)
                      .toLowerCase()
                    update(index, {
                      url,
                      filename,
                      type: (extension || 'other') as Attachment['type'],
                    })
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
