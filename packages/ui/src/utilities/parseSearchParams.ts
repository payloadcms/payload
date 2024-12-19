import type { ReadonlyURLSearchParams } from 'next/navigation.js'

import * as qs from 'qs-esm'

export function parseSearchParams(params: ReadonlyURLSearchParams): qs.ParsedQs {
  const search = params.toString()

  return qs.parse(search, {
    depth: 10,
    ignoreQueryPrefix: true,
  })
}
