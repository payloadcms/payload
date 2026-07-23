import type { FieldHook } from '../../config/types.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { markSlugForDuplicateFallback } from './duplicateContext.js'
import { hasValue } from './hasValue.js'

type Args = {
  name: string
  required?: boolean
}

/**
 * `beforeDuplicate` hook for the native `slug` field. A copy can't keep the original's unique slug,
 * and the default ` - Copy` suffix isn't a valid slug and reads as if it points at the source.
 *
 * So the copy takes its own new id: the slug is cleared and marked so the create's `beforeChange`
 * skips source derivation and the id fallback backfills it. A required slug can't defer to that
 * fallback (pre-insert validation rejects the empty value), so it dedupes the original through
 * {@link getUniqueFieldValue} instead.
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
