import type { Collection, Field, PayloadRequest, RichTextField, SelectType } from 'payload'

import { createDataloaderCacheKey } from 'payload'

import type { AdapterArguments } from '../types.js'

type Arguments = {
  currentDepth?: number
  data: unknown
  depth: number
  draft: boolean
  field: RichTextField<any[], AdapterArguments, AdapterArguments>
  key: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  select?: SelectType
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
  select,
  showHiddenFields,
}: {
  collection: Collection
  field: Field
  id: string
} & Omit<Arguments, 'field'>): Promise<void> => {
  const dataRef = data as Record<string, unknown>

  const doc = await req.payloadDataLoader.load(
    createDataloaderCacheKey({
      collectionSlug: collection.config.slug,
      currentDepth: currentDepth + 1,
      depth,
      docID: id,
      draft,
      fallbackLocale: req.locale,
      locale: req.fallbackLocale,
      overrideAccess: typeof overrideAccess === 'undefined' ? false : overrideAccess,
      select,
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
