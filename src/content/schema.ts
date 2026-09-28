import { z } from 'zod'

/*
  The single source of truth for what a lesson file may contain. The content
  build validates every Markdown file against this and fails the build on a
  mismatch — there is no CMS to catch mistakes at entry time.
*/

export const grades = [5, 6, 7, 8, 9, 10, 11] as const

export const attachmentTypes = [
  'pdf',
  'docx',
  'doc',
  'pptx',
  'ppt',
  'xlsx',
  'zip',
  'other',
] as const

export const attachmentSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.url(),
  filename: z.string().min(1),
  /* Optional: hand-written lessons rarely know the byte count, while the
     admin tool always fills it in. The UI shows the size only when present. */
  size: z.int().positive().optional(),
  type: z.enum(attachmentTypes),
})

/*
  YAML turns an unquoted 2026-08-28 into a Date, and a quoted one into a
  string. Authors should not have to remember which, so accept both and
  normalise to an ISO date string.
*/
const isoDate = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.iso.date(),
)

export const frontmatterSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(300),
  grade: z.union([
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
    z.literal(11),
  ]),
  order: z.int(),
  topic: z.string().min(1).max(80).optional(),
  work: z.string().min(1).max(120).optional(),
  attachments: z.array(attachmentSchema).min(1),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  draft: z.boolean().default(false),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>
export type Attachment = z.infer<typeof attachmentSchema>
export type Grade = Frontmatter['grade']
export type AttachmentType = Attachment['type']

/** A validated lesson plus the fields derived from its file path and body. */
export interface Lesson extends Omit<Frontmatter, 'draft'> {
  slug: string
  bodyHtml: string
}
