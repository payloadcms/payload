import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest, TypedUser } from 'payload'

import type { MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const deleteResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  collectionSlug: string,
  collections: MCPPluginConfig['collections'],
) => {
  const tool = async (
    id?: number | string,
    where?: string,
    depth: number = 0,
    locale?: string,
    fallbackLocale?: string,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(
      `Deleting resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      // Validate that either id or where is provided
      if (!id && !where) {
        logger.error('Either id or where clause must be provided')
        const response = {
          content: [
            { type: 'text' as const, text: 'Error: Either id or where clause must be provided' },
          ],
        }
        return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
          response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      }

      // Parse where clause if provided
      let whereClause = {}
      if (where) {
        try {
          whereClause = JSON.parse(where)
          logger.info(`Using where clause: ${where}`)
        } catch (_parseError) {
          logger.warn(`Invalid where clause JSON: ${where}`)
          const response = {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in where clause' }],
          }
          return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
            response) as {
            content: Array<{
              text: string
              type: 'text'
            }>
          }
        }
      }

      // Build delete options
      const deleteOptions: Record<string, unknown> = {
        collection: collectionSlug,
        depth,
        overrideAccess: false,
        req,
        user,
        ...(locale && { locale }),
        ...(fallbackLocale && { fallbackLocale }),
      }

      // Delete by ID or where clause
      if (id) {
        deleteOptions.id = id
        logger.info(`Deleting single document with ID: ${id}`)
      } else {
        deleteOptions.where = whereClause
        logger.info(`Deleting multiple documents with where clause`)
      }

      const result = await payload.delete(deleteOptions as Parameters<typeof payload.delete>[0])

      // Handle different result types
      if (id) {
        // Single document deletion
        logger.info(`Successfully deleted document with ID: ${id}`)

        const response = {
          content: [
            {
              type: 'text' as const,
              text: `Document deleted successfully from collection "${collectionSlug}"!
Deleted document:
\`\`\`json
${JSON.stringify(result)}
\`\`\``,
            },
          ],
        }

        return (collections?.[collectionSlug]?.overrideResponse?.(response, result, req) ||
          response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      } else {
        // Multiple documents deletion
        const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
        const docs = bulkResult.docs || []
        const errors = bulkResult.errors || []

        logger.info(`Successfully deleted ${docs.length} documents, ${errors.length} errors`)

        let responseText = `Document deleted successfully from collection "${collectionSlug}"!
Deleted: ${docs.length} documents
Errors: ${errors.length}
---`

        if (docs.length > 0) {
          responseText += `\n\nDeleted documents:
\`\`\`json
${JSON.stringify(docs)}
\`\`\``
        }

        if (errors.length > 0) {
          responseText += `\n\nErrors:
\`\`\`json
${JSON.stringify(errors)}
\`\`\``
        }

        const response = {
          content: [
            {
              type: 'text' as const,
              text: responseText,
            },
          ],
        }

        return (collections?.[collectionSlug]?.overrideResponse?.(
          response,
          { docs, errors },
          req,
        ) || response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error deleting resource from ${collectionSlug}: ${errorMessage}`)

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Error deleting resource from collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }

      return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response) as {
        content: Array<{
          text: string
          type: 'text'
        }>
      }
    }
  }

  if (collections?.[collectionSlug]?.enabled) {
    server.registerTool(
      `delete${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      {
        description: `${collections?.[collectionSlug]?.description || toolSchemas.deleteResource.description.trim()}`,
        inputSchema: zodToInputSchema(toolSchemas.deleteResource.parameters),
      },
      async ({ id, depth, fallbackLocale, locale, where }: any) => {
        return await tool(id, where, depth, locale, fallbackLocale)
      },
    )
  }
}
