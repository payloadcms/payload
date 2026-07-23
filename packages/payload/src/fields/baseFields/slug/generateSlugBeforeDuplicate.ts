import type { FieldHook } from '../../config/types.js'

import { ensureUniqueSlug } from './ensureUniqueSlug.js'
import { hasValue } from './hasValue.js'

type Args = {
  name: string
}

/**
 * `beforeDuplicate` hook for the native `slug` field.
 *
 * A slug is unique, so a duplicated document cannot keep the original's slug. The default
 * `beforeDuplicate` for unique text fields appends ` - Copy`, which is not a valid slug and is never
 * checked against existing values. This instead reuses {@link ensureUniqueSlug} to append the first
 * free `-N` suffix, matching how the id fallback dedupes.
 *
 * An empty value is left untouched so the id fallback backfills the duplicate on create.
 */
export const generateSlugBeforeDuplicate =
  ({ name }: Args): FieldHook =>
  async ({ collection, req, value }) => {
    if (!collection || !hasValue(value)) {
      return undefined
    }

    return ensureUniqueSlug({ name, collection: collection.slug, req, value: String(value) })
  }
