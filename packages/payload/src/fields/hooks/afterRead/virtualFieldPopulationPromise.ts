import type { PayloadRequest } from '../../../types/index.js'

import { createDataloaderCacheKey } from '../../../collections/dataloader.js'

const getValueByPath = ({ object, path }: { object: any; path: string }): any => {
  let currentValue = object

  for (const segment of path.split('.')) {
    const current = object[segment]

    if (typeof current === 'undefined') {
      return
    }

    currentValue = current
  }

  return currentValue
}

export const virtualFieldPopulationPromise = async ({
  name,
  doc,
  draft,
  fallbackLocale,
  fieldPath,
  locale,
  overrideAccess,
  relationshipPath,
  relationTo,
  req,
  showHiddenFields,
  siblingDoc,
}: {
  doc: any
  draft: boolean
  fallbackLocale: string
  fieldPath: string
  locale: string
  name: string
  overrideAccess: boolean
  relationshipPath: string
  relationTo: string
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}) => {
  const relationshipValue = getValueByPath({ object: doc, path: relationshipPath })

  if (!relationshipValue) {
    return
  }

  if (typeof relationshipValue === 'object') {
    const fieldValue = getValueByPath({ object: relationshipValue, path: fieldPath })

    if (typeof fieldValue !== 'undefined') {
      siblingDoc[name] = fieldValue
      return
    }
  }

  if (typeof relationshipValue !== 'number' && typeof relationshipValue !== 'string') {
    return
  }

  // Build select with only that field
  const select = {}
  let currentSelectRef: any = select

  const segments = fieldPath.split('.')

  for (let i = 0; i < segments.length; i++) {
    currentSelectRef[segments[i]] = i === segments.length - 1 ? true : {}
    currentSelectRef = currentSelectRef[segments[i]]
  }

  const populatedDoc = await req.payloadDataLoader.load(
    createDataloaderCacheKey({
      collectionSlug: relationTo,
      currentDepth: 0,
      depth: 0,
      docID: relationshipValue,
      draft,
      fallbackLocale,
      locale,
      overrideAccess,
      select,
      showHiddenFields,
      transactionID: req.transactionID as number,
    }),
  )

  if (!populatedDoc) {
    return
  }

  const fieldValue = getValueByPath({ object: populatedDoc, path: fieldPath })

  if (typeof fieldValue !== 'undefined') {
    siblingDoc[name] = fieldValue
  }
}
