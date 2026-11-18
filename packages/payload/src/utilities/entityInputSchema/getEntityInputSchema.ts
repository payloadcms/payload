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
  shouldKeepDeprecatedProperties,
}: {
  collectionSlug: CollectionSlug
  permissions?: SanitizedCollectionPermission
  req: PayloadRequest
  /**
   * Keep optional properties marked `deprecated`, which are hidden from agents by default. Pass
   * `true` when validating input, so existing data that still contains them stays valid.
   */
  shouldKeepDeprecatedProperties?: boolean
}): EntityInputSchema | null => {
  const collection = req.payload.collections[collectionSlug]?.config

  if (!collection) {
    return null
  }

  if (!permissions) {
    return buildEntityInputSchema({ entity: collection, req, shouldKeepDeprecatedProperties })
  }

  const fieldsAllowedByAccess = filterFieldsByAccess({
    blocks: req.payload.config.blocks,
    fields: collection.flattenedFields,
    permissions,
    shouldExcludeField: ({ create, update }) => !create && !update,
  })

  return buildEntityInputSchema({
    entity: collection,
    fields: fieldsAllowedByAccess,
    req,
    shouldKeepDeprecatedProperties,
  })
}

export const getGlobalInputSchema = ({
  globalSlug,
  permissions,
  req,
  shouldKeepDeprecatedProperties,
}: {
  globalSlug: GlobalSlug
  permissions?: SanitizedGlobalPermission
  req: PayloadRequest
  /**
   * Keep optional properties marked `deprecated`, which are hidden from agents by default. Pass
   * `true` when validating input, so existing data that still contains them stays valid.
   */
  shouldKeepDeprecatedProperties?: boolean
}): EntityInputSchema | null => {
  const global = req.payload.config.globals.find((globalConfig) => globalConfig.slug === globalSlug)

  if (!global) {
    return null
  }

  if (!permissions) {
    return buildEntityInputSchema({ entity: global, req, shouldKeepDeprecatedProperties })
  }

  const fieldsAllowedByAccess = filterFieldsByAccess({
    blocks: req.payload.config.blocks,
    fields: global.flattenedFields,
    permissions,
    shouldExcludeField: ({ create, update }) => !create && !update,
  })

  return buildEntityInputSchema({
    entity: global,
    fields: fieldsAllowedByAccess,
    req,
    shouldKeepDeprecatedProperties,
  })
}

const buildEntityInputSchema = ({
  entity,
  fields = entity.flattenedFields,
  req,
  shouldKeepDeprecatedProperties,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  fields?: FlattenedField[]
  req: PayloadRequest
  shouldKeepDeprecatedProperties?: boolean
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

  return sanitizeEntitySchema({ schema, shouldKeepDeprecatedProperties })
}
