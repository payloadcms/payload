import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'

type Args = {
  collection: SanitizedCollectionConfig
  field: string
  req: PayloadRequest
  slugify: (value: unknown) => Promise<string | undefined> | string | undefined
}

/**
 * The slug a document falls back to when it has no source to derive from: `<singular>-<N>`, where
 * `N` is the first available integer. Uses the collection's singular label when it resolves to a
 * plain string, otherwise the collection slug. See {@link getUniqueFieldValue}.
 */
export const getSlugFallbackValue = async ({
  collection,
  field,
  req,
  slugify,
}: Args): Promise<string> => {
  const singularLabel = collection.labels?.singular
  const base = typeof singularLabel === 'string' ? singularLabel : collection.slug

  return getUniqueFieldValue({
    collection: collection.slug,
    field,
    req,
    startIndex: 1,
    value: (await slugify(base)) || collection.slug,
  })
}
