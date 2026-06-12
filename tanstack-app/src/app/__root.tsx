import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { useEffect } from 'react'

import { getInitialHtmlAttrsFn } from '../functions/theme.functions'

export const Route = createRootRoute({
  loader: () => getInitialHtmlAttrsFn(),
  head: () => ({
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Roboto+Mono:wght@100..700&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

/**
 * Sets `window.__TANSTACK_HYDRATED__ = true` after the first effect runs,
 * which is the earliest point at which React's event handlers are guaranteed
 * to be attached. The Playwright `goto` wrapper in `initPageConsoleErrorCatch`
 * waits for this flag before returning, which prevents the very common race
 * where a Playwright click lands on the SSR'd DOM before React finishes
 * hydrating (the click focuses the button but the React `onClick` handler
 * never fires).
 *
 * Production users do not see this marker because the bundle hash differs;
 * tests opt-in via the Playwright wrapper and consult the global directly.
 */
function HydrationMarker() {
  useEffect(() => {
    ;(window as unknown as { __TANSTACK_HYDRATED__?: boolean }).__TANSTACK_HYDRATED__ = true
  }, [])
  return null
}

function RootComponent() {
  const { dir, languageCode, theme } = Route.useLoaderData()

  return (
    <html data-theme={theme} dir={dir} lang={languageCode} suppressHydrationWarning>
      <head>
        <style>{`@layer payload-default, payload;`}</style>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <HydrationMarker />
        <Scripts />
      </body>
    </html>
  )
}
