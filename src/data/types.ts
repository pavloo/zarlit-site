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

export type AttachmentType = (typeof attachmentTypes)[number]

export interface Attachment {
  /** Human label shown on the download button, e.g. "Презентація". */
  label: string
  url: string
  filename: string
  /** Size in bytes, shown to the reader before they commit to a download. */
  size: number
  type: AttachmentType
}

export interface Lesson {
  slug: string
  title: string
  description: string
  grade: Grade
  /** Position within the grade; follows the school programme, not upload date. */
  order: number
  topic?: string
  work?: string
  attachments: Attachment[]
  publishedAt: string
  updatedAt?: string
  /** Rendered Markdown body. Empty until the content pipeline lands (milestone 2). */
  bodyHtml?: string
}

export const grades = [5, 6, 7, 8, 9, 10, 11] as const

export type Grade = (typeof grades)[number]

export function isGrade(value: unknown): value is Grade {
  return grades.includes(Number(value) as Grade)
}
