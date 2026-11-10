import type { PayloadRequest } from '../../types/index.js'

/**
 * A copy of `req` without its query string, for transformers that must apply only saved state.
 * The caller keeps the real `req` for access checks and file retrieval.
 *
 * A REST `req` is a native `Request` with Payload's fields assigned onto it, so the copy is a new
 * native `Request` for the URL without its query. Native operations such as `clone()` then work
 * and cannot bring the query back, and writes to the copy never reach the caller. The copy keeps
 * the caller's method, headers and abort signal, but not a body: file requests have none.
 */
export function withoutRequestParams({ req }: { req: PayloadRequest }): PayloadRequest {
  const url = new URL(req.url!)
  url.search = ''

  const isNativeRequest = req instanceof Request
  const copy = isNativeRequest
    ? new Request(url, { headers: req.headers, method: req.method, signal: req.signal })
    : {}

  return Object.assign(copy, req, {
    href: url.href,
    query: {},
    search: '',
    searchParams: url.searchParams,
    // A native `Request` derives `url` from its constructor; it cannot be assigned.
    ...(!isNativeRequest && { url: url.href }),
  }) as PayloadRequest
}
