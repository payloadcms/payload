import type { ReadonlyURLSearchParams } from 'next/navigation.js'

import * as qs from 'qs-esm'

/**
 * A utility function to parse URLSearchParams into a ParsedQs object.
 * This function is a wrapper around the `qs` library.
 * In Next.js, the `useSearchParams()` hook from `next/navigation` returns a `URLSearchParams` object.
 * This function can be used to parse that object into a more usable format.
 * @param {ReadonlyURLSearchParams} searchParams - The URLSearchParams object to parse.
 * @returns {qs.ParsedQs} - The parsed query string object.
 */
export function parseSearchParams(searchParams: ReadonlyURLSearchParams): qs.ParsedQs {
  const search = searchParams.toString()

  return qs.parse(search, {
    depth: 10,
    ignoreQueryPrefix: true,
  })
}
