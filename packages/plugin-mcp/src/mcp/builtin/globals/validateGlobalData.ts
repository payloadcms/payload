import type { GlobalSlug, PayloadRequest } from 'payload'

import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server'

import type { JsonSchemaType, MCPToolResponse } from '../../../types.js'

import { getGlobalInputSchema } from '../../../utils/schemaConversion/getGlobalInputSchema.js'

const validator = new CfWorkerJsonSchemaValidator({ shortcircuit: false })

const partialSchema = (schema: JsonSchemaType): JsonSchemaType => {
  const { required: _required, ...rest } = schema
  return rest
}

export const validateGlobalData = ({
  data,
  globalSlug,
  req,
}: {
  data: Record<string, unknown>
  globalSlug: GlobalSlug
  req: PayloadRequest
}): MCPToolResponse | null => {
  const schema = getGlobalInputSchema({ globalSlug, req })

  if (!schema) {
    return null
  }

  const result = validator.getValidator(partialSchema(schema))(data)

  if (result.valid) {
    return null
  }

  return {
    content: [
      {
        type: 'text',
        text: `Invalid data for global "${globalSlug}": ${result.errorMessage}\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``,
      },
    ],
    isError: true,
    structuredContent: {
      errors: [{ message: result.errorMessage }],
      globalSlug,
      schema,
    },
  }
}
