import { site } from '@/data/site'

/*
  GoatCounter: no cookies and no personal data, so the site needs no consent
  banner. Nothing is loaded at all until a site code is configured in
  src/data/site.ts, which keeps development and previews out of the numbers.
*/

interface GoatCounter {
  /** Defined by count.js once it loads; absent in the settings object below. */
  count?: (vars: { path: string; title?: string; event?: boolean }) => void
  no_onload?: boolean
}

declare global {
  interface Window {
    goatcounter?: GoatCounter
  }
}

const SCRIPT_SRC = 'https://gc.zgo.at/count.js'

export const analyticsEnabled = () => site.analytics.goatcounterCode !== ''

export function loadAnalytics() {
  if (!analyticsEnabled() || document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    return
  }

  /*
    `no_onload` suppresses the automatic page view. This is a single-page app:
    counting is driven by route changes instead, so the first page and every
    later one are recorded the same way, and never twice.
  */
  window.goatcounter = { no_onload: true }

  const script = document.createElement('script')
  script.async = true
  script.src = SCRIPT_SRC
  script.dataset.goatcounter = `https://${site.analytics.goatcounterCode}.goatcounter.com/count`
  document.head.append(script)
}

export function trackPageview(path: string) {
  window.goatcounter?.count?.({ path, title: document.title })
}

/**
 * Downloads are served from object storage, so they are invisible to the site's
 * own page views. This records them as events — `download:6/slug/Презентація`.
 */
export function trackDownload(path: string, label: string) {
  window.goatcounter?.count?.({
    path: `download:${path.replace(/^\/|\/$/g, '')}/${label}`,
    title: `Завантаження: ${label}`,
    event: true,
  })
}
