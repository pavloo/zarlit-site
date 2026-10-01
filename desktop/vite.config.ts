import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

/*
  Builds the Electron main process. Everything except Electron itself is
  bundled in: electron-builder only packages `dependencies`, and the server's
  libraries are devDependencies of the website, so bundling keeps the app
  self-contained without pushing build-time packages into the site's
  dependency list.

  Output is CommonJS — the most predictable format for an Electron main
  process — hence the .cjs extension inside this ESM project.
*/
export default defineConfig({
  // Vite externalises node_modules in an SSR build by default; here everything
  // must end up inside main.cjs, since no node_modules are packaged.
  ssr: { noExternal: true },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: false,
    ssr: true,
    target: 'node20',
    rollupOptions: {
      input: fileURLToPath(new URL('./main/index.ts', import.meta.url)),
      external: ['electron'],
      output: {
        format: 'cjs',
        entryFileNames: 'main.cjs',
        codeSplitting: false,
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
})
