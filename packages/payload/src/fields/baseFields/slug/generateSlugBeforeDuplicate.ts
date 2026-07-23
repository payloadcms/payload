import type { FieldHook } from '../../config/types.js'

import { markSlugForDuplicateFallback } from './duplicateContext.js'
import { ensureUniqueSlug } from './ensureUniqueSlug.js'
import { hasValue } from './hasValue.js'

type Args = {
  name: string
  required?: boolean
}

/**
 * `beforeDuplicate` hook for the native `slug` field.
 *
 * A slug is unique, so a duplicated document cannot keep the original's slug. The default
 * `beforeDuplicate` for unique text fields appends ` - Copy`, which is not a valid slug.
 *
 * Instead the copy takes its own new id: the slug is cleared and marked so the create's
 * `beforeChange` skips source derivation, letting the id fallback backfill it. This avoids a
 * `<original>-N` slug that reads as if it belongs to the source document.
 *
 * A required slug cannot defer to the id fallback — pre-insert validation would reject the empty
 * value before it runs — so it keeps a value here by deduping the original through
 * {@link ensureUniqueSlug}.
 */
export const generateSlugBeforeDuplicate =
  ({ name, required }: Args): FieldHook =>
  async ({ collection, context, req, value }) => {
    if (!collection) {
      return undefined
    }

    if (required) {
      return hasValue(value)
        ? await ensureUniqueSlug({ name, collection: collection.slug, req, value: String(value) })
        : undefined
    }

    markSlugForDuplicateFallback(context, name)
    return ''
  }
