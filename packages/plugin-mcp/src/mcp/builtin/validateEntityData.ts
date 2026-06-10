import type { CollectionSlug, GlobalSlug, PayloadRequest } from 'payload'

import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server'

import type { JsonSchemaType, MCPToolResponse } from '../../types.js'

import {
  getCollectionInputSchema,
  getGlobalInputSchema,
} from '../../utils/schemaConversion/getEntityInputSchema.js'

const validator = new CfWorkerJsonSchemaValidator({ shortcircuit: false })

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
    data,
    entity: 'collection',
    partial,
    schema: getCollectionInputSchema({ collectionSlug, req }),
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
    data,
    entity: 'global',
    partial: true,
    schema: getGlobalInputSchema({ globalSlug, req }),
  })

const validateData = ({
  slug,
  data,
  entity,
  partial,
  schema,
}: {
  data: Record<string, unknown>
  entity: 'collection' | 'global'
  partial?: boolean
  schema: JsonSchemaType | null
  slug: string
}): MCPToolResponse | null => {
  if (!schema) {
    return null
  }

  const result = validator.getValidator(partial ? withoutRequired(schema) : schema)(data)

  if (result.valid) {
    return null
  }

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
