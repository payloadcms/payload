import { match, type MatchFunction } from 'path-to-regexp'

import type { Endpoint } from '../config/types.js'

export type CompiledEndpoint = {
  matcher: MatchFunction<Record<string, unknown>>
} & Endpoint

const compiledEndpointsCache = new WeakMap<Endpoint[], CompiledEndpoint[]>()

/**
 * Compiles each endpoint's `path` into a path-to-regexp matcher once and caches the result by
 * the endpoints array's identity. Collection/global endpoint arrays are stable references after
 * config sanitization, so this compiles once per collection/global per process lifetime instead
 * of recompiling every candidate's matcher on every request in `handleEndpoints`.
 */
export const compileEndpoints = (endpoints: Endpoint[]): CompiledEndpoint[] => {
  const cached = compiledEndpointsCache.get(endpoints)

  if (cached) {
    return cached
  }

  const compiled = endpoints.map(
    (endpoint): CompiledEndpoint => ({
      ...endpoint,
      matcher: match(endpoint.path, { decode: decodeURIComponent }),
    }),
  )

  compiledEndpointsCache.set(endpoints, compiled)

  return compiled
}
