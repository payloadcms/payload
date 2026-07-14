import * as qs from 'qs-esm'

/**
 * `parseSearch` for TanStack Router's `createRouter`, required for Payload's
 * admin UI. Pair with {@link payloadStringifySearch}.
 *
 * Payload serializes query state (notably the list-view `where` filter) with
 * `qs` bracket notation — e.g. `?where[or][0][and][0][x][equals]=y`. TanStack
 * Router's default serializer treats each bracketed string as a flat key and
 * JSON-encodes values, so it never round-trips Payload's nested query: every
 * navigation re-encodes the already-encoded value, exponentially nesting it
 * (`[true,"[true,\"[true…"]`) until the filter is unusable. Parsing and
 * stringifying with `qs` (same options as `payload`/`@payloadcms/ui`) keeps
 * the URL idempotent and the nested `where` intact across navigations.
 *
 * This is a router-global serializer: it applies to every route, not just
 * `/admin`. On your own routes, search values arrive as strings (qs does no
 * JSON type-coercion), so coerce in `validateSearch` (e.g. `Number(...)`) where
 * you need numbers or booleans.
 *
 * @example
 * ```ts
 * import { createRouter } from '@tanstack/react-router'
 * import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start'
 *
 * export function getRouter() {
 *   return createRouter({
 *     parseSearch: payloadParseSearch,
 *     routeTree,
 *     stringifySearch: payloadStringifySearch,
 *   })
 * }
 * ```
 */
export const payloadParseSearch = (searchStr: string) =>
  qs.parse(searchStr, { depth: 10, ignoreQueryPrefix: true })

/**
 * `stringifySearch` for TanStack Router's `createRouter`, required for Payload's
 * admin UI. Pair with {@link payloadParseSearch}; see it for the full rationale.
 */
export const payloadStringifySearch = (search: Record<string, unknown>) => {
  const searchStr = qs.stringify(search)
  return searchStr ? `?${searchStr}` : ''
}
