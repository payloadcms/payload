import type { ReadonlyURLSearchParams } from 'next/navigation.js'
import type { ListQuery } from 'payload'

import * as qs from 'qs-esm'

/**
 * A utility function to parse URLSearchParams into a ParsedQs object.
 * This function is a wrapper around the `qs` library.
 * In Next.js, the `useSearchParams()` hook from `next/navigation` returns a `URLSearchParams` object.
 * This function can be used to parse that object into a more usable format.
 * @param {ReadonlyURLSearchParams} searchParams - The URLSearchParams object to parse.
 * @returns {ListQuery} - The parsed query string object.
 */
export function parseSearchParams(searchParams: ReadonlyURLSearchParams): ListQuery {
  const search = searchParams.toString()

  const parsed = qs.parse(search, {
    depth: 10,
    ignoreQueryPrefix: true,
  }) as ListQuery

  // now sanitize some parameters string to numbers where needed, e.g. page, limit, etc.
  const numberParams = ['page', 'limit']

  for (const param of numberParams) {
    if (parsed[param] && typeof parsed[param] === 'string' && !isNaN(Number(parsed[param]))) {
      parsed[param] = Number(parsed[param])
    }
  }

  return parsed
}
