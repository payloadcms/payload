/* eslint-disable no-console */
import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  PayloadRequest,
  PopulateType,
  SelectType,
} from '../../../index.js'

import { ValidationError } from '../../../errors/ValidationError.js'
import {
  getCollectionInputSchema,
  getGlobalInputSchema,
} from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
  stripVirtualFields,
} from '../../../utilities/getVirtualFieldNames.js'
import { transformPointDataToPayload } from '../../../utilities/transformPointDataToPayload.js'

export {
  validateCollectionData,
  validateGlobalData,
} from '../../../utilities/entityInputSchema/validateEntityData.js'

export const getCollectionValidationResult = ({
  slug,
  error,
  req,
}: {
  error: unknown
  req: PayloadRequest
  slug: CollectionSlug
}) => {
  if (!(error instanceof ValidationError)) {
    return undefined
  }

  const schema = getCollectionInputSchema({ collectionSlug: slug, req })

  return { slug, errors: error.data.errors, ...(schema ? { schema } : {}) }
}

export const getGlobalValidationResult = ({
  slug,
  error,
  req,
}: {
  error: unknown
  req: PayloadRequest
  slug: GlobalSlug
}) => {
  if (!(error instanceof ValidationError)) {
    return undefined
  }

  const schema = getGlobalInputSchema({ globalSlug: slug, req })

  return { slug, errors: error.data.errors, ...(schema ? { schema } : {}) }
}

export const getCollectionSchema = ({
  slug,
  req,
}: {
  req: PayloadRequest
  slug: CollectionSlug
}) => getCollectionInputSchema({ collectionSlug: slug, req })

export const getReadOptions = (options: {
  depth: number
  fallbackLocale?: false | string
  locale?: string
  overrideAccess: boolean
  populate?: PopulateType
  select?: SelectType
  showHiddenFields?: boolean
}) => ({
  depth: options.depth,
  fallbackLocale: options.fallbackLocale,
  locale: options.locale,
  overrideAccess: options.overrideAccess,
  populate: options.populate,
  select: options.select,
  showHiddenFields: options.showHiddenFields,
})

export const prepareCollectionData = ({
  collection,
  data,
  payload,
}: {
  collection: CollectionSlug
  data: Record<string, unknown>
  payload: Payload
}): Record<string, unknown> =>
  transformPointDataToPayload(stripCollectionVirtualFields({ collection, data, payload }))

export const stripCollectionVirtualFields = ({
  collection,
  data,
  payload,
}: {
  collection: CollectionSlug
  data: Record<string, unknown>
  payload: Payload
}): Record<string, unknown> =>
  stripVirtualFields(data, getCollectionVirtualFieldNames(payload.config, collection))

export const prepareGlobalData = ({
  slug,
  data,
  payload,
}: {
  data: Record<string, unknown>
  payload: Payload
  slug: GlobalSlug
}): Record<string, unknown> =>
  transformPointDataToPayload(stripGlobalVirtualFields({ slug, data, payload }))

export const stripGlobalVirtualFields = ({
  slug,
  data,
  payload,
}: {
  data: Record<string, unknown>
  payload: Payload
  slug: GlobalSlug
}): Record<string, unknown> =>
  stripVirtualFields(data, getGlobalVirtualFieldNames(payload.config, slug))

export const printJSON = (value: unknown): void => {
  console.log(
    JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item), 2),
  )
}
