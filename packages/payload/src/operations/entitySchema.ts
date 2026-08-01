import type { I18n } from '@payloadcms/translations'
import type { ErrorObject } from 'ajv'
import type { JSONSchema4 } from 'json-schema'

import AjvImport from 'ajv'

import type { SanitizedCollectionPermission, SanitizedGlobalPermission } from '../auth/types.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { FlattenedField } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { BasePayload, CollectionSlug, GlobalSlug } from '../index.js'

import { entityToStandaloneJSONSchema } from '../utilities/configToJSONSchema.js'
import { filterFieldsByAccess } from './filterFieldsByAccess.js'

export type OperationEntityInputSchema = JSONSchema4 & Record<string, unknown>

export class OperationValidationError extends Error {
  issues: Array<{ message: string; path: string }>
  schema: OperationEntityInputSchema

  constructor({
    slug,
    entity,
    issues,
    schema,
  }: {
    entity: 'collection' | 'global'
    issues: Array<{ message: string; path: string }>
    schema: OperationEntityInputSchema
    slug: string
  }) {
    super(
      `Invalid data for ${entity} "${slug}": ${issues.map(({ message, path }) => `${path || '/'} ${message}`).join(', ')}`,
    )
    this.name = 'OperationValidationError'
    this.issues = issues
    this.schema = schema
  }
}

export const getCollectionOperationInputSchema = ({
  collection,
  i18n,
  payload,
  permissions,
}: {
  collection: CollectionSlug
  i18n?: I18n
  payload: BasePayload
  permissions?: SanitizedCollectionPermission
}): null | OperationEntityInputSchema => {
  const entity = payload.collections[collection]?.config

  if (!entity) {
    return null
  }

  return permissions
    ? getEntityInputSchema({
        entity,
        fields: filterFieldsByAccess({
          blocks: payload.config.blocks,
          fields: entity.flattenedFields,
          permissions,
          shouldExcludeField: ({ create, update }) => !create && !update,
        }),
        i18n,
        payload,
      })
    : getCachedEntityInputSchema({
        cacheKey: `collection:${collection}:${i18n?.language ?? ''}`,
        entity,
        i18n,
        payload,
      })
}

export const getGlobalOperationInputSchema = ({
  global,
  i18n,
  payload,
  permissions,
}: {
  global: GlobalSlug
  i18n?: I18n
  payload: BasePayload
  permissions?: SanitizedGlobalPermission
}): null | OperationEntityInputSchema => {
  const entity = payload.config.globals.find(({ slug }) => slug === global)

  if (!entity) {
    return null
  }

  return permissions
    ? getEntityInputSchema({
        entity,
        fields: filterFieldsByAccess({
          blocks: payload.config.blocks,
          fields: entity.flattenedFields,
          permissions,
          shouldExcludeField: ({ create, update }) => !create && !update,
        }),
        i18n,
        payload,
      })
    : getCachedEntityInputSchema({
        cacheKey: `global:${global}:${i18n?.language ?? ''}`,
        entity,
        i18n,
        payload,
      })
}

export const validateCollectionOperationData = ({
  collection,
  data,
  i18n,
  partial,
  payload,
}: {
  collection: CollectionSlug
  data: Record<string, unknown>
  i18n?: I18n
  partial?: boolean
  payload: BasePayload
}): void => {
  const schema = getCollectionOperationInputSchema({ collection, i18n, payload })

  if (schema) {
    validateEntityData({ slug: collection, data, entity: 'collection', partial, schema })
  }
}

export const validateGlobalOperationData = ({
  data,
  global,
  i18n,
  payload,
}: {
  data: Record<string, unknown>
  global: GlobalSlug
  i18n?: I18n
  payload: BasePayload
}): void => {
  const schema = getGlobalOperationInputSchema({ global, i18n, payload })

  if (schema) {
    validateEntityData({ slug: global, data, entity: 'global', partial: true, schema })
  }
}

const ajv = new AjvImport.default({ allErrors: true, strict: false })
const schemaCache = new WeakMap<object, Map<string, OperationEntityInputSchema>>()
const validatorCache = new WeakMap<object, Map<string, ReturnType<typeof ajv.compile>>>()

const validateEntityData = ({
  slug,
  data,
  entity,
  partial,
  schema,
}: {
  data: Record<string, unknown>
  entity: 'collection' | 'global'
  partial?: boolean
  schema: OperationEntityInputSchema
  slug: string
}): void => {
  let validators = validatorCache.get(schema)

  if (!validators) {
    validators = new Map()
    validatorCache.set(schema, validators)
  }

  const cacheKey = partial ? 'partial' : 'full'
  let validator = validators.get(cacheKey)

  if (!validator) {
    validator = ajv.compile(withoutSchemaDeclaration(partial ? withoutRequired(schema) : schema))
    validators.set(cacheKey, validator)
  }

  if (!validator(data)) {
    throw new OperationValidationError({
      slug,
      entity,
      issues: (validator.errors ?? []).map((error: ErrorObject) => ({
        message: error.message ?? 'is invalid',
        path: error.instancePath,
      })),
      schema,
    })
  }
}

const getEntityInputSchema = ({
  entity,
  fields,
  i18n,
  payload,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  fields?: FlattenedField[]
  i18n?: I18n
  payload: BasePayload
}): OperationEntityInputSchema => {
  const entityForSchema = fields ? { ...entity, flattenedFields: fields } : entity

  return entityToStandaloneJSONSchema({
    config: payload.config,
    defaultIDType: payload.db.defaultIDType,
    entity: entityForSchema,
    i18n,
    variant: 'input',
  }) as OperationEntityInputSchema
}

const getCachedEntityInputSchema = ({
  cacheKey,
  entity,
  i18n,
  payload,
}: {
  cacheKey: string
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  i18n?: I18n
  payload: BasePayload
}): OperationEntityInputSchema => {
  let schemas = schemaCache.get(payload.config)

  if (!schemas) {
    schemas = new Map()
    schemaCache.set(payload.config, schemas)
  }

  let schema = schemas.get(cacheKey)

  if (!schema) {
    schema = getEntityInputSchema({ entity, i18n, payload })
    schemas.set(cacheKey, schema)
  }

  return schema
}

const withoutRequired = (schema: OperationEntityInputSchema): OperationEntityInputSchema => {
  const { required: _required, ...rest } = schema

  return rest
}

const withoutSchemaDeclaration = (
  schema: OperationEntityInputSchema,
): OperationEntityInputSchema => {
  const { $schema: _schema, ...rest } = schema

  return rest
}
