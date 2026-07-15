import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

function DefaultNotFound() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>404 — Page not found</h1>
      <p>The page you requested does not exist.</p>
    </div>
  )
}

export function getRouter() {
  return createRouter({
    defaultNotFoundComponent: DefaultNotFound,
    parseSearch: payloadParseSearch,
    routeTree,
    scrollRestoration: true,
    stringifySearch: payloadStringifySearch,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
