import { type CollectionSlug, entityToStandaloneJSONSchema, type PayloadRequest } from 'payload'

import type { JsonSchemaType } from '../../types.js'

import { getCollectionVirtualFieldNames } from '../getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from './removeVirtualFieldsFromSchema.js'
import { sanitizeEntitySchema } from './sanitizeEntitySchema.js'

export const getCollectionInputSchema = ({
  collectionSlug,
  req,
}: {
  collectionSlug: CollectionSlug
  req: PayloadRequest
}): JsonSchemaType | null => {
  const collection = req.payload.collections[collectionSlug]?.config

  if (!collection) {
    return null
  }

  const collectionSchema = removeVirtualFieldsFromSchema(
    entityToStandaloneJSONSchema({
      config: req.payload.config,
      defaultIDType: req.payload.db.defaultIDType,
      entity: collection,
      i18n: req.i18n,
    }) as unknown as JsonSchemaType,
    getCollectionVirtualFieldNames(req.payload.config, collectionSlug),
  )

  return sanitizeEntitySchema(collectionSchema)
}
