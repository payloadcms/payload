import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { createDataloaderCacheKey } from '../../../collections/dataloader.js'
import { getFieldByPath } from '../../../utilities/getFieldByPath.js'

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

export const virtualFieldPopulationPromise = ({
  name,
  collection,
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
  collection: SanitizedCollectionConfig
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
  const relationshipField = getFieldByPath({
    fields: collection.flattenedFields,
    path: relationshipPath,
  })

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

  if (typeof relationshipValue !== 'number' || typeof relationshipValue !== 'string') {
    return
  }

  const populatedDoc: any = null

  createDataloaderCacheKey({
    collectionSlug: relationTo,
    currentDepth: 0,
    depth: 0,
    docID: relationshipValue,
    draft,
    fallbackLocale,
    locale,
    overrideAccess,
    select: {},
    showHiddenFields,
    transactionID: req.transactionID as number,
  })
}
