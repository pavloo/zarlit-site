import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { routes } from '@/routes'
import '@/styles/global.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <RouterProvider router={createBrowserRouter(routes)} />
  </StrictMode>
)

// Production HTML arrives prerendered, so hydrate it; the dev server serves an
// empty shell, so mount from scratch.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
