import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import { site } from '../../src/data/site.ts'
import { slugifyLabel } from './slug.ts'

/*
  R2 speaks the S3 API, so the standard AWS client works against it. The
  credentials are a bucket-scoped API token in a gitignored .env; CI never
  sees them, because the deploy only builds HTML.
*/

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env

export const r2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET,
)

let client: S3Client | null = null

function getClient(): S3Client {
  if (!r2Configured) {
    throw new Error(
      'R2 is not configured. Copy .env.example to .env and fill it in, ' +
        'or paste a file URL instead of uploading.',
    )
  }

  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })

  return client
}

/** `6/homer-odisseia-prezentatsiia.pptx` — human-browsable in the dashboard. */
export function objectKey(
  grade: number,
  slug: string,
  label: string,
  filename: string,
): string {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return `${grade}/${slug}-${slugifyLabel(label)}${extension}`
}

export interface UploadResult {
  key: string
  url: string
  size: number
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<UploadResult> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Files are replaced by name, so a long cache needs a purge on replace;
      // a day is a reasonable compromise for material that rarely changes.
      CacheControl: 'public, max-age=86400',
    }),
  )

  return { key, url: `${site.filesUrl}/${key}`, size: body.byteLength }
}

export async function deleteFile(key: string) {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  )
}

/** Recovers the object key from a stored URL, for deletion. */
export function keyFromUrl(url: string): string | null {
  const prefix = `${site.filesUrl}/`
  return url.startsWith(prefix) ? url.slice(prefix.length) : null
}
