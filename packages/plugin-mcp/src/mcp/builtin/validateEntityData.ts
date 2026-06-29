import type { CollectionSlug, GlobalSlug, PayloadRequest, SanitizedConfig } from 'payload'

import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server'

import type { JsonSchemaType, MCPToolResponse } from '../../types.js'

import {
  getCollectionInputSchema,
  getGlobalInputSchema,
} from '../../utils/schemaConversion/getEntityInputSchema.js'

/**
 * Keep the default `shortcircuit: true` - `false` makes validating nested rich text exponentially slow.
 */
const validator = new CfWorkerJsonSchemaValidator({ shortcircuit: true })

type EntityValidator = {
  schema: JsonSchemaType
  validate: ReturnType<(typeof validator)['getValidator']>
}

/**
 * - Caches each entity's schema and validator, so both are only built on the first request.
 * - Keyed by payload config, then by entity type, slug, partial and language.
 */
const validatorCache = new WeakMap<SanitizedConfig, Map<string, EntityValidator>>()

export const validateCollectionData = ({
  collectionSlug,
  data,
  partial,
  req,
}: {
  collectionSlug: CollectionSlug
  data: Record<string, unknown>
  partial?: boolean
  req: PayloadRequest
}): MCPToolResponse | null =>
  validateData({
    slug: collectionSlug,
    buildSchema: () => getCollectionInputSchema({ collectionSlug, req }),
    data,
    entity: 'collection',
    partial,
    req,
  })

export const validateGlobalData = ({
  data,
  globalSlug,
  req,
}: {
  data: Record<string, unknown>
  globalSlug: GlobalSlug
  req: PayloadRequest
}): MCPToolResponse | null =>
  validateData({
    slug: globalSlug,
    buildSchema: () => getGlobalInputSchema({ globalSlug, req }),
    data,
    entity: 'global',
    partial: true,
    req,
  })

const validateData = ({
  slug,
  buildSchema,
  data,
  entity,
  partial,
  req,
}: {
  buildSchema: () => JsonSchemaType | null
  data: Record<string, unknown>
  entity: 'collection' | 'global'
  partial?: boolean
  req: PayloadRequest
  slug: string
}): MCPToolResponse | null => {
  let cache = validatorCache.get(req.payload.config)
  if (!cache) {
    cache = new Map()
    validatorCache.set(req.payload.config, cache)
  }

  const cacheKey = `${entity}:${slug}:${partial ? 'partial' : 'full'}:${req.i18n.language}`
  let entityValidator = cache.get(cacheKey)

  if (!entityValidator) {
    const schema = buildSchema()

    if (!schema) {
      return null
    }

    entityValidator = {
      schema,
      validate: validator.getValidator(partial ? withoutRequired(schema) : schema),
    }
    cache.set(cacheKey, entityValidator)
  }

  const result = entityValidator.validate(data)

  if (result.valid) {
    return null
  }

  const { schema } = entityValidator

  return {
    content: [
      {
        type: 'text',
        text: `Invalid data for ${entity} "${slug}": ${result.errorMessage}\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``,
      },
    ],
    isError: true,
    structuredContent: {
      [`${entity}Slug`]: slug,
      errors: [{ message: result.errorMessage }],
      schema,
    },
  }
}

/** Updates are partial — drop the schema's top-level `required` before validating. */
const withoutRequired = (schema: JsonSchemaType): JsonSchemaType => {
  const { required: _required, ...rest } = schema
  return rest
}
