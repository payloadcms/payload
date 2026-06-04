import { createRouter } from '@tanstack/react-router'
import * as qs from 'qs-esm'

import { routeTree } from './routeTree.gen'

/**
 * Payload's admin UI serializes query state (notably the list-view `where`
 * filter) with `qs` bracket notation — e.g. `?where[or][0][and][0][x][equals]=y`.
 * TanStack Router's default search serializer treats each bracketed string as a
 * flat key and JSON-encodes values, so it never round-trips Payload's nested
 * query: every navigation re-encodes the already-encoded value, exponentially
 * nesting it (`[true,"[true,\"[true…"]`) until the filter is unusable. Parsing
 * and stringifying with `qs` (same options as `payload`/`@payloadcms/ui`) keeps
 * the URL idempotent and the nested `where` intact across navigations.
 */
const parseSearch = (searchStr: string) =>
  qs.parse(searchStr, { depth: 10, ignoreQueryPrefix: true })

const stringifySearch = (search: Record<string, unknown>) => {
  const searchStr = qs.stringify(search)
  return searchStr ? `?${searchStr}` : ''
}

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
    parseSearch,
    routeTree,
    scrollRestoration: true,
    stringifySearch,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
