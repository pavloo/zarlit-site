import { renderToString } from 'react-dom/server'
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router'

import { routes } from '@/routes'
import '@/styles/global.css'

// Re-exported for scripts/prerender.ts: the head tags in the static HTML are
// then produced by the same code the browser uses during navigation.
export { site } from '@/data/site'
export { getPageMeta } from '@/lib/meta'

/*
  Static rendering for the build step. React Router 7 provides this directly,
  which is why the site needs no third-party SSG package: the same route table
  the browser uses is rendered to HTML here.
*/
export async function render(pathname: string): Promise<string> {
  const handler = createStaticHandler(routes)
  const context = await handler.query(
    new Request(`http://localhost${pathname}`),
  )

  if (context instanceof Response) {
    throw new Error(
      `Unexpected redirect while prerendering ${pathname} (status ${context.status})`,
    )
  }

  const router = createStaticRouter(routes, context)

  /*
    `hydrate={false}` suppresses the __staticRouterHydrationData script. The
    client mounts a plain browser router, so that script would have no
    counterpart in the client render and would break hydration. There is no
    loader data to hand over: every page reads from the bundled content.
  */
  return renderToString(
    <StaticRouterProvider router={router} context={context} hydrate={false} />,
  )
}
