import {
  type CollectionSlug,
  entityToStandaloneJSONSchema,
  type GlobalSlug,
  type PayloadRequest,
  type SanitizedCollectionConfig,
  type SanitizedGlobalConfig,
} from 'payload'

import type { JsonSchemaType } from '../../types.js'

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

  return buildEntityInputSchema({ entity: collection, req })
}

export const getGlobalInputSchema = ({
  globalSlug,
  req,
}: {
  globalSlug: GlobalSlug
  req: PayloadRequest
}): JsonSchemaType | null => {
  const global = req.payload.config.globals.find((globalConfig) => globalConfig.slug === globalSlug)

  if (!global) {
    return null
  }

  return buildEntityInputSchema({ entity: global, req })
}

const buildEntityInputSchema = ({
  entity,
  req,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  req: PayloadRequest
}): JsonSchemaType =>
  // The `input` variant is already the write shape; sanitizeEntitySchema only adds MCP-specific passes.
  sanitizeEntitySchema(
    entityToStandaloneJSONSchema({
      config: req.payload.config,
      defaultIDType: req.payload.db.defaultIDType,
      entity,
      i18n: req.i18n,
      variant: 'input',
    }) as unknown as JsonSchemaType,
  )
