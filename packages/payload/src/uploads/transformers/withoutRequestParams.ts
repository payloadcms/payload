import type { PayloadRequest } from '../../types/index.js'

/**
 * A view of `req` without its query string, for transformers that must apply only saved state.
 * The caller keeps the real `req` for access checks and file retrieval.
 *
 * Uses a Proxy, rather than cloning `req`, because `req` is a native `Request` at runtime. Its
 * accessors are brand-checked against `req`'s internal slots, so a plain clone throws once a
 * handler reads one of them.
 */
export function withoutRequestParams({ req }: { req: PayloadRequest }): PayloadRequest {
  const overrides = new Map<PropertyKey, unknown>([
    ['query', {}],
    ['search', ''],
    ['searchParams', new URLSearchParams()],
  ])

  for (const urlProperty of ['href', 'url'] as const) {
    if (req[urlProperty]) {
      const url = new URL(req[urlProperty])
      url.search = ''
      overrides.set(urlProperty, url.href)
    }
  }

  return new Proxy(req, {
    get(target, prop) {
      return overrides.has(prop) ? overrides.get(prop) : Reflect.get(target, prop, target)
    },
  })
}
