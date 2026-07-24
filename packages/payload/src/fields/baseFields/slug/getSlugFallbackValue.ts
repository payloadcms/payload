import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { DefaultDocumentIDType, Locale } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { hasDraftsEnabled } from '../../../utilities/getVersionsConfig.js'

type Args = {
  collection: SanitizedCollectionConfig
  field: string
  /** Exclude this doc from the check, so a regenerate can reuse its own value. */
  id?: DefaultDocumentIDType
  /** Locale to scope the uniqueness check to, for a localized slug. */
  locale?: Locale['code']
  req: PayloadRequest
  slugify: (value: unknown) => Promise<string | undefined> | string | undefined
}

/**
 * The slug a document falls back to when it has no source to derive from, e.g. `useAsSlug` is empty or missing.
 * The fallback is unique within the collection and locale, so two documents never claim the same value.
 * The format is: `<singular>-<N>`, where `N` is the first available integer. Uses the collection's singular
 * label when it resolves to a plain string, otherwise the collection slug. See {@link getUniqueFieldValue}.
 */
export const getSlugFallbackValue = async ({
  id,
  collection,
  field,
  locale,
  req,
  slugify,
}: Args): Promise<string> => {
  const singularLabel = collection.labels?.singular
  const base = typeof singularLabel === 'string' ? singularLabel : collection.slug

  return getUniqueFieldValue({
    id,
    collection: collection.slug,
    draftsEnabled: hasDraftsEnabled(collection),
    field,
    locale,
    req,
    startIndex: 1,
    value: (await slugify(base)) || collection.slug,
  })
}
