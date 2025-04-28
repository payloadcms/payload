import type { PayloadRequest } from '../../../types/index.js'
import type { FlattenedField } from '../../config/types.js'

import { createDataloaderCacheKey } from '../../../collections/dataloader.js'

export const virtualFieldPopulationPromise = async ({
  name,
  draft,
  fallbackLocale,
  fields,
  locale,
  overrideAccess,
  ref,
  req,
  segments,
  showHiddenFields,
  siblingDoc,
}: {
  draft: boolean
  fallbackLocale: string
  fields: FlattenedField[]
  locale: string
  name: string
  overrideAccess: boolean
  ref: any
  req: PayloadRequest
  segments: string[]
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}): Promise<void> => {
  const currentSegment = segments.shift()

  if (!currentSegment) {
    return
  }

  const currentValue = ref[currentSegment]

  if (typeof currentValue === 'undefined') {
    return
  }

  // Final step
  if (segments.length === 0) {
    siblingDoc[name] = currentValue
    return
  }

  const currentField = fields.find((each) => each.name === currentSegment)

  if (!currentField) {
    return
  }

  if (currentField.type === 'group' || currentField.type === 'tab') {
    if (!currentValue || typeof currentValue !== 'object') {
      return
    }

    return virtualFieldPopulationPromise({
      name,
      draft,
      fallbackLocale,
      fields: currentField.flattenedFields,
      locale,
      overrideAccess,
      ref: currentValue,
      req,
      segments,
      showHiddenFields,
      siblingDoc,
    })
  }

  if (
    (currentField.type === 'relationship' || currentField.type === 'upload') &&
    typeof currentField.relationTo === 'string' &&
    !currentField.hasMany
  ) {
    let docID: number | string

    if (typeof currentValue === 'object' && currentValue) {
      docID = currentValue.id
    } else {
      docID = currentValue
    }

    if (segments[0] === 'id' && segments.length === 0) {
      siblingDoc[name] = docID
      return
    }

    if (typeof docID !== 'string' && typeof docID !== 'number') {
      return
    }

    const select = {}
    let currentSelectRef: any = select
    const currentFields = req.payload.collections[currentField.relationTo].config.flattenedFields

    for (let i = 0; i < segments.length; i++) {
      const field = currentFields.find((each) => each.name === segments[i])

      const shouldBreak =
        i === segments.length - 1 || field?.type === 'relationship' || field?.type === 'upload'

      currentSelectRef[segments[i]] = shouldBreak ? true : {}
      currentSelectRef = currentSelectRef[segments[i]]

      if (shouldBreak) {
        break
      }
    }

    const populatedDoc = await req.payloadDataLoader.load(
      createDataloaderCacheKey({
        collectionSlug: currentField.relationTo,
        currentDepth: 0,
        depth: 0,
        docID,
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

    return virtualFieldPopulationPromise({
      name,
      draft,
      fallbackLocale,
      fields: req.payload.collections[currentField.relationTo].config.flattenedFields,
      locale,
      overrideAccess,
      ref: populatedDoc,
      req,
      segments,
      showHiddenFields,
      siblingDoc,
    })
  }
}
