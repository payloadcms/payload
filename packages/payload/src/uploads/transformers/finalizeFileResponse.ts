import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isXmlMimeType } from '../getFileTypeIdentity.js'
import { uploadContentSecurityPolicy } from '../uploadContentSecurityPolicy.js'

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
  const sourceContentType = headers.get('Content-Type')

  const modifyResponseHeaders = collection.config.upload
    ? collection.config.upload.modifyResponseHeaders
    : undefined

  const modifiedHeaders =
    typeof modifyResponseHeaders === 'function'
      ? modifyResponseHeaders({ headers }) || headers
      : headers

  // Check the content type both before and after `modifyResponseHeaders`, so the hook
  // can neither introduce an XML type nor relabel one to escape the policy.
  const isXml =
    isXmlMimeType(sourceContentType) || isXmlMimeType(modifiedHeaders.get('Content-Type'))

  if (isXml) {
    modifiedHeaders.set('Content-Security-Policy', uploadContentSecurityPolicy)
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
