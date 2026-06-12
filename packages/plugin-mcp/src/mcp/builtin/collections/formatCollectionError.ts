import type { CollectionSlug, PayloadRequest } from 'payload'

import type { MCPToolResponse } from '../../../types.js'

import { getCollectionInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'

const getValidationErrors = (error: unknown): undefined | unknown[] => {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const data = 'data' in error ? error.data : undefined
  if (!data || typeof data !== 'object' || !('errors' in data) || !Array.isArray(data.errors)) {
    return undefined
  }

  return data.errors
}

const isSchemaError = (error: unknown, message: string): boolean => {
  if (getValidationErrors(error)) {
    return true
  }

  const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined

  return (
    name === 'CastError' ||
    name === 'ValidationError' ||
    message.includes('Cast to ') ||
    message.includes('validation failed')
  )
}

export const formatCollectionError = ({
  action,
  collectionSlug,
  error,
  req,
}: {
  action: 'creating' | 'updating'
  collectionSlug: CollectionSlug
  error: unknown
  req: PayloadRequest
}): MCPToolResponse => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errors = getValidationErrors(error) ?? [{ message: errorMessage }]

  if (!isSchemaError(error, errorMessage)) {
    return {
      content: [
        {
          type: 'text',
          text: `Error ${action} document in collection "${collectionSlug}": ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }

  const schema = getCollectionInputSchema({ collectionSlug, req })
  const schemaText = schema
    ? `\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``
    : ''

  return {
    content: [
      {
        type: 'text',
        text: `Error ${action} document in collection "${collectionSlug}": ${errorMessage}${schemaText}`,
      },
    ],
    isError: true,
    ...(schema
      ? {
          structuredContent: {
            collectionSlug,
            errors,
            schema,
          },
        }
      : {}),
  }
}
