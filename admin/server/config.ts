import { fileURLToPath } from 'node:url'

/*
  Where the server gets its repository path and credentials.

  Two callers configure this differently:

  - `npm run admin` runs against this checkout, with credentials from .env.
  - The desktop app (desktop/) works in a clone it manages itself, with
    credentials the user entered, held in the OS keychain.

  So neither path may be read at import time, as it was when the admin tool
  only ever ran from the repository it was editing.
*/

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

export interface GitHubConfig {
  /** Fine-grained token, scoped to the site repository. */
  token: string
  /** "owner/repo", e.g. pavloo/zarlit-site. */
  repo: string
  /** Name shown as the commit author. */
  authorName: string
  authorEmail: string
}

export interface ServerConfig {
  /** Repository working copy whose content/lessons the tool edits. */
  repoRoot: string
  r2: R2Config | null
  github: GitHubConfig | null
  /** True when running inside the desktop app, which owns settings and git. */
  desktop: boolean
}

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

function r2FromEnv(): R2Config | null {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
  } = process.env

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    return null
  }

  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
  }
}

let config: ServerConfig = {
  repoRoot: projectRoot,
  r2: r2FromEnv(),
  github: null,
  desktop: false,
}

export const getConfig = (): ServerConfig => config

export function setConfig(next: Partial<ServerConfig>) {
  config = { ...config, ...next }
}
