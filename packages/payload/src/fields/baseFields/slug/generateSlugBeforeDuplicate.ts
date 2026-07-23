import type { FieldHook } from '../../config/types.js'

import { markSlugForDuplicateFallback } from './duplicateContext.js'

type Args = {
  name: string
}

/**
 * `beforeDuplicate` hook for the native `slug` field.
 *
 * Clears the slug and marks it so the copy's `beforeChange` takes a fresh `<singular>-<N>` fallback
 * instead of the original's slug or a source-derived one — see {@link consumeSlugDuplicateFallback}
 * and {@link generateSlug}. Deferring to that path keeps the fallback deduped in one place.
 */
export const generateSlugBeforeDuplicate =
  ({ name }: Args): FieldHook =>
  ({ collection, context }) => {
    if (!collection) {
      return undefined
    }

    markSlugForDuplicateFallback(context, name)
    return ''
  }
