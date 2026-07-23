import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { hasDraftsEnabled } from '../../../utilities/getVersionsConfig.js'

type Args = {
  collection: SanitizedCollectionConfig
  field: string
  /** Exclude this doc from the check, so a regenerate can reuse its own value. */
  id?: number | string
  /** Locale to scope the uniqueness check to, for a localized slug. */
  locale?: string
  req: PayloadRequest
  value: string
}

/**
 * The first available slug for `value` in `collection` — the bare value, or `value-N` if taken.
 * Mirrors the `beforeChange` hook's source-derived dedupe so the regenerate server function hands
 * back the same unique value the next save would produce. See {@link getUniqueFieldValue}.
 */
export const getUniqueSlugValue = async ({
  id,
  collection,
  field,
  locale,
  req,
  value,
}: Args): Promise<string> =>
  getUniqueFieldValue({
    id,
    collection: collection.slug,
    draftsEnabled: hasDraftsEnabled(collection),
    field,
    locale,
    req,
    value,
  })
