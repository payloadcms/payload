import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import type { PluginMCPServerConfig } from '../../../types.js'

import { validateCollectionSlug } from '../../helpers/validation.js'
import { toolSchemas } from '../schemas.js'

export const findResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collections: PluginMCPServerConfig['collections'],
) => {
  const tool = async (
    collection: string,
    id?: string,
    limit: number = 10,
    page: number = 1,
    sort?: string,
    where?: string,
  ) => {
    const payload = req.payload

    const collectionKeys = Object.keys(collections || {})
    const collectionNames = collectionKeys.reduce(
      (acc, key) => {
        acc[key] = true
        return acc
      },
      {} as Record<string, true>,
    )
    const validationError = validateCollectionSlug(collection, collectionNames)
    if (validationError) {
      payload.logger.warn(`[payload-mcp] Validation error for ${collection}: ${validationError}`)
      return {
        content: [{ type: 'text' as const, text: `Validation Error: ${validationError}` }],
      }
    }

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Reading resource from collection: ${collection}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}`,
      )
    }

    try {
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

      // If ID is provided, use findByID
      if (id) {
        try {
          const doc = await payload.findByID({
            id,
            collection,
          })

          if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Found document with ID: ${id}`)
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: `Resource from collection "${collection}":
${JSON.stringify(doc, null, 2)}`,
              },
            ],
          }
        } catch (_findError) {
          payload.logger.warn(
            `[payload-mcp] Document not found with ID: ${id} in collection: ${collection}`,
          )
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Document with ID "${id}" not found in collection "${collection}"`,
              },
            ],
          }
        }
      }

      // Otherwise, use find to get multiple documents
      const findOptions: Parameters<typeof payload.find>[0] = {
        collection,
        limit,
        page,
      }

      if (sort) {
        findOptions.sort = sort
      }

      if (Object.keys(whereClause).length > 0) {
        findOptions.where = whereClause
      }

      const result = await payload.find(findOptions)

      if (verboseLogs) {
        payload.logger.info(
          `[payload-mcp] Found ${result.docs.length} documents in collection: ${collection}`,
        )
      }

      let responseText = `Resources from collection "${collection}":
Total: ${result.totalDocs} documents
Page: ${result.page} of ${result.totalPages}
Showing: ${result.docs.length} documents
---`

      for (const doc of result.docs) {
        responseText += `\`\`\`json\n${JSON.stringify(doc, null, 2)}\n\`\`\``
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: responseText,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error reading resources from collection ${collection}: ${errorMessage}`,
      )
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error reading resources from collection "${collection}":** ${errorMessage}`,
          },
        ],
      }
    }
  }

  const collectionSlugs = Object.keys(collections || {})
  collectionSlugs.forEach((collectionSlug) => {
    if (!collections?.[collectionSlug]?.enabled) {
      return
    }

    server.tool(
      `find${collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)}Document`,
      `${toolSchemas.findResources.description.trim()}\n\n${collections?.[collectionSlug]?.description}`,
      toolSchemas.findResources.parameters.shape,
      async ({ id, collection, limit, page, sort, where }) => {
        return await tool(collection, id, limit, page, sort, where)
      },
    )
  })
}
