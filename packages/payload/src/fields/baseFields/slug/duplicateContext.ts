import type { RequestContext } from '../../../index.js'

const CONTEXT_KEY = '_slugDuplicateFallbackFields'

/**
 * Bridges the duplicate flow across two hooks that run in the same request. `beforeDuplicate` marks
 * a slug field here; the `beforeChange` that runs when the copy is created reads the mark and skips
 * source derivation, so the copy falls back to its own new id instead of a drifting `<original>-N`
 * slug that looks like it belongs to the source document.
 */
export const markSlugForDuplicateFallback = (context: RequestContext, name: string): void => {
  const fields = (context[CONTEXT_KEY] as Record<string, boolean> | undefined) ?? {}
  fields[name] = true
  context[CONTEXT_KEY] = fields
}

/** Reads and clears the mark, so it cannot leak into a later operation on the same request. */
export const consumeSlugDuplicateFallback = (context: RequestContext, name: string): boolean => {
  const fields = context[CONTEXT_KEY] as Record<string, boolean> | undefined

  if (!fields?.[name]) {
    return false
  }

  delete fields[name]
  return true
}
