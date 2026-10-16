import type { RequestContext } from '../../../index.js'

const CONTEXT_KEY = '_slugDuplicateFallbackFields'

/**
 * Bridges the two hooks in a duplicate: `beforeDuplicate` marks a slug field, and the copy's
 * `beforeChange` reads the mark to take a fresh `<singular>-<N>` fallback — skipping both the
 * explicit-collision check (the copy isn't a user-typed value) and source derivation (which would
 * drift toward the original's slug).
 */
export const markSlugForDuplicateFallback = (context: RequestContext, name: string): void => {
  const fields = (context[CONTEXT_KEY] as Record<string, boolean> | undefined) ?? {}
  fields[name] = true
  context[CONTEXT_KEY] = fields
}

/** Reads and clears the mark so it can't leak into a later operation on the same request. */
export const consumeSlugDuplicateFallback = (context: RequestContext, name: string): boolean => {
  const fields = context[CONTEXT_KEY] as Record<string, boolean> | undefined

  if (!fields?.[name]) {
    return false
  }

  delete fields[name]
  return true
}
