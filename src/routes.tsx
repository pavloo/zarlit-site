import type { RouteObject } from 'react-router-dom'

import { SiteLayout } from '@/layouts/site-layout'
import { AboutPage } from '@/pages/about'
import { GradePage } from '@/pages/grade'
import { HomePage } from '@/pages/home'
import { LessonPage } from '@/pages/lesson'
import { NotFoundPage } from '@/pages/not-found'

/*
  One flat list, so milestone 3 can hand the same routes to the prerenderer:
  every grade and lesson URL is enumerable from the content at build time.
*/
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'klas/:grade', element: <GradePage /> },
      { path: 'klas/:grade/:slug', element: <LessonPage /> },
      { path: 'pro-sait', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
