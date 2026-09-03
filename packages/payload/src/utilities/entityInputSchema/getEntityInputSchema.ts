import type {
  CollectionSlug,
  FlattenedField,
  GlobalSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from '../../index.js'
import type { EntityInputSchema } from './types.js'

import { entityToStandaloneJSONSchema } from '../configToJSONSchema.js'
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
}): EntityInputSchema | null => {
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
}): EntityInputSchema | null => {
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
}): EntityInputSchema => {
  // The core schema generator reads flattenedFields from the entity and has no fields argument.
  const entityForSchema = { ...entity, flattenedFields: fields }
  const schema = entityToStandaloneJSONSchema({
    config: req.payload.config,
    defaultIDType: req.payload.db.defaultIDType,
    entity: entityForSchema,
    i18n: req.i18n,
    variant: 'input',
  }) as unknown as EntityInputSchema

  return sanitizeEntitySchema(schema)
}
