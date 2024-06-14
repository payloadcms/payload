import type { Collection, PayloadRequestWithData } from 'payload'

import { createDataloaderCacheKey } from 'payload'

type Arguments = {
  currentDepth?: number
  data: unknown
  depth: number
  draft: boolean
  key: number | string
  overrideAccess: boolean
  req: PayloadRequestWithData
  showHiddenFields: boolean
}

export const populate = async ({
  id,
  collection,
  currentDepth,
  data,
  depth,
  draft,
  key,
  overrideAccess,
  req,
  showHiddenFields,
}: Arguments & {
  collection: Collection
  id: number | string
}): Promise<void> => {
  const shouldPopulate = depth && currentDepth <= depth
  // usually depth is checked within recursivelyPopulateFieldsForGraphQL. But since this populate function can be called outside of that (in rest afterRead node hooks) we need to check here too
  if (!shouldPopulate) {
    return
  }

  const dataRef = data as Record<string, unknown>

  const doc = await req.payloadDataLoader.load(
    createDataloaderCacheKey({
      collectionSlug: collection.config.slug,
      currentDepth: currentDepth + 1,
      depth,
      docID: id as string,
      draft,
      fallbackLocale: req.fallbackLocale,
      locale: req.locale,
      overrideAccess,
      showHiddenFields,
      transactionID: req.transactionID,
    }),
  )

  if (doc) {
    dataRef[key] = doc
  } else {
    dataRef[key] = null
  }
}
