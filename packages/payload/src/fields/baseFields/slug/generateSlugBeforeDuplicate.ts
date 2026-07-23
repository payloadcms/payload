import type { FieldHook } from '../../config/types.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { markSlugForDuplicateFallback } from './duplicateContext.js'
import { hasValue } from './hasValue.js'

type Args = {
  name: string
  required?: boolean
}

/**
 * `beforeDuplicate` hook for the native `slug` field.
 *
 * A copy can't reuse the original's unique slug, so it's cleared and marked — the create's
 * `beforeChange` then skips source derivation and the copy falls back to its own new id (see
 * {@link generateSlugIdFallback}). A required slug can't defer to that fallback (validation rejects
 * the empty value first), so it dedupes the original value via {@link getUniqueFieldValue} instead.
 */
export const generateSlugBeforeDuplicate =
  ({ name, required }: Args): FieldHook =>
  async ({ collection, context, req, value }) => {
    if (!collection) {
      return undefined
    }

    if (required) {
      return hasValue(value)
        ? await getUniqueFieldValue({
            collection: collection.slug,
            field: name,
            req,
            value: String(value),
          })
        : undefined
    }

    markSlugForDuplicateFallback(context, name)
    return ''
  }
