import { Moon, Sun } from 'lucide-react'
import { useEffect, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

/** Notifies subscribers about a toggle in this tab; `storage` only fires in others. */
const listeners = new Set<() => void>()

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(MEDIA_QUERY)
  media.addEventListener('change', onChange)
  window.addEventListener('storage', onChange)
  listeners.add(onChange)

  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener('storage', onChange)
    listeners.delete(onChange)
  }
}

/*
  The theme lives outside React — in localStorage and the OS setting — so it is
  read as an external store rather than mirrored into state. Only an explicit
  choice is stored, so a visitor who never touches the toggle keeps following
  their system setting, including later changes to it.
*/
function getSnapshot(): Theme {
  return storedTheme() ?? (window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light')
}

/*
  Prerendered HTML cannot know the visitor's theme, and the first client render
  has to match that HTML byte for byte. Returning null gives both sides the same
  placeholder; the real icon appears right after hydration. The inline script in
  index.html has already applied the class, so this only decides the icon.
*/
function getServerSnapshot(): Theme | null {
  return null
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])

  const toggle = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        theme === 'dark' ? 'light' : 'dark',
      )
    } catch {
      /* storage blocked: the toggle cannot take effect, the system theme stands */
    }
    for (const listener of listeners) listener()
  }

  const label = theme === 'dark' ? 'Світла тема' : 'Темна тема'

  return (
    <Button variant="ghost" size="icon" aria-label={label} onClick={toggle}>
      {theme === null ? (
        <span className="size-4" aria-hidden="true" />
      ) : theme === 'dark' ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  )
}
