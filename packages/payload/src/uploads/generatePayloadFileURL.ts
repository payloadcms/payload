import type { Config } from '../config/types.js'

import { generateFilePathOrURL } from './generateFilePathOrURL.js'

type QueryValue = (boolean | number | string)[] | boolean | number | string | undefined

function queryToEntries(query: Record<string, QueryValue> | URLSearchParams): [string, string][] {
  if (query instanceof URLSearchParams) {
    return Array.from(query.entries())
  }

  const entries: [string, string][] = []

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          entries.push([key, String(item)])
        }
      }
      continue
    }

    entries.push([key, String(value)])
  }

  return entries
}

/**
 * Builds an access-controlled Payload file URL (`/{collectionSlug}/file/{filename}`).
 * Unlike the internal `generateFilePathOrURL`, this never inspects or returns a
 * document's possibly external `url` — it always targets the Payload-controlled
 * endpoint. `prefix` is core-owned routing context and must be passed as its own
 * argument; passing it inside `query` is rejected.
 */
export function generatePayloadFileURL({
  collectionSlug,
  config,
  filename,
  prefix,
  query,
  relative = false,
}: {
  collectionSlug: string
  config: Config
  filename: string
  /** Core-owned storage-key routing context. Not a transformer parameter. */
  prefix?: string
  /**
   * Transformer-owned query parameters. Accepts a plain record (array values are
   * serialized as repeated keys, in order) or a `URLSearchParams`, which is read
   * from without mutating the caller's instance.
   */
  query?: Record<string, QueryValue> | URLSearchParams
  relative?: boolean
}): string {
  const queryEntries = queryToEntries(query ?? {})

  if (queryEntries.some(([key]) => key === 'prefix')) {
    throw new Error(
      'generatePayloadFileURL: `prefix` is core-owned routing context. Pass it as the `prefix` argument, not inside `query`.',
    )
  }

  const params = new URLSearchParams()

  if (prefix !== undefined) {
    params.set('prefix', prefix)
  }

  for (const [key, value] of [...queryEntries].sort(([a], [b]) => a.localeCompare(b))) {
    params.append(key, value)
  }

  const queryString = params.toString()

  const url = generateFilePathOrURL({
    collectionSlug,
    config,
    filename,
    relative,
    serverURL: config.serverURL,
    urlOrPath: undefined,
  })

  if (!url) {
    throw new Error('generatePayloadFileURL: `filename` must be a non-empty string.')
  }

  return queryString ? `${url}?${queryString}` : url
}
