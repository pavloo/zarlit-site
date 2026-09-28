import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { getPageMeta } from '@/lib/meta'

function setAttribute(id: string, attr: string, value: string) {
  document.getElementById(id)?.setAttribute(attr, value)
}

/*
  The prerendered HTML already carries the correct tags for whichever page a
  visitor lands on. This keeps them right after client-side navigation, which
  matters for the browser tab, bookmarks, and anything reading the live DOM.
  The tag ids are declared in index.html.
*/
export function DocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = getPageMeta(pathname)

    document.title = meta.title
    setAttribute('meta-description', 'content', meta.description)
    setAttribute('meta-og-title', 'content', meta.title)
    setAttribute('meta-og-description', 'content', meta.description)
    setAttribute('meta-og-url', 'content', meta.canonical)
    setAttribute('meta-canonical', 'href', meta.canonical)
    setAttribute(
      'meta-robots',
      'content',
      meta.noindex ? 'noindex, follow' : 'index, follow',
    )
  }, [pathname])

  return null
}
