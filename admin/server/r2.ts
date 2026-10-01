import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import { site } from '../../src/data/site.ts'
import { getConfig, type R2Config } from './config.ts'
import { slugifyLabel } from './slug.ts'

/*
  R2 speaks the S3 API, so the standard AWS client works against it. The
  credentials come from the running configuration — a gitignored .env for
  `npm run admin`, the OS keychain inside the desktop app — never from a
  committed file. CI never sees them, because the deploy only builds HTML.
*/

export const r2Configured = () => getConfig().r2 !== null

/*
  Cached per credential set: the client is rebuilt when the user saves new
  settings in the desktop app, rather than keeping the old keys alive.
*/
let cached: { key: string; client: S3Client } | null = null

function clientFor(r2: R2Config): S3Client {
  const key = `${r2.accountId}:${r2.accessKeyId}:${r2.bucket}`
  if (cached?.key === key) return cached.client

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
    },
  })

  cached = { key, client }
  return client
}

function requireR2(): R2Config {
  const { r2 } = getConfig()
  if (!r2) {
    throw new Error(
      'R2 is not configured. Add the credentials in Settings, or paste a ' +
        'file URL instead of uploading.',
    )
  }
  return r2
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
  const r2 = requireR2()

  await clientFor(r2).send(
    new PutObjectCommand({
      Bucket: r2.bucket,
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
  const r2 = requireR2()
  await clientFor(r2).send(
    new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }),
  )
}

/** Recovers the object key from a stored URL, for deletion. */
export function keyFromUrl(url: string): string | null {
  const prefix = `${site.filesUrl}/`
  return url.startsWith(prefix) ? url.slice(prefix.length) : null
}
