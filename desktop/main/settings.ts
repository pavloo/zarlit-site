import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { app, safeStorage } from 'electron'

import type { GitHubConfig, R2Config } from '../../admin/server/config.ts'

/*
  Credentials live in the user's app-data folder, encrypted with Electron's
  safeStorage — DPAPI on Windows, the Keychain on macOS — so they are bound to
  the OS account rather than sitting in a readable file. They are never written
  into the repository, which is what gets pushed to a public GitHub repo.

  safeStorage can be unavailable (a fresh Linux session with no keyring), so
  the file records whether its payload is encrypted and the app degrades to
  plaintext with a visible warning rather than silently losing the settings.
*/

export interface Settings {
  r2: R2Config | null
  github: GitHubConfig | null
}

interface StoredFile {
  encrypted: boolean
  payload: string
}

const EMPTY: Settings = { r2: null, github: null }

const settingsPath = () => join(app.getPath('userData'), 'settings.json')

/** Where the app keeps its clone of the site repository. */
export const repoPath = () => join(app.getPath('userData'), 'zarlit-site')

export function encryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

export function loadSettings(): Settings {
  try {
    const stored = JSON.parse(
      readFileSync(settingsPath(), 'utf8'),
    ) as StoredFile

    const json = stored.encrypted
      ? safeStorage.decryptString(Buffer.from(stored.payload, 'base64'))
      : stored.payload

    return { ...EMPTY, ...(JSON.parse(json) as Settings) }
  } catch {
    // Missing, unreadable, or written under a different OS account.
    return EMPTY
  }
}

export function saveSettings(settings: Settings): Settings {
  const json = JSON.stringify(settings)
  const encrypted = encryptionAvailable()

  const stored: StoredFile = encrypted
    ? {
        encrypted: true,
        payload: safeStorage.encryptString(json).toString('base64'),
      }
    : { encrypted: false, payload: json }

  const file = settingsPath()
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(stored), { mode: 0o600 })

  return settings
}
