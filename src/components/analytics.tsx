import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { loadAnalytics, trackPageview } from '@/lib/analytics'

/**
 * Loads the analytics script once, then records a page view for the first page
 * and for every client-side navigation after it.
 */
export function Analytics() {
  const { pathname } = useLocation()

  useEffect(() => {
    loadAnalytics()
  }, [])

  useEffect(() => {
    trackPageview(pathname)
  }, [pathname])

  return null
}
