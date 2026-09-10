import type { PayloadRequest, ReadVersion, SelectType } from 'payload'

import { createDataloaderCacheKey } from 'payload'

type PopulateArguments = {
  collectionSlug: string
  currentDepth?: number
  data: unknown
  depth: number
  id: number | string
  key: number | string
  overrideAccess: boolean
  req: PayloadRequest
  select?: SelectType
  showHiddenFields: boolean
  version?: ReadVersion
}

type PopulateFn = (args: PopulateArguments) => Promise<void>

export const populate: PopulateFn = async ({
  id,
  collectionSlug,
  currentDepth,
  data,
  depth,
  key,
  overrideAccess,
  req,
  select,
  showHiddenFields,
  version,
}) => {
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
      fallbackLocale: req.fallbackLocale!,
      locale: req.locale!,
      overrideAccess,
      select,
      showHiddenFields,
      transactionID: req.transactionID!,
      version: version ?? 'published',
    }),
  )

  if (doc) {
    dataRef[key] = doc
  } else {
    dataRef[key] = null
  }
}
