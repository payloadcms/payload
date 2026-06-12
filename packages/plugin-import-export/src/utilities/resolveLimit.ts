import type { PayloadRequest } from 'payload'

import type { Limit } from '../types.js'

/**
 * Resolves a Limit value to a number.
 * If the value is a function, it will be called with the request context.
 * If the value is a number, it will be returned as-is.
 * If the value is undefined, undefined will be returned.
 *
 * Note: A resolved value of 0 means unlimited (no restriction).
 */
export async function resolveLimit(args: {
  limit?: Limit
  req: PayloadRequest
}): Promise<number | undefined> {
  const { limit, req } = args

  if (limit === undefined) {
    return undefined
  }

  if (typeof limit === 'number') {
    return limit
  }

  return limit({ req })
}
