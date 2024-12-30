import type { PayloadRequest, SelectType } from 'payload'

import { createDataloaderCacheKey } from 'payload'

type Arguments = {
  currentDepth?: number
  data: unknown
  depth: number
  draft: boolean
  key: number | string
  overrideAccess: boolean
  req: PayloadRequest
  select?: SelectType
  showHiddenFields: boolean
}

export const populate = async ({
  id,
  collectionSlug,
  currentDepth,
  data,
  depth,
  draft,
  key,
  overrideAccess,
  req,
  select,
  showHiddenFields,
}: {
  collectionSlug: string
  id: number | string
} & Arguments): Promise<void> => {
  const shouldPopulate = depth && currentDepth! <= depth
  // usually depth is checked within recursivelyPopulateFieldsForGraphQL. But since this populate function can be called outside of that (in rest afterRead node hooks) we need to check here too
  if (!shouldPopulate) {
    return
  }

  const dataRef = data as Record<string, unknown>

  const doc = await req.payloadDataLoader?.load(
    createDataloaderCacheKey({
      collectionSlug,
      currentDepth: currentDepth! + 1,
      depth,
      docID: id as string,
      draft,
      fallbackLocale: req.fallbackLocale!,
      locale: req.locale!,
      overrideAccess,
      select,
      showHiddenFields,
      transactionID: req.transactionID!,
    }),
  )

  if (doc) {
    dataRef[key] = doc
  } else {
    dataRef[key] = null
  }
}
