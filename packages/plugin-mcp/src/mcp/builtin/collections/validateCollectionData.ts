import type { CollectionSlug, PayloadRequest } from 'payload'

import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server'

import type { JsonSchemaType, MCPToolResponse } from '../../../types.js'

import { getCollectionInputSchema } from '../../../utils/schemaConversion/getCollectionInputSchema.js'

const validator = new CfWorkerJsonSchemaValidator({ shortcircuit: false })

const partialSchema = (schema: JsonSchemaType): JsonSchemaType => {
  const { required: _required, ...rest } = schema
  return rest
}

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
}): MCPToolResponse | null => {
  const schema = getCollectionInputSchema({ collectionSlug, req })

  if (!schema) {
    return null
  }

  const result = validator.getValidator(partial ? partialSchema(schema) : schema)(data)

  if (result.valid) {
    return null
  }

  return {
    content: [
      {
        type: 'text',
        text: `Invalid data for collection "${collectionSlug}": ${result.errorMessage}\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``,
      },
    ],
    isError: true,
    structuredContent: {
      collectionSlug,
      errors: [{ message: result.errorMessage }],
      schema,
    },
  }
}
