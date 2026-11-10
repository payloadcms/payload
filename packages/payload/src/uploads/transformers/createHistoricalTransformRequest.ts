import type { PayloadRequest } from '../../types/index.js'

/**
 * The request that transformers get while they build a historical file. A historical file shows a
 * saved state, so the request has no query parameters that could change the file.
 *
 * Its contract is limited to a file request:
 * - It has no body. A file request is a GET request, so it has none to keep.
 * - Its query string is removed from `url`, `href`, `search`, `searchParams` and `query`.
 * - It is a new native `Request` when `req` is one, so `clone()` and `new Request()` work and do
 *   not bring the query back. It keeps the method, headers and abort signal of `req`.
 * - A top-level assignment, such as `historicalReq.query = {}`, stays on this request.
 * - Objects such as `context`, `user` and `payload` are shared with `req`, so a change inside
 *   one of them also changes `req`.
 *
 * The caller keeps `req` for access checks and storage.
 */
export function createHistoricalTransformRequest({ req }: { req: PayloadRequest }): PayloadRequest {
  const url = new URL(req.url!)
  url.search = ''

  const isNativeRequest = req instanceof Request
  const historicalReq = isNativeRequest
    ? new Request(url, { headers: req.headers, method: req.method, signal: req.signal })
    : {}

  return Object.assign(historicalReq, req, {
    href: url.href,
    query: {},
    search: '',
    searchParams: url.searchParams,
    // A native `Request` derives `url` from its constructor; it cannot be assigned.
    ...(!isNativeRequest && { url: url.href }),
  }) as PayloadRequest
}
