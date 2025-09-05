import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { toolSchemas } from '../schemas.js'

export const deleteResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
) => {
  const tool = async (
    id?: string,
    where?: string,
    depth: number = 0,
    overrideAccess: boolean = true,
  ) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Deleting resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}`,
      )
    }

    try {
      // Validate that either id or where is provided
      if (!id && !where) {
        payload.logger.error('[payload-mcp] Either id or where clause must be provided')
        return {
          content: [
            { type: 'text' as const, text: 'Error: Either id or where clause must be provided' },
          ],
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
          return {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in where clause' }],
          }
        }
      }

      // Build delete options
      const deleteOptions: Record<string, unknown> = {
        collection: collectionSlug,
        depth,
        overrideAccess,
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

        return {
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

        let responseText = `Multiple documents deleted from collection "${collectionSlug}"!
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

        return {
          content: [
            {
              type: 'text' as const,
              text: responseText,
            },
          ],
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error deleting resource from ${collectionSlug}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error deleting resource from collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  if (collections?.[collectionSlug]?.enabled) {
    server.tool(
      `delete${toCamelCase(collectionSlug).charAt(0).toUpperCase() + collectionSlug.slice(1)}Document`,
      `${toolSchemas.deleteResource.description.trim()}\n\n${collections?.[collectionSlug]?.description}`,
      toolSchemas.deleteResource.parameters.shape,
      async ({ id, depth, overrideAccess, where }) => {
        return await tool(id, where, depth, overrideAccess)
      },
    )
  }
}
