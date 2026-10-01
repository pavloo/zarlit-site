import { CloudUpload, ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

import { api, type PublishStatus } from '../api'

interface Props {
  /** Bumped by the parent after any change, to re-check what is unpublished. */
  revision: number
}

/*
  Publishing commits the changed lesson files and pushes them; GitHub Actions
  builds and deploys from there. The bar stays out of the way until there is
  something to publish, so the usual state of the app is quiet.
*/
export function PublishBar({ revision }: Props) {
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    api
      .publishStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, revision])

  const publish = async () => {
    setBusy(true)
    setError(null)
    setResult(null)

    try {
      const outcome = await api.publish()
      setResult(
        outcome.committed
          ? `Опубліковано ${outcome.changed.length} файл(ів). Сайт оновиться за хвилину.`
          : 'Змін не було — надіслано попередні.',
      )
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  if (!status?.configured) return null

  const pending = status.changed.length
  // `ahead` covers a commit that was made but whose push failed — otherwise
  // the bar would hide and the work would look published when it is not.
  const unpushed = status.ahead > 0

  if (pending === 0 && !unpushed && !result && !error) return null

  return (
    <div className="bg-muted/50 border-t">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
        {error ? (
          <span className="text-red-600 dark:text-red-400">{error}</span>
        ) : result ? (
          <span>{result}</span>
        ) : (
          <span>
            {pending === 0
              ? 'Зміни збережено, але не надіслано на GitHub'
              : pending === 1
                ? 'Є 1 неопублікована зміна'
                : `Є ${pending} неопублікованих змін`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://zarlit.com.ua"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Відкрити сайт <ExternalLink className="size-3.5" />
          </a>
          {(pending > 0 || unpushed) && (
            <Button size="sm" disabled={busy} onClick={() => void publish()}>
              <CloudUpload className="size-4" />
              {busy ? 'Публікація…' : 'Опублікувати'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
