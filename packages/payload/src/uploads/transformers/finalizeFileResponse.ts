import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { headersWithCors } from '../../utilities/headersWithCors.js'

const MANDATORY_CORS_HEADER_NAMES = [
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Credentials',
]

/**
 * The single header pass for the dynamic-transform response path. Unlike the
 * existing `serve` path — where a collection's `modifyResponseHeaders` can still
 * win on any header it touches, including CORS — mandatory CORS and security
 * headers are asserted last here, so they are never overridable.
 */
export function finalizeFileResponse({
  collection,
  req,
  response,
}: {
  collection: Collection
  req: PayloadRequest
  response: Response
}): Response {
  const headers = new Headers(response.headers)
  const isSvg = headers.get('Content-Type') === 'image/svg+xml'

  const modifyResponseHeaders = collection.config.upload
    ? collection.config.upload.modifyResponseHeaders
    : undefined

  const modifiedHeaders =
    typeof modifyResponseHeaders === 'function'
      ? modifyResponseHeaders({ headers }) || headers
      : headers

  if (isSvg) {
    modifiedHeaders.set('Content-Security-Policy', "script-src 'none'")
  }

  for (const corsHeaderName of MANDATORY_CORS_HEADER_NAMES) {
    modifiedHeaders.delete(corsHeaderName)
  }

  const finalHeaders = headersWithCors({ headers: modifiedHeaders, req })

  const body = req.method === 'HEAD' ? null : response.body

  return new Response(body, {
    headers: finalHeaders,
    status: response.status,
    statusText: response.statusText,
  })
}
