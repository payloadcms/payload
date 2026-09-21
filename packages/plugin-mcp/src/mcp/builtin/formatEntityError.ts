import type { CollectionSlug, GlobalSlug, PayloadRequest } from 'payload'

import { getCollectionInputSchema, getGlobalInputSchema, ValidationError } from 'payload'

import type { MCPToolResponse } from '../../types.js'

export const formatEntityError = ({
  slug,
  action,
  entity,
  error,
  req,
}:
  | {
      action: 'creating' | 'duplicating' | 'updating'
      entity: 'collection'
      error: unknown
      req: PayloadRequest
      slug: CollectionSlug
    }
  | {
      action: 'updating'
      entity: 'global'
      error: unknown
      req: PayloadRequest
      slug: GlobalSlug
    }): MCPToolResponse => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const target = entity === 'collection' ? `document in collection "${slug}"` : `global "${slug}"`

  if (!isValidationError(error, message)) {
    return {
      content: [{ type: 'text', text: `Error ${action} ${target}: ${message}` }],
      isError: true,
    }
  }

  const schema =
    entity === 'collection'
      ? getCollectionInputSchema({ collectionSlug: slug, req })
      : getGlobalInputSchema({ globalSlug: slug, req })
  const errors = error instanceof ValidationError ? error.data.errors : [{ message }]
  const validationMessage = errors
    .map((issue) => `${'path' in issue ? `${issue.path}: ` : ''}${issue.message}`)
    .join('\n')
  const schemaText = schema
    ? `\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``
    : ''

  return {
    content: [
      { type: 'text', text: `Error ${action} ${target}: ${validationMessage}${schemaText}` },
    ],
    isError: true,
    ...(schema
      ? {
          structuredContent: {
            slug,
            errors,
            schema,
          },
        }
      : {}),
  }
}

const isValidationError = (error: unknown, message: string): boolean => {
  if (error instanceof ValidationError) {
    return true
  }

  const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined

  return (
    name === 'CastError' || message.includes('Cast to ') || message.includes('validation failed')
  )
}
