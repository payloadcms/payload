import type { CollectionTool, JsonSchemaObject, MCPToolResponse } from '../../../types.js'

import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'

const DEFAULT_DESCRIPTION = 'Delete documents in a collection by ID or where clause.'

const inputSchema: JsonSchemaObject = {
  type: 'object',
  properties: {
    depth: {
      type: 'integer',
      default: 0,
      description: 'Depth of population for relationships in response',
      maximum: 10,
      minimum: 0,
    },
    fallbackLocale: {
      type: 'string',
      description: 'Optional: fallback locale code to use when requested locale is not available',
    },
    id: {
      type: ['string', 'number'],
      description: 'Optional: specific document ID to delete',
    },
    locale: {
      type: 'string',
      description:
        'Optional: locale code for the operation (e.g., "en", "es"). Defaults to the default locale',
    },
    where: {
      type: 'string',
      description: 'Optional: JSON string for where clause to delete multiple documents',
    },
  },
}

export const deleteCollectionTool: CollectionTool = {
  description: DEFAULT_DESCRIPTION,
  handler: async ({ authorizedMCP, collectionSlug, input, overrideResponse, req }) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    const id = input.id as number | string | undefined
    const where = input.where as string | undefined
    const depth = (input.depth as number | undefined) ?? 0
    const locale = input.locale as string | undefined
    const fallbackLocale = input.fallbackLocale as string | undefined

    const applyOverride = (response: MCPToolResponse, doc: Record<string, unknown>) =>
      overrideResponse?.(response, doc, req) || response

    logger.info(
      `Deleting document from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      if (!id && !where) {
        return applyOverride(
          {
            content: [{ type: 'text', text: 'Error: Either id or where clause must be provided' }],
          },
          {},
        )
      }

      let whereClause: Record<string, unknown> = {}
      if (where) {
        try {
          whereClause = JSON.parse(where) as Record<string, unknown>
        } catch {
          logger.warn(`Invalid where clause JSON: ${where}`)
          return applyOverride(
            { content: [{ type: 'text', text: 'Error: Invalid JSON in where clause' }] },
            {},
          )
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
        deleteOptions.where = whereClause
      }

      const result = await payload.delete(deleteOptions as Parameters<typeof payload.delete>[0])

      if (id) {
        return applyOverride(
          {
            content: [
              {
                type: 'text',
                text: `Document deleted successfully from collection "${collectionSlug}"!\nDeleted document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
              },
            ],
          },
          result as Record<string, unknown>,
        )
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

      return applyOverride({ content: [{ type: 'text', text: responseText }] }, {
        docs,
        errors,
      } as unknown as Record<string, unknown>)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error deleting document from ${collectionSlug}: ${errorMessage}`)
      return applyOverride(
        {
          content: [
            {
              type: 'text',
              text: `Error deleting document from collection "${collectionSlug}": ${errorMessage}`,
            },
          ],
        },
        {},
      )
    }
  },
  input: inputSchema,
}
