/*
  The app's view of the content types. They come from the same zod schema the
  content build validates against, so a change to the schema surfaces here as
  a type error rather than as a runtime surprise.
*/
export type {
  Attachment,
  AttachmentType,
  Grade,
  Lesson,
} from '@/content/schema'
export { attachmentTypes, grades } from '@/content/schema'

import { grades } from '@/content/schema'
import type { Grade } from '@/content/schema'

export function isGrade(value: unknown): value is Grade {
  return (grades as readonly number[]).includes(Number(value))
}
