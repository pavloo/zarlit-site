import { mkdirSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { join } from 'node:path'

import { app, BrowserWindow, shell } from 'electron'
import express from 'express'

import { createApiApp } from '../../admin/server/index.ts'
import { setConfig } from '../../admin/server/config.ts'
import {
  encryptionAvailable,
  loadSettings,
  repoPath,
  saveSettings,
} from './settings.ts'

/*
  The desktop wrapper around the authoring tool.

  The same Express API the developer-facing `npm run admin` uses is served
  here on a loopback port, with the built admin UI as static files, and the
  window simply points at it. That keeps one implementation of uploading,
  writing lesson files and publishing, rather than a second one behind IPC.

  The port is ephemeral and bound to 127.0.0.1, so nothing is reachable from
  the network.
*/

let server: Server | null = null
/*
  Started once and reused. On macOS closing the window does not quit the app,
  so the server has to outlive the window — otherwise reopening from the Dock
  would find nothing to load.
*/
let serverUrl: Promise<string> | null = null

async function startServer(): Promise<string> {
  const repoRoot = repoPath()
  mkdirSync(repoRoot, { recursive: true })

  const settings = loadSettings()
  setConfig({
    repoRoot,
    r2: settings.r2,
    github: settings.github,
    desktop: true,
  })

  const server_ = express()
  server_.use('/api', createApiApp({ saveSettings, encryptionAvailable }))

  // The renderer is a normal single-page app: unknown paths fall back to the
  // shell so the UI can own its own routing.
  const uiRoot = join(__dirname, 'renderer')
  server_.use(express.static(uiRoot))
  server_.use((_req, res) => res.sendFile(join(uiRoot, 'index.html')))

  return new Promise((resolve, reject) => {
    server = createServer(server_)
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server!.address()
      if (address === null || typeof address === 'string') {
        reject(new Error('Could not determine the local server port'))
        return
      }
      resolve(`http://127.0.0.1:${address.port}`)
    })
  })
}

async function createWindow() {
  /*
    The window always loads the app's own server, in development as well as in
    a packaged build, so that what is tested is what ships. `npm run admin`
    remains the fast path for working on the UI itself.
  */
  const url = await (serverUrl ??= startServer())

  const window = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 820,
    title: 'Зарубіжна література — редактор',
    backgroundColor: '#ffffff',
    webPreferences: {
      // The renderer is a plain web app talking to the loopback API; it needs
      // no Node access, so it does not get any.
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Links to GitHub, Cloudflare or the live site belong in the user's own
  // browser, not in an app window with no address bar or back button.
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    void shell.openExternal(target)
    return { action: 'deny' }
  })

  await window.loadURL(url)
}

void app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // macOS convention: the app stays open with no windows, so the server stays
  // up too and reopening from the Dock is instant.
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  server?.close()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow()
})
