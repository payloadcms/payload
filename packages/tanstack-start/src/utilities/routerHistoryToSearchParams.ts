import { getRouterInstance } from '@tanstack/react-start'

export type ViewSearchParams = Record<string, string | string[]>

/**
 * Builds the `searchParams` record admin views receive from the URL's query
 * string, matching what Next.js passes: keys stay as written (`operation[0]`,
 * `filter[op]`), and a repeated key becomes a `string[]`.
 *
 * The loader's `location.searchStr` can't be used directly: the router rebuilds
 * it from the parsed search with `payloadStringifySearch`, which turns a
 * repeated key (`operation=a&operation=b`) into indexed keys
 * (`operation[0]=a&operation[1]=b`). The router's history still holds the query
 * string as written (on the server, the request URL's), so it is read from
 * there whenever it belongs to the location being loaded. A preload loads a
 * location the history hasn't moved to yet, so it falls back to
 * `location.searchStr`, which is the query string that navigation writes. So
 * does a loader that runs without a router instance, e.g. outside the Start
 * runtime.
 *
 * Returns synchronously whenever it can, so client navigations call `load` in
 * the same tick. On the server the Start context only hands out the router as
 * a Promise, so the result is a Promise there.
 */
export const routerHistoryToSearchParams = ({
  searchStr,
}: {
  /** The loader's `location.searchStr`. */
  searchStr: string
}): Promise<ViewSearchParams> | ViewSearchParams => {
  const router = getRouterInstanceIfAvailable()

  if (!router) {
    return searchStringToRecord({ searchStr })
  }

  if (router instanceof Promise) {
    return router.then((resolvedRouter) =>
      routerToSearchParams({ router: resolvedRouter, searchStr }),
    )
  }

  return routerToSearchParams({ router, searchStr })
}

/** `getRouterInstance` throws on the server when there is no Start context. */
const getRouterInstanceIfAvailable = () => {
  try {
    return getRouterInstance()
  } catch {
    return undefined
  }
}

const routerToSearchParams = ({
  router,
  searchStr,
}: {
  router: Awaited<ReturnType<typeof getRouterInstance>>
  searchStr: string
}): ViewSearchParams => {
  const historySearchStr = router.history.location.search

  const isHistoryAtLocation =
    router.options.stringifySearch(router.options.parseSearch(historySearchStr)) === searchStr

  return searchStringToRecord({ searchStr: isHistoryAtLocation ? historySearchStr : searchStr })
}

const searchStringToRecord = ({ searchStr }: { searchStr: string }): ViewSearchParams => {
  const params = new URLSearchParams(searchStr)
  const record: ViewSearchParams = {}

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    record[key] = values.length > 1 ? values : (values[0] ?? '')
  }

  return record
}
