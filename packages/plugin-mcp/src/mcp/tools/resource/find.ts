import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { validateCollectionSlug } from '../../helpers/validation.js'
import { toolSchemas } from '../schemas.js'

export const findResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collections: Partial<Record<string, true>>,
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

    const validationError = validateCollectionSlug(collection, collections)
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
              { type: 'text' as const, text: `Resource from collection "${collection}":` },
              { type: 'text' as const, text: `ID: ${doc.id}` },
              { type: 'text' as const, text: '---' },
              { type: 'text' as const, text: JSON.stringify(doc, null, 2) },
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

      const results = []
      results.push({
        type: 'text' as const,
        text: `Resources from collection "${collection}":`,
      })
      results.push({
        type: 'text' as const,
        text: `Total: ${result.totalDocs} documents`,
      })
      results.push({
        type: 'text' as const,
        text: `Page: ${result.page} of ${result.totalPages}`,
      })
      results.push({
        type: 'text' as const,
        text: `Showing: ${result.docs.length} documents`,
      })
      results.push({ type: 'text' as const, text: '---' })

      for (const doc of result.docs) {
        results.push({
          type: 'text' as const,
          text: `**Document ID: ${doc.id}**\n\`\`\`json\n${JSON.stringify(doc, null, 2)}\n\`\`\`\n---`,
        })
      }

      return {
        content: results,
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

  server.tool(
    'findResource',
    (() => {
      const collectionSlugs = Object.keys(collections || {})
      const baseDesc = toolSchemas.findResources.description.trim()
      const punctuated = baseDesc.endsWith('.') ? baseDesc : `${baseDesc}.`
      return `${punctuated} Possible collections are: ${collectionSlugs.join(', ')}`
    })(),
    toolSchemas.findResources.parameters.shape,
    async ({ id, collection, limit, page, sort, where }) => {
      return await tool(collection, id, limit, page, sort, where)
    },
  )
}
