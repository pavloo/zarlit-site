import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'

/*
  The local authoring tool. It is a separate Vite app with its own entry point
  and no production build target, so there is no path by which it can end up on
  the public site. It writes lesson files and uploads to R2; it never commits.

  Run it with `npm run admin`.
*/

function adminApi(): Plugin {
  return {
    name: 'zarlit-admin-api',
    async configureServer(server) {
      // Imported lazily so that a missing .env fails when the API is first
      // used, with a message in the UI, rather than at server start.
      const { createApiApp } = await import('./server/index.ts')
      // Vite's middleware stack is typed for connect. An Express app is
      // call-compatible with it, but the two type definitions are unrelated.
      server.middlewares.use(
        '/api',
        createApiApp() as unknown as Connect.NextHandleFunction,
      )
    },
  }
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [adminApi(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    // Never expose a tool that writes files and deletes objects beyond this
    // machine, whatever network the laptop happens to be on.
    host: '127.0.0.1',
    open: true,
  },
})
