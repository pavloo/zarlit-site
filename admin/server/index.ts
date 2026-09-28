import express, { type Request, type Response } from 'express'
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
export function createApiApp() {
  const api = express()
  api.use(express.json({ limit: '1mb' }))

  api.get('/config', (_req, res) => {
    res.json({ r2Configured, grades, maxFileBytes: MAX_FILE_BYTES })
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

    if (removeFiles && r2Configured) {
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

    const { grade, slug, label } = req.body as Record<string, string>
    const key = objectKey(
      parseGrade(grade),
      slugify(slug),
      label,
      req.file.originalname,
    )

    const { url, size } = await uploadFile(
      key,
      req.file.buffer,
      req.file.mimetype,
    )

    res.json({
      label,
      url,
      filename: req.file.originalname,
      size,
      type: attachmentType(req.file.originalname),
    })
  })

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
