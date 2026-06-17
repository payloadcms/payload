import { z } from 'zod'

import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { whereSchema } from '../../../utils/whereSchema.js'

const DEFAULT_DESCRIPTION =
  'Delete documents in any collection by passing the collection slug and ID or where clause.'

export const deleteDocumentsTool = defineCollectionTool({
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Delete Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.object({
    id: z
      .union([z.string(), z.number()])
      .describe('Optional: specific document ID to delete')
      .optional(),
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('Depth of population for relationships in response')
      .optional()
      .default(0),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    locale: z
      .string()
      .describe(
        'Optional: locale code for the operation (e.g., "en", "es"). Defaults to the default locale',
      )
      .optional(),
    where: whereSchema
      .describe(
        'Optional: where clause to delete multiple documents. Use field names with Payload operators, and/or arrays for grouping. Example: {"title":{"contains":"test"}}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { id, depth, fallbackLocale, locale, where } = input

  logger.info(
    `Deleting document from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    if (!id && !where) {
      return {
        content: [{ type: 'text', text: 'Error: Either id or where clause must be provided' }],
      }
    }

    const deleteOptions: Record<string, unknown> = {
      collection: collectionSlug,
      depth,
      req,
      ...localAPIDefaults(authorizedMCP),
      ...(locale && { locale }),
      ...(fallbackLocale && { fallbackLocale }),
    }

    if (id) {
      deleteOptions.id = id
    } else {
      deleteOptions.where = where
    }

    const result = await payload.delete(deleteOptions as Parameters<typeof payload.delete>[0])

    if (id) {
      return {
        content: [
          {
            type: 'text',
            text: `Document deleted successfully from collection "${collectionSlug}"!\nDeleted document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
        doc: result as Record<string, unknown>,
      }
    }

    const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
    const docs = bulkResult.docs || []
    const errors = bulkResult.errors || []

    let responseText = `Document deleted successfully from collection "${collectionSlug}"!\nDeleted: ${docs.length} documents\nErrors: ${errors.length}\n---`
    if (docs.length > 0) {
      responseText += `\n\nDeleted documents:\n\`\`\`json\n${JSON.stringify(docs)}\n\`\`\``
    }
    if (errors.length > 0) {
      responseText += `\n\nErrors:\n\`\`\`json\n${JSON.stringify(errors)}\n\`\`\``
    }

    return {
      content: [{ type: 'text', text: responseText }],
      doc: { docs, errors } as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error deleting document from ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting document from collection "${collectionSlug}": ${errorMessage}`,
        },
      ],
    }
  }
})
