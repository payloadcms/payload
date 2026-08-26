import {
  type CollectionSlug,
  entityToStandaloneJSONSchema,
  type FlattenedField,
  type GlobalSlug,
  type PayloadRequest,
  type SanitizedCollectionConfig,
  type SanitizedCollectionPermission,
  type SanitizedGlobalConfig,
  type SanitizedGlobalPermission,
} from 'payload'

import type { JsonSchemaType } from '../../types.js'

import { filterFieldsByAccess } from './filterFieldsByAccess.js'
import { sanitizeEntitySchema } from './sanitizeEntitySchema.js'

export const getCollectionInputSchema = ({
  collectionSlug,
  permissions,
  req,
}: {
  collectionSlug: CollectionSlug
  permissions?: SanitizedCollectionPermission
  req: PayloadRequest
}): JsonSchemaType | null => {
  const collection = req.payload.collections[collectionSlug]?.config

  if (!collection) {
    return null
  }

  if (!permissions) {
    return buildEntityInputSchema({ entity: collection, req })
  }

  const fieldsAllowedByAccess = filterFieldsByAccess({
    blocks: req.payload.config.blocks,
    fields: collection.flattenedFields,
    permissions,
    shouldExcludeField: ({ create, update }) => !create && !update,
  })

  return buildEntityInputSchema({ entity: collection, fields: fieldsAllowedByAccess, req })
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
  const global = req.payload.config.globals.find((globalConfig) => globalConfig.slug === globalSlug)

  if (!global) {
    return null
  }

  if (!permissions) {
    return buildEntityInputSchema({ entity: global, req })
  }

  const fieldsAllowedByAccess = filterFieldsByAccess({
    blocks: req.payload.config.blocks,
    fields: global.flattenedFields,
    permissions,
    shouldExcludeField: ({ create, update }) => !create && !update,
  })

  return buildEntityInputSchema({ entity: global, fields: fieldsAllowedByAccess, req })
}

const buildEntityInputSchema = ({
  entity,
  fields = entity.flattenedFields,
  req,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  fields?: FlattenedField[]
  req: PayloadRequest
}): JsonSchemaType => {
  // The core schema generator reads flattenedFields from the entity and has no fields argument.
  const entityForSchema = { ...entity, flattenedFields: fields }
  const schema = entityToStandaloneJSONSchema({
    config: req.payload.config,
    defaultIDType: req.payload.db.defaultIDType,
    entity: entityForSchema,
    i18n: req.i18n,
    variant: 'input',
  }) as unknown as JsonSchemaType

  return sanitizeEntitySchema(schema)
}
