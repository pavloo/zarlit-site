import express, { type Request, type Response } from 'express'
import type { GitHubConfig, R2Config } from './config.ts'
import multer from 'multer'

import {
  attachmentTypes,
  grades,
  type Grade,
} from '../../src/content/schema.ts'
import {
  deleteLesson,
  listLessons,
  nextOrder,
  readLesson,
  reorderLessons,
  writeLesson,
  type LessonFile,
} from './content.ts'
import { getConfig, setConfig } from './config.ts'
import { publish, publishStatus, syncRepo } from './publish.ts'
import {
  deleteFile,
  keyFromUrl,
  objectKey,
  r2Configured,
  uploadFile,
} from './r2.ts'
import { slugify } from './slug.ts'

const MAX_FILE_BYTES = 50 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
})

/** Maps a file name to one of the schema's attachment types. */
function attachmentType(filename: string): string {
  const extension = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
  return (attachmentTypes as readonly string[]).includes(extension)
    ? extension
    : 'other'
}

function parseGrade(value: string): Grade {
  const grade = Number(value)
  if (!(grades as readonly number[]).includes(grade)) {
    throw new Error(`Unknown grade: ${value}`)
  }
  return grade as Grade
}

/*
  An Express app rather than a Router: mounted inside Vite's connect stack, the
  app is what installs Express's own request and response helpers. A bare
  Router receives an undecorated ServerResponse, where `res.json` does not
  exist.
*/
export interface DesktopHooks {
  saveSettings: (settings: {
    r2: R2Config | null
    github: GitHubConfig | null
  }) => void
  encryptionAvailable: () => boolean
}

export function createApiApp(hooks?: DesktopHooks) {
  const api = express()
  api.use(express.json({ limit: '1mb' }))

  api.get('/config', (_req, res) => {
    const { desktop, github } = getConfig()
    res.json({
      r2Configured: r2Configured(),
      githubConfigured: Boolean(github?.token),
      desktop,
      grades,
      maxFileBytes: MAX_FILE_BYTES,
    })
  })

  api.get('/lessons', async (req, res) => {
    const grade = req.query.grade ? parseGrade(String(req.query.grade)) : undefined
    res.json(await listLessons(grade))
  })

  api.get('/lessons/:grade/:slug', async (req, res) => {
    res.json(await readLesson(parseGrade(req.params.grade), req.params.slug))
  })

  api.post('/lessons', async (req: Request, res: Response) => {
    const lesson = req.body as LessonFile
    const slug = lesson.slug || slugify(lesson.title)

    const path = await writeLesson({
      ...lesson,
      slug,
      order: lesson.order || (await nextOrder(lesson.grade)),
    })

    res.json({ slug, path })
  })

  api.put('/lessons/:grade/:slug', async (req, res) => {
    const grade = parseGrade(req.params.grade)
    const { slug } = req.params
    const existing = await readLesson(grade, slug)
    const updated = req.body as LessonFile

    /*
      The slug is the page's URL, so it is fixed once published: renaming it
      would break every link a teacher has already shared. The grade is fixed
      with it, since the grade is part of that URL.
    */
    const path = await writeLesson({
      ...updated,
      slug,
      grade,
      order: updated.order ?? existing.order,
    })

    res.json({ slug, path })
  })

  api.delete('/lessons/:grade/:slug', async (req, res) => {
    const grade = parseGrade(req.params.grade)
    const { slug } = req.params
    const lesson = await readLesson(grade, slug)

    /*
      Files are removed only when asked. A lesson can be deleted because it was
      misfiled, and taking its attachments with it would break any link that is
      already out in the world.
    */
    const removeFiles = req.query.files === 'true'
    const removedKeys: string[] = []

    if (removeFiles && r2Configured()) {
      for (const attachment of lesson.attachments) {
        const key = keyFromUrl(attachment.url)
        if (key) {
          await deleteFile(key)
          removedKeys.push(key)
        }
      }
    }

    await deleteLesson(grade, slug)
    res.json({ deleted: slug, removedKeys })
  })

  api.post('/reorder', async (req, res) => {
    const { grade, slugs } = req.body as { grade: number; slugs: string[] }
    await reorderLessons(parseGrade(String(grade)), slugs)
    res.json({ ok: true })
  })

  api.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) throw new Error('No file received')

    /*
      Multipart file names arrive latin1-decoded, so a Ukrainian file name
      reaches us as mojibake ("Ð\x94Ñ\x96..." for "Ді..."). Re-reading those
      bytes as UTF-8 restores it. The name is what the browser saves the
      download as, so getting it wrong is visible to every teacher.
    */
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString(
      'utf8',
    )

    const { grade, slug, label } = req.body as Record<string, string>
    const key = objectKey(
      parseGrade(grade),
      slugify(slug),
      label,
      originalName,
    )

    const { url, size } = await uploadFile(
      key,
      req.file.buffer,
      req.file.mimetype,
    )

    res.json({
      label,
      url,
      filename: originalName,
      size,
      type: attachmentType(originalName),
    })
  })

  /*
    Settings and publishing exist only in the desktop app. Under
    `npm run admin` credentials come from .env and publishing is the
    developer's own git, so these routes are not mounted at all.
  */
  if (hooks) {
    api.get('/settings', (_req, res) => {
      const { r2, github } = getConfig()
      res.json({
        // The secrets themselves are never sent back to the UI; it only needs
        // to know whether each one is set.
        r2: r2 && { ...r2, secretAccessKey: '' },
        github: github && { ...github, token: '' },
        hasR2Secret: Boolean(r2?.secretAccessKey),
        hasGitHubToken: Boolean(github?.token),
        encryptionAvailable: hooks.encryptionAvailable(),
      })
    })

    api.put('/settings', async (req, res) => {
      const body = req.body as {
        r2: (R2Config & { secretAccessKey: string }) | null
        github: (GitHubConfig & { token: string }) | null
      }
      const current = getConfig()

      // An empty secret field means "keep the stored one", so that the UI can
      // show settings without ever holding the secret.
      const r2 = body.r2 && {
        ...body.r2,
        secretAccessKey:
          body.r2.secretAccessKey || current.r2?.secretAccessKey || '',
      }
      const github = body.github && {
        ...body.github,
        token: body.github.token || current.github?.token || '',
      }

      setConfig({ r2, github })
      hooks.saveSettings({ r2, github })

      res.json({ ok: true })
    })

    api.post('/sync', async (_req, res) => {
      await syncRepo()
      res.json({ ok: true })
    })

    api.get('/publish', async (_req, res) => {
      res.json(await publishStatus())
    })

    api.post('/publish', async (req, res) => {
      const { message } = req.body as { message?: string }
      res.json(await publish(message))
    })
  }

  api.post('/slug', (req, res) => {
    res.json({ slug: slugify(String((req.body as { title: string }).title)) })
  })

  api.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      // Express identifies an error handler by its four parameters.
      _next: express.NextFunction,
    ) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[admin] ${message}`)
      res.status(400).json({ error: message })
    },
  )

  return api
}
