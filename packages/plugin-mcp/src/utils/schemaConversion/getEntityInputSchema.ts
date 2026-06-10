import {
  type CollectionSlug,
  entityToStandaloneJSONSchema,
  type GlobalSlug,
  type PayloadRequest,
  type SanitizedCollectionConfig,
  type SanitizedGlobalConfig,
} from 'payload'

import type { JsonSchemaType } from '../../types.js'

import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
} from '../getVirtualFieldNames.js'
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

  return buildEntityInputSchema({
    entity: collection,
    req,
    virtualFieldNames: getCollectionVirtualFieldNames(req.payload.config, collectionSlug),
  })
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

  return buildEntityInputSchema({
    entity: global,
    req,
    virtualFieldNames: getGlobalVirtualFieldNames(req.payload.config, globalSlug),
  })
}

const buildEntityInputSchema = ({
  entity,
  req,
  virtualFieldNames,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  req: PayloadRequest
  virtualFieldNames: string[]
}): JsonSchemaType =>
  sanitizeEntitySchema(
    removeVirtualFieldsFromSchema(
      entityToStandaloneJSONSchema({
        config: req.payload.config,
        defaultIDType: req.payload.db.defaultIDType,
        entity,
        i18n: req.i18n,
      }) as unknown as JsonSchemaType,
      virtualFieldNames,
    ),
  )
