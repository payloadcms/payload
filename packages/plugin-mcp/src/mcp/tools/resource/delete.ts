import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { validateCollectionSlug } from '../../helpers/validation.js'
import { toolSchemas } from '../schemas.js'

export const deleteResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collections: Partial<Record<string, true>>,
) => {
  const tool = async (
    collection: string,
    id?: string,
    where?: string,
    depth: number = 0,
    overrideAccess: boolean = true,
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
        `[payload-mcp] Deleting resource from collection: ${collection}${id ? ` with ID: ${id}` : ' with where clause'}`,
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
        collection,
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
        const singleResult = result as Record<string, unknown>
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Successfully deleted document with ID: ${id}`)
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Document deleted successfully from collection "${collection}"!`,
            },
            { type: 'text' as const, text: `ID: ${String((singleResult as { id?: unknown }).id)}` },
            { type: 'text' as const, text: '---' },
            { type: 'text' as const, text: 'Deleted document:' },
            { type: 'text' as const, text: '```json' },
            { type: 'text' as const, text: JSON.stringify(result, null, 2) },
            { type: 'text' as const, text: '```' },
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

        const results = []
        results.push({
          type: 'text' as const,
          text: `Multiple documents deleted from collection "${collection}"!`,
        })
        results.push({ type: 'text' as const, text: `Deleted: ${docs.length} documents` })
        results.push({ type: 'text' as const, text: `Errors: ${errors.length}` })
        results.push({ type: 'text' as const, text: '---' })

        if (docs.length > 0) {
          results.push({ type: 'text' as const, text: 'Deleted documents:' })
          results.push({ type: 'text' as const, text: '```json' })
          results.push({ type: 'text' as const, text: JSON.stringify(docs, null, 2) })
          results.push({ type: 'text' as const, text: '```' })
        }

        if (errors.length > 0) {
          results.push({ type: 'text' as const, text: 'Errors:' })
          results.push({ type: 'text' as const, text: '```json' })
          results.push({ type: 'text' as const, text: JSON.stringify(errors, null, 2) })
          results.push({ type: 'text' as const, text: '```' })
        }

        return { content: results }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error deleting resource from ${collection}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error deleting resource from collection "${collection}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.tool(
    'deleteResource',
    (() => {
      const collectionSlugs = Object.keys(collections || {})
      const baseDesc = toolSchemas.deleteResource.description.trim()
      const punctuated = baseDesc.endsWith('.') ? baseDesc : `${baseDesc}.`
      return `${punctuated} Possible collections are: ${collectionSlugs.join(', ')}`
    })(),
    toolSchemas.deleteResource.parameters.shape,
    async ({ id, collection, depth, overrideAccess, where }) => {
      return await tool(collection, id, where, depth, overrideAccess)
    },
  )
}
