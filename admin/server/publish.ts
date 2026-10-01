import fs from 'node:fs'

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'

import { getConfig, type GitHubConfig } from './config.ts'

/*
  Publishing is: commit the lesson files, push to the site repository, and let
  the existing GitHub Actions workflow build and deploy. Nothing is built here,
  so the desktop app needs no toolchain — and the build that produces the live
  site stays the one in CI, rather than a second one that could drift.

  isomorphic-git speaks git over HTTPS in pure JavaScript, so no git binary has
  to be installed on the machine. Authentication is a fine-grained token, which
  is why SSH keys are not involved: no key generation, no known_hosts, and the
  token can be revoked from github.com if a laptop goes missing.
*/

const BRANCH = 'master'

/*
  isomorphic-git surfaces transport failures as "HTTP Error: 401", which tells
  the person using the app nothing about what to do. The app is used by someone
  who will not read a stack trace, so the common cases get a plain explanation.
*/
function explain(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error)

  if (/401|403/.test(message)) {
    return new Error(
      'GitHub відхилив токен. Перевірте його в налаштуваннях — можливо, ' +
        'строк дії минув або бракує доступу «Contents: Read and write».',
    )
  }
  if (/404/.test(message)) {
    return new Error(
      'Репозиторій не знайдено. Перевірте його назву в налаштуваннях.',
    )
  }
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|network/i.test(message)) {
    return new Error('Немає звʼязку з GitHub. Перевірте інтернет і спробуйте ще раз.')
  }
  if (/not a fast-forward|FastForward/i.test(message)) {
    return new Error(
      'На GitHub є новіші зміни. Натисніть «Оновити», щоб їх отримати, ' +
        'а потім публікуйте знову.',
    )
  }
  return error instanceof Error ? error : new Error(message)
}

function requireGitHub(): GitHubConfig {
  const { github } = getConfig()
  if (!github?.token || !github.repo) {
    throw new Error('GitHub is not configured. Add a token in Settings.')
  }
  return github
}

const remoteUrl = (repo: string) => `https://github.com/${repo}.git`

/*
  GitHub accepts a token as the HTTP basic password. The user name is ignored
  for fine-grained tokens, but something must be sent.
*/
const onAuth = (token: string) => () => ({
  username: 'x-access-token',
  password: token,
})

export interface PublishStatus {
  /** Paths under content/ that differ from the last commit. */
  changed: string[]
  ahead: number
  configured: boolean
}

/** Files the user has added, edited or deleted since the last publish. */
export async function publishStatus(): Promise<PublishStatus> {
  const { repoRoot, github } = getConfig()

  if (!github?.token) {
    return { changed: [], ahead: 0, configured: false }
  }

  const matrix = await git.statusMatrix({
    fs,
    dir: repoRoot,
    filter: (filepath) => filepath.startsWith('content/'),
  })

  // [filepath, head, workdir, stage] — anything where workdir differs from
  // head is a change the user has made since the last publish.
  const changed = matrix
    .filter(([, head, workdir]) => head !== workdir)
    .map(([filepath]) => filepath)

  const local = await git
    .resolveRef({ fs, dir: repoRoot, ref: BRANCH })
    .catch(() => null)
  const remote = await git
    .resolveRef({ fs, dir: repoRoot, ref: `refs/remotes/origin/${BRANCH}` })
    .catch(() => null)

  return {
    changed,
    ahead: local && remote && local !== remote ? 1 : 0,
    configured: true,
  }
}

export interface PublishResult {
  committed: boolean
  sha?: string
  pushed: boolean
  changed: string[]
  actionsUrl: string
}

export async function publish(message?: string): Promise<PublishResult> {
  const { repoRoot } = getConfig()
  const github = requireGitHub()

  const { changed } = await publishStatus()

  for (const filepath of changed) {
    const [, , workdir] = (await git.statusMatrix({
      fs,
      dir: repoRoot,
      filter: (candidate) => candidate === filepath,
    }))[0]

    // workdir === 0 means the file is gone from disk, so stage the removal.
    if (workdir === 0) {
      await git.remove({ fs, dir: repoRoot, filepath })
    } else {
      await git.add({ fs, dir: repoRoot, filepath })
    }
  }

  let sha: string | undefined

  if (changed.length > 0) {
    sha = await git.commit({
      fs,
      dir: repoRoot,
      message: message?.trim() || defaultMessage(changed),
      author: { name: github.authorName, email: github.authorEmail },
    })
  }

  // Push even with nothing new to commit: an earlier publish may have
  // committed and then failed to reach GitHub.
  try {
    await git.push({
      fs,
      http,
      dir: repoRoot,
      url: remoteUrl(github.repo),
      ref: BRANCH,
      onAuth: onAuth(github.token),
    })
  } catch (error) {
    throw explain(error)
  }

  return {
    committed: sha !== undefined,
    sha,
    pushed: true,
    changed,
    actionsUrl: `https://github.com/${github.repo}/actions`,
  }
}

function defaultMessage(changed: string[]): string {
  if (changed.length === 1) {
    return `Оновлено ${changed[0].replace('content/lessons/', '')}`
  }
  return `Оновлено матеріали (${changed.length} файлів)`
}

/** Clones the site repository on first run, or fetches into an existing one. */
export async function syncRepo(
  onProgress?: (phase: string) => void,
): Promise<void> {
  const { repoRoot } = getConfig()
  const github = requireGitHub()

  const cloned = fs.existsSync(`${repoRoot}/.git`)

  try {
  if (!cloned) {
    onProgress?.('Завантаження репозиторію…')
    await git.clone({
      fs,
      http,
      dir: repoRoot,
      url: remoteUrl(github.repo),
      ref: BRANCH,
      singleBranch: true,
      // The app only ever edits content files; the full history is not worth
      // downloading over a slow connection.
      depth: 1,
      onAuth: onAuth(github.token),
    })
    return
  }

  onProgress?.('Оновлення…')
  await git.pull({
    fs,
    http,
    dir: repoRoot,
    ref: BRANCH,
    singleBranch: true,
    fastForwardOnly: true,
    author: { name: github.authorName, email: github.authorEmail },
    onAuth: onAuth(github.token),
  })
  } catch (error) {
    throw explain(error)
  }
}
