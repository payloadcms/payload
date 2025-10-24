import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest, TypedUser } from 'payload'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { toolSchemas } from '../schemas.js'

export const deleteResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
) => {
  const tool = async (
    id?: string,
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

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Deleting resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`,
      )
    }

    try {
      // Validate that either id or where is provided
      if (!id && !where) {
        payload.logger.error('[payload-mcp] Either id or where clause must be provided')
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
          if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Using where clause: ${where}`)
          }
        } catch (_parseError) {
          payload.logger.warn(`[payload-mcp] Invalid where clause JSON: ${where}`)
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
        user,
        ...(locale && { locale }),
        ...(fallbackLocale && { fallbackLocale }),
      }

      // Delete by ID or where clause
      if (id) {
        deleteOptions.id = id
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Deleting single document with ID: ${id}`)
        }
      } else {
        deleteOptions.where = whereClause
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Deleting multiple documents with where clause`)
        }
      }

      const result = await payload.delete(deleteOptions as Parameters<typeof payload.delete>[0])

      // Handle different result types
      if (id) {
        // Single document deletion
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Successfully deleted document with ID: ${id}`)
        }

        const response = {
          content: [
            {
              type: 'text' as const,
              text: `Document deleted successfully from collection "${collectionSlug}"!
Deleted document:
\`\`\`json
${JSON.stringify(result, null, 2)}
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

        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Successfully deleted ${docs.length} documents, ${errors.length} errors`,
          )
        }

        let responseText = `Document deleted successfully from collection "${collectionSlug}"!
Deleted: ${docs.length} documents
Errors: ${errors.length}
---`

        if (docs.length > 0) {
          responseText += `\n\nDeleted documents:
\`\`\`json
${JSON.stringify(docs, null, 2)}
\`\`\``
        }

        if (errors.length > 0) {
          responseText += `\n\nErrors:
\`\`\`json
${JSON.stringify(errors, null, 2)}
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
      payload.logger.error(
        `[payload-mcp] Error deleting resource from ${collectionSlug}: ${errorMessage}`,
      )

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
    server.tool(
      `delete${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      `${toolSchemas.deleteResource.description.trim()}\n\n${collections?.[collectionSlug]?.description || ''}`,
      toolSchemas.deleteResource.parameters.shape,
      async ({ id, depth, fallbackLocale, locale, where }) => {
        return await tool(id, where, depth, locale, fallbackLocale)
      },
    )
  }
}
