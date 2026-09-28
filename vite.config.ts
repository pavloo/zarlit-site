import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { buildContent } from './scripts/build-content.ts'

const contentDir = fileURLToPath(new URL('./content', import.meta.url))

/*
  Keeps src/generated/lessons.json in step with the Markdown while the dev
  server runs, so editing a lesson file refreshes the page like editing code.
*/
function contentPlugin(): Plugin {
  return {
    name: 'zarlit-content',
    async buildStart() {
      await buildContent()
    },
    configureServer(server) {
      server.watcher.add(contentDir)

      const rebuild = async (path: string) => {
        if (!path.startsWith(contentDir) || !path.endsWith('.md')) return

        try {
          await buildContent()
          server.ws.send({ type: 'full-reload' })
        } catch (error) {
          server.config.logger.error(
            error instanceof Error ? error.message : String(error),
          )
        }
      }

      server.watcher.on('add', rebuild)
      server.watcher.on('change', rebuild)
      server.watcher.on('unlink', rebuild)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [contentPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
