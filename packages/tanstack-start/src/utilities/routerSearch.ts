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
 * import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start/shared'
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

type SearchParamsRecord = Record<string, string | string[]>

/**
 * Converts the router's parsed search (see {@link payloadParseSearch}) into the
 * `searchParams` record admin views receive, matching the shape Next.js passes:
 * nested keys are flattened back to bracket notation (`filter[op]`), and a key
 * holding a list of plain values becomes a `string[]` under that key, as a
 * repeated query key does on Next.
 *
 * The admin loader can't read the raw query string: TanStack Router rebuilds
 * `location.searchStr` with `payloadStringifySearch`, which writes arrays with
 * indices (`operation[0]=update`), so `URLSearchParams` would expose
 * `operation[0]` instead of `operation`.
 */
export const searchToSearchParams = ({
  search,
}: {
  search: Record<string, unknown>
}): SearchParamsRecord =>
  Object.entries(search).reduce<SearchParamsRecord>(
    (searchParams, [key, value]) => appendSearchParam({ key, searchParams, value }),
    {},
  )

const appendSearchParam = ({
  key,
  searchParams,
  value,
}: {
  key: string
  searchParams: SearchParamsRecord
  value: unknown
}): SearchParamsRecord => {
  if (value === undefined) {
    return searchParams
  }

  if (Array.isArray(value)) {
    const hasOnlyPlainValues = value.every((item) => item === null || typeof item !== 'object')

    if (hasOnlyPlainValues) {
      searchParams[key] = value.map((item) => String(item ?? ''))
      return searchParams
    }

    return value.reduce<SearchParamsRecord>(
      (acc, item, index) =>
        appendSearchParam({ key: `${key}[${index}]`, searchParams: acc, value: item }),
      searchParams,
    )
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce<SearchParamsRecord>(
      (acc, [childKey, childValue]) =>
        appendSearchParam({ key: `${key}[${childKey}]`, searchParams: acc, value: childValue }),
      searchParams,
    )
  }

  searchParams[key] = value === null ? '' : String(value as boolean | number | string)
  return searchParams
}
