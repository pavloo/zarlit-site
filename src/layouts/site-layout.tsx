import { BookOpen } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import { Analytics } from '@/components/analytics'
import { DocumentMeta } from '@/components/document-meta'
import { ThemeToggle } from '@/components/theme-toggle'
import { gradeList } from '@/data/grades'
import { site } from '@/data/site'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/paths'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <DocumentMeta />
      <Analytics />

      <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            to={paths.home}
            className="flex min-w-0 items-center gap-2 font-semibold"
          >
            <BookOpen className="text-primary size-5 shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">{site.title}</span>
              <span className="sm:hidden">{site.shortTitle}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <NavLink
              to={paths.about}
              className={({ isActive }) =>
                cn(
                  'hover:text-foreground rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )
              }
            >
              Про сайт
            </NavLink>
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Класи" className="border-t">
          <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2">
            {gradeList.map(({ grade }) => (
              <NavLink
                key={grade}
                to={paths.grade(grade)}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                {grade} клас
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.title}
          </p>
          <Link to={paths.about} className="hover:text-foreground">
            Про сайт
          </Link>
        </div>
      </footer>
    </div>
  )
}
