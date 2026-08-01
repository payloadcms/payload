import {
  type CollectionSlug,
  getPayloadOperation,
  type GlobalSlug,
  type PayloadRequest,
  type SanitizedCollectionPermission,
  type SanitizedGlobalPermission,
} from 'payload'

import type { JsonSchemaType } from '../../types.js'

import { sanitizeEntitySchema } from './sanitizeEntitySchema.js'

const createOperation = getPayloadOperation('collection', 'create')
const updateGlobalOperation = getPayloadOperation('global', 'update')

/**
 * MCP applies presentation-only schema compaction after asking the core operation layer for the
 * canonical entity input schema.
 */
export const getCollectionInputSchema = ({
  collectionSlug,
  permissions,
  req,
}: {
  collectionSlug: CollectionSlug
  permissions?: SanitizedCollectionPermission
  req: PayloadRequest
}): JsonSchemaType | null => {
  const schema = createOperation.getDataSchema!({
    context: req.payload,
    input: {
      collection: collectionSlug,
      data: {},
      depth: 0,
      draft: false,
      req,
    },
    permissions,
  })

  return schema ? sanitizeEntitySchema(schema as JsonSchemaType) : null
}

export const getGlobalInputSchema = ({
  globalSlug,
  permissions,
  req,
}: {
  globalSlug: GlobalSlug
  permissions?: SanitizedGlobalPermission
  req: PayloadRequest
}): JsonSchemaType | null => {
  const schema = updateGlobalOperation.getDataSchema!({
    context: req.payload,
    input: {
      slug: globalSlug,
      data: {},
      depth: 0,
      draft: false,
      req,
    },
    permissions,
  })

  return schema ? sanitizeEntitySchema(schema as JsonSchemaType) : null
}
