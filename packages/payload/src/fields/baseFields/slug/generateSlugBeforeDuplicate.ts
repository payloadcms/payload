import type { FieldHook } from '../../config/types.js'

import { markSlugForDuplicateFallback } from './duplicateContext.js'

type Args = {
  name: string
}

/**
 * `beforeDuplicate` hook for the native `slug` field.
 *
 * A copy can't reuse the original's unique slug, so it's cleared and marked — the create's
 * `beforeChange` then skips source derivation and the copy falls back to its own new id (see
 * {@link generateSlugIdFallback}) rather than a slug derived from the copied source.
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
